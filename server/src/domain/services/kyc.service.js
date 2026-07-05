import { findByEmail, updateUserKycStatus } from '../../infrastructure/database/user.database.js';
import { createDiditSession, getSessionStatus, getDecision } from '../../infrastructure/providers/didit.provider.js';
import { createHttpError } from '../../lib/errors.js';
const KYC_STATUS_LABELS = {
    NOT_STARTED: 'no iniciada',
    IN_REVIEW: 'en revisión',
    APPROVED: 'aprobada',
    DECLINED: 'rechazada',
    EXPIRED: 'expirada',
};
const NOTIFIABLE_STATUSES = ['APPROVED', 'DECLINED'];
const DIDIT_STATUS_MAP = {
    Approved: 'APPROVED',
    Declined: 'DECLINED',
    Expired: 'EXPIRED',
    Abandoned: 'EXPIRED',
    'Kyc Expired': 'EXPIRED',
    'In Review': 'IN_REVIEW',
    Resubmitted: 'IN_REVIEW',
    'Awaiting User': 'IN_REVIEW',
    'In Progress': 'IN_REVIEW',
    'Not Started': 'NOT_STARTED',
    'Not Finished': 'IN_REVIEW',
};
const DIDIT_STATUS_MAP_LOWER = Object.fromEntries(Object.entries(DIDIT_STATUS_MAP).map(([k, v]) => [k.toLowerCase(), v]));
function mapDiditStatus(raw) {
    const exact = DIDIT_STATUS_MAP[raw];
    if (exact)
        return exact;
    const lower = DIDIT_STATUS_MAP_LOWER[raw.toLowerCase()];
    if (lower)
        return lower;
    console.warn(`[KYC] Status desconocido de Didit: "${raw}", mapeando a IN_REVIEW`);
    return 'IN_REVIEW';
}
export const startKycVerification = async (email) => {
    const user = await findByEmail(email);
    if (!user) {
        throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos');
    }
    if (user.kycStatus === 'APPROVED') {
        throw createHttpError(409, 'Ya tenés la verificación aprobada');
    }
    if (user.kycStatus === 'IN_REVIEW') {
        throw createHttpError(409, 'Ya tenés una verificación en curso');
    }
    return createDiditSession(user.email);
};
export const confirmKyc = async (email, sessionId, sdkStatus) => {
    const user = await findByEmail(email);
    if (!user) {
        throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos');
    }
    let diditStatus;
    let lastError = null;
    try {
        const decision = await getDecision(sessionId);
        diditStatus = decision.status;
    }
    catch (e) {
        lastError = e;
        if (sdkStatus) {
            diditStatus = sdkStatus;
        }
        else {
            try {
                const session = await getSessionStatus(sessionId);
                diditStatus = session.status;
            }
            catch {
                throw lastError.status === 404
                    ? createHttpError(404, 'La sesión de verificación no existe')
                    : createHttpError(502, 'No se pudo obtener el estado de la verificación');
            }
        }
    }
    const mappedStatus = mapDiditStatus(diditStatus);
    const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
        ? new Date()
        : null;
    await updateUserKycStatus(email, {
        kycStatus: mappedStatus,
        kycVerifiedAt: now,
        diditVerificationId: sessionId,
    });
    return { status: mappedStatus, sessionId };
};
export const getKycStatus = async (email) => {
    const user = await findByEmail(email);
    if (!user) {
        throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos');
    }
    let kycStatus = user.kycStatus ?? 'NOT_STARTED';
    let kycVerifiedAt = user.kycVerifiedAt ?? null;
    const TERMINAL_STATUSES = ['APPROVED', 'DECLINED', 'EXPIRED', 'IN_REVIEW'];
    if (TERMINAL_STATUSES.includes(kycStatus) && user.diditVerificationId) {
        let diditStatus = null;
        try {
            const decision = await getDecision(user.diditVerificationId);
            diditStatus = decision.status;
        }
        catch {
            try {
                const session = await getSessionStatus(user.diditVerificationId);
                diditStatus = session.status;
            }
            catch {
                // Ambos endpoints fallaron, mantener status actual
            }
        }
        if (diditStatus) {
            const mappedStatus = mapDiditStatus(diditStatus);
            if (mappedStatus !== kycStatus) {
                console.log(`[KYC] Status cambió para ${email}: ${kycStatus} → ${mappedStatus}`);
                const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
                    ? new Date()
                    : null;
                await updateUserKycStatus(email, {
                    kycStatus: mappedStatus,
                    kycVerifiedAt: now,
                    diditVerificationId: user.diditVerificationId,
                });
                kycStatus = mappedStatus;
                kycVerifiedAt = now;
            }
        }
    }
    return { kycStatus, kycVerifiedAt, diditVerificationId: user.diditVerificationId ?? null };
};
export const getKycDecision = async (sessionId) => {
    const decision = await getDecision(sessionId);
    return {
        sessionId: decision.sessionId,
        status: mapDiditStatus(decision.status),
        sessionKind: decision.sessionKind,
        vendorData: decision.vendorData,
        idVerifications: decision.idVerifications,
        livenessChecks: decision.livenessChecks,
        faceMatches: decision.faceMatches,
        amlScreenings: decision.amlScreenings,
    };
};
export const handleKycWebhook = async (payload) => {
    if (payload.webhook_type !== 'status.updated') {
        return { processed: false };
    }
    const email = payload.vendor_data;
    if (!email) {
        console.warn('[KYC] Webhook sin vendor_data, ignorando:', payload.event_id);
        return { processed: false };
    }
    const user = await findByEmail(email);
    if (!user) {
        console.warn('[KYC] Webhook para usuario inexistente:', email);
        return { processed: false };
    }
    const mappedStatus = mapDiditStatus(payload.status);
    if (user.kycStatus === mappedStatus) {
        return { processed: false };
    }
    const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
        ? new Date()
        : null;
    await updateUserKycStatus(email, {
        kycStatus: mappedStatus,
        kycVerifiedAt: now,
        diditVerificationId: payload.session_id,
    });
    console.log(`[KYC] Webhook procesado: ${email} → ${mappedStatus} (event: ${payload.event_id})`);
    if (NOTIFIABLE_STATUSES.includes(mappedStatus)) {
        notifyKycStatus(email, user.name ?? email, mappedStatus).catch((err) => {
            console.error('[KYC] Error enviando notificación:', err);
        });
    }
    return { processed: true };
};
async function notifyKycStatus(toEmail, _userName, status) {
    const label = KYC_STATUS_LABELS[status];
    console.log(`[KYC][EMAIL] Notificación → ${toEmail}: tu verificación fue ${label}`);
    // TODO: integrar con proveedor de email (SendGrid, SES, etc.)
    // Ejemplo futuro con SendGrid:
    // await sendGridMail.send({
    //   from: 'noreply@homefix.com',
    //   to: toEmail,
    //   subject: `HomeFix - Verificación ${label}`,
    //   text: `Hola ${userName}, tu verificación de identidad fue ${label}.`,
    // })
}
