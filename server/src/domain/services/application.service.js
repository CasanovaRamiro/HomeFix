import { findApplicationsByWorker, findApplication, createApplication, findApplicationById, updateApplicationStatus, deleteApplication, findApplicationsByPost, } from '../../infrastructure/database/application.database.js';
import prisma from '../../lib/prisma.js';
import { findPostById, updatePostStatus, incrementPostFilledCount, decrementPostFilledCount, findPostCategories } from '../../infrastructure/database/post.database.js';
import { findUserById } from '../../infrastructure/database/user.database.js';
import { getClientRating } from './user.service.js';
import { createTelegramProvider } from '../../infrastructure/providers/telegram.provider.js';
import { notifyUser } from './notification.service.js';
import { ApplicationStatus } from '../types/applicationStatus.js';
import { PostStatus } from '../types/postStatus.js';
import { PostType } from '../types/postType.js';
let _provider;
const getProvider = () => {
    if (!_provider)
        _provider = createTelegramProvider();
    return _provider;
};
export const getMyApplications = async (workerId) => {
    const apps = await findApplicationsByWorker(workerId);
    return Promise.all(apps.map(async (app) => {
        const rating = app.clientId ? await getClientRating(app.clientId) : { averageRating: 0, reviewCount: 0 };
        return { ...app, clientRating: rating.averageRating };
    }));
};
export const cancelApplication = async (workerId, applicationId) => {
    const result = await deleteApplication(workerId, applicationId);
    if (result.count === 0)
        throw Object.assign(new Error('Postulación no encontrada o no cancelable'), { status: 404 });
    return { message: 'Postulación cancelada' };
};
export const applyToPost = async (workerId, input) => {
    const post = await findPostById(input.postId);
    if (!post)
        throw Object.assign(new Error('Post not found'), { status: 404 });
    if (post.status !== PostStatus.Active)
        throw Object.assign(new Error('Esta publicación ya no está disponible'), { status: 400 });
    if (post.userId === workerId)
        throw Object.assign(new Error('No puedes postularte a tu propio trabajo'), { status: 400 });
    if (input.availableDays && input.availableDays.length > 0) {
        const minDate = post.startDate.toISOString().split('T')[0];
        const maxDate = post.endDate.toISOString().split('T')[0];
        const outOfRange = input.availableDays.some((day) => day < minDate || day > maxDate);
        if (outOfRange) {
            throw Object.assign(new Error('Las fechas seleccionadas deben estar dentro del rango de la publicación'), { status: 400 });
        }
    }
    const existing = await findApplication(workerId, input.postId);
    if (existing)
        throw Object.assign(new Error('You already applied to this post'), { status: 409 });
    if (input.chargesVisit && (input.visitCost == null || input.visitCost <= 0))
        throw Object.assign(new Error('visitCost must be a positive number when chargesVisit is true'), { status: 400 });
    const created = await createApplication(workerId, input);
    const worker = await findUserById(workerId);
    notifyUser(getProvider(), post.userId, 'application_new', {
        workerName: worker ? `${worker.name}` : 'Alguien',
        postTitle: post.title,
    });
    return { id: created.id, status: created.status, message: 'Application successful' };
};
export const applyToBidding = async (workerId, input) => {
    const post = await findPostById(input.postId);
    if (!post)
        throw Object.assign(new Error('Licitación no encontrada'), { status: 404 });
    if (!post.isBidding)
        throw Object.assign(new Error('Esta publicación no es una licitación'), { status: 400 });
    if (post.status !== PostStatus.Active)
        throw Object.assign(new Error('Esta licitación ya no está disponible'), { status: 400 });
    if (post.userId === workerId)
        throw Object.assign(new Error('No puedes postularte a tu propia licitación'), { status: 400 });
    if (input.visitCost == null || input.visitCost <= 0)
        throw Object.assign(new Error('offeredCost es requerido y debe ser un número positivo'), { status: 400 });
    if (input.offeredDuration == null || input.offeredDuration <= 0)
        throw Object.assign(new Error('offeredDuration es requerido y debe ser un número positivo'), { status: 400 });
    const existing = await findApplication(workerId, input.postId);
    if (existing)
        throw Object.assign(new Error('Ya te postulaste a esta licitación'), { status: 409 });
    const created = await createApplication(workerId, {
        postId: input.postId,
        visitCost: input.visitCost,
        offeredDuration: input.offeredDuration,
        scheduledDate: input.scheduledDate,
        message: input.message,
    });
    const worker = await findUserById(workerId);
    notifyUser(getProvider(), post.userId, 'application_new', {
        workerName: worker ? worker.name : 'Alguien',
        postTitle: post.title,
    });
    return { id: created.id, status: created.status, message: 'Oferta enviada exitosamente' };
};
export const applyToSubcontract = async (workerId, input) => {
    const post = await findPostById(input.postId);
    if (!post)
        throw Object.assign(new Error('Subcontratación no encontrada'), { status: 404 });
    if (post.type !== PostType.SubContract)
        throw Object.assign(new Error('Esta publicación no es una subcontratación'), { status: 400 });
    if (post.status !== PostStatus.Active)
        throw Object.assign(new Error('Esta subcontratación ya no está disponible'), { status: 400 });
    if (post.userId === workerId)
        throw Object.assign(new Error('No puedes postularte a tu propia subcontratación'), { status: 400 });
    if (!input.categoryId)
        throw Object.assign(new Error('Debes seleccionar un rubro para postularte'), { status: 400 });
    const category = post.categories.find((c) => c.id === input.categoryId);
    if (!category)
        throw Object.assign(new Error('El rubro seleccionado no pertenece a esta subcontratación'), { status: 400 });
    if ((category.quantity != null ? category.filledCount >= category.quantity : true)) {
        throw Object.assign(new Error('No hay vacantes disponibles en este rubro'), { status: 400 });
    }
    const existing = await findApplication(workerId, input.postId, input.categoryId);
    if (existing)
        throw Object.assign(new Error('Ya te postulaste a este rubro'), { status: 409 });
    if (input.chargesVisit && (input.visitCost == null || input.visitCost <= 0))
        throw Object.assign(new Error('visitCost debe ser un número positivo cuando chargesVisit es true'), { status: 400 });
    const created = await createApplication(workerId, {
        ...input,
        categoryId: category.id,
        subcontractGroupId: post.subcontractGroupId ?? undefined,
    });
    const worker = await findUserById(workerId);
    notifyUser(getProvider(), post.userId, 'application_new', {
        workerName: worker ? worker.name : 'Alguien',
        postTitle: post.title,
    });
    return { id: created.id, status: created.status, message: 'Postulación a subcontrato exitosa' };
};
export const acceptApplication = async (clientId, applicationId, scheduledDate) => {
    const application = await findApplicationById(applicationId);
    if (!application)
        throw Object.assign(new Error('Application not found'), { status: 404 });
    if (application.post.userId !== clientId)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    if (application.status !== ApplicationStatus.Pending)
        throw Object.assign(new Error('Application is not pending'), { status: 400 });
    if (application.post.status !== PostStatus.Active)
        throw Object.assign(new Error('Post is not active'), { status: 400 });
    if (application.post.type === PostType.SubContract) {
        if (!application.category || application.category.filledCount >= application.category.quantity) {
            throw Object.assign(new Error('No hay vacantes disponibles en este rubro'), { status: 400 });
        }
    }
    try {
        await prisma.$transaction(async (tx) => {
            const updated = await tx.application.updateMany({
                where: { id: applicationId, status: ApplicationStatus.Pending },
                data: {
                    status: ApplicationStatus.Accepted,
                    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                },
            });
            if (updated.count === 0) {
                throw Object.assign(new Error('Application is not pending'), { status: 400 });
            }
            if (application.post.type === PostType.SubContract) {
                await incrementPostFilledCount(application.postId, application.categoryId ?? undefined);
            }
            else {
                await updatePostStatus(application.postId, PostStatus.InProgress);
            }
        });
    }
    catch (err) {
        const error = err;
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
            throw Object.assign(new Error('El trabajador ya fue contratado para otro rubro'), { status: 400 });
        }
        throw err;
    }
    notifyUser(getProvider(), application.workerId, 'application_accepted', {
        postTitle: application.post.title,
    });
    return { id: applicationId, status: ApplicationStatus.Accepted };
};
export const rejectApplication = async (clientId, applicationId) => {
    const application = await findApplicationById(applicationId);
    if (!application)
        throw Object.assign(new Error('Application not found'), { status: 404 });
    if (application.post.userId !== clientId)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    if (application.status !== ApplicationStatus.Pending)
        throw Object.assign(new Error('Application is not pending'), { status: 400 });
    const rejected = await updateApplicationStatus(applicationId, ApplicationStatus.Rejected);
    notifyUser(getProvider(), application.workerId, 'application_rejected', {
        postTitle: application.post.title,
    });
    return { id: rejected.id, status: rejected.status };
};
export const dismissWorker = async (clientId, applicationId) => {
    const application = await findApplicationById(applicationId);
    if (!application)
        throw Object.assign(new Error('Application not found'), { status: 404 });
    if (application.post.userId !== clientId)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    if (application.status !== ApplicationStatus.Accepted)
        throw Object.assign(new Error('Application is not accepted'), { status: 400 });
    const isSubContract = application.post.type === PostType.SubContract;
    if (isSubContract) {
        if (application.post.status !== PostStatus.Active && application.post.status !== PostStatus.InProgress) {
            throw Object.assign(new Error('Post is not active or in progress'), { status: 400 });
        }
    }
    else if (application.post.status !== PostStatus.InProgress) {
        throw Object.assign(new Error('Post is not in progress'), { status: 400 });
    }
    const dismissed = await updateApplicationStatus(applicationId, ApplicationStatus.Dismissed);
    if (isSubContract) {
        await decrementPostFilledCount(application.postId, application.categoryId ?? undefined);
        const categories = await findPostCategories(application.postId);
        const anyFilled = categories.some((c) => c.filledCount > 0);
        if (!anyFilled && application.post.status === PostStatus.InProgress) {
            await updatePostStatus(application.postId, PostStatus.Active);
        }
    }
    else {
        await updatePostStatus(application.postId, PostStatus.Active);
    }
    notifyUser(getProvider(), application.workerId, 'worker_dismissed', {
        postTitle: application.post.title,
    });
    return { id: dismissed.id, status: dismissed.status };
};
export const getPostApplications = (clientId, postId) => findPostById(postId).then((post) => {
    if (!post)
        throw Object.assign(new Error('Post not found'), { status: 404 });
    if (post.userId !== clientId)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    return findApplicationsByPost(postId);
});
