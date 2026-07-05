import { findUserById } from '../../infrastructure/database/user.database.js';
import prisma from '../../lib/prisma.js';
import { env } from '../../lib/envConfig.js';
const templates = {
    application_new: (d) => ({
        text: `📩 <b>Nuevo postulante</b>\n${d.workerName} se postuló a "${d.postTitle}"`,
        parseMode: 'HTML',
    }),
    application_accepted: (d) => ({
        text: `✅ <b>Postulación aceptada</b>\nTu postulación a "${d.postTitle}" fue aceptada`,
        parseMode: 'HTML',
    }),
    application_rejected: (d) => ({
        text: `❌ <b>Postulación rechazada</b>\nTu postulación a "${d.postTitle}" fue rechazada`,
        parseMode: 'HTML',
    }),
    worker_dismissed: (d) => ({
        text: `⚠️ <b>Contratación cancelada</b>\nEl cliente te dio de baja del trabajo "${d.postTitle}"`,
        parseMode: 'HTML',
    }),
    post_completed: (d) => ({
        text: `✅ <b>Trabajo finalizado</b>\nEl trabajo "${d.postTitle}" fue marcado como completado`,
        parseMode: 'HTML',
    }),
    post_cancelled: (d) => ({
        text: `🚫 <b>Trabajo cancelado</b>\nEl trabajo "${d.postTitle}" fue cancelado`,
        parseMode: 'HTML',
    }),
    emergency_new: (d) => ({
        text: `📢 <b>Nueva publicación urgente</b>\n"${d.postTitle}" — ¡Aplicá ahora!\n\n${d.postDescription}`,
        parseMode: 'HTML',
    }),
};
export const notifyUser = async (provider, userId, event, data) => {
    const user = await findUserById(userId);
    if (!user?.telegramChatId)
        return;
    const message = templates[event](data);
    const ok = await provider.send(user.telegramChatId, message);
    if (!ok && provider.name === 'telegram') {
        await clearTelegramChatId(userId);
    }
};
export const broadcastEmergency = async (provider, postId, postTitle, postDescription, categoryId) => {
    const workers = await prisma.user.findMany({
        where: {
            emergenciesEnabled: true,
            telegramChatId: { not: null },
            categories: { some: { categoryId } },
        },
        select: { id: true, telegramChatId: true },
    });
    const postUrl = `${env.CORS_ORIGIN}/posts/${postId}`;
    const isHttps = env.CORS_ORIGIN.startsWith('https://');
    const message = {
        text: `📢 <b>Nueva publicación urgente</b>\n"${postTitle}" — ¡Aplicá ahora!\n\n${postDescription}\n\n🔗 ${postUrl}`,
        parseMode: 'HTML',
        ...(isHttps ? { buttons: [{ text: '🔍 Ver publicación', url: postUrl }] } : {}),
    };
    for (const worker of workers) {
        if (!worker.telegramChatId)
            continue;
        await provider.send(worker.telegramChatId, message);
    }
};
const clearTelegramChatId = async (userId) => {
    await prisma.user.update({ where: { id: userId }, data: { telegramChatId: null, telegramLinkedAt: null } });
};
