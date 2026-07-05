import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/lib/prisma.js', () => ({
    default: {
        telegramLinkCode: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}));
vi.mock('../../src/infrastructure/providers/telegram.provider.js', () => ({
    getBot: vi.fn(() => ({
        telegram: {
            getMe: vi.fn().mockResolvedValue({ username: 'HomeFixTestBot' }),
        },
    })),
}));
import prisma from '../../src/lib/prisma.js';
import { createLinkCode, processLink, handleTextMessage } from '../../src/presentation/telegram/bot.js';
const makeCtx = (overrides = {}) => ({
    reply: vi.fn(),
    chat: { id: 12345 },
    ...overrides,
});
const makeLinkCode = (overrides = {}) => {
    const now = new Date();
    return {
        id: 'link-1',
        userId: 'user-1',
        code: 'ABC12345',
        used: false,
        expiresAt: new Date(now.getTime() + 60000),
        createdAt: now,
        ...overrides,
    };
};
beforeEach(() => {
    vi.clearAllMocks();
});
describe('createLinkCode', () => {
    it('crea un código de 8 caracteres alfanuméricos', async () => {
        vi.mocked(prisma.telegramLinkCode.create).mockResolvedValue({});
        const code = await createLinkCode('user-1');
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });
    it('guarda el código con expiresAt a 5 minutos', async () => {
        const before = Date.now();
        vi.mocked(prisma.telegramLinkCode.create).mockResolvedValue({});
        await createLinkCode('user-1');
        const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0];
        const expiresAt = callArgs.data.expiresAt;
        expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(4.5 * 60 * 1000);
        expect(expiresAt.getTime() - before).toBeLessThanOrEqual(5 * 60 * 1000 + 100);
    });
    it('asocia el código al userId provisto', async () => {
        vi.mocked(prisma.telegramLinkCode.create).mockResolvedValue({});
        await createLinkCode('user-42');
        const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0];
        expect(callArgs.data.userId).toBe('user-42');
    });
    it('retorna el mismo código que guarda en la DB', async () => {
        vi.mocked(prisma.telegramLinkCode.create).mockResolvedValue({});
        const code = await createLinkCode('user-1');
        const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0];
        expect(code).toBe(callArgs.data.code);
    });
});
describe('getBotUsername', () => {
    it('retorna el username del bot', async () => {
        const { getBotUsername } = await import('../../src/presentation/telegram/bot.js');
        const username = await getBotUsername();
        expect(username).toBe('HomeFixTestBot');
    });
});
describe('processLink', () => {
    it('vincula al usuario cuando el código es válido', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(makeLinkCode());
        const ctx = makeCtx();
        await processLink(ctx, 'ABC12345');
        expect(prisma.telegramLinkCode.update).toHaveBeenCalledWith({
            where: { id: 'link-1' },
            data: { used: true },
        });
        expect(prisma.user.updateMany).toHaveBeenCalledWith({
            where: { telegramChatId: '12345', id: { not: 'user-1' } },
            data: { telegramChatId: null, telegramLinkedAt: null },
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: {
                telegramChatId: '12345',
                telegramLinkedAt: expect.any(Date),
            },
        });
        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('vinculada con éxito'));
    });
    it('rechaza un código inválido (no existe)', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(null);
        const ctx = makeCtx();
        await processLink(ctx, 'INVALIDO');
        expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.');
        expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
    it('rechaza un código expirado', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(makeLinkCode({
            code: 'EXPIRED',
            expiresAt: new Date(Date.now() - 60000),
        }));
        const ctx = makeCtx();
        await processLink(ctx, 'EXPIRED');
        expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.');
        expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
    it('rechaza un código ya usado', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(makeLinkCode({
            code: 'USED123',
            used: true,
        }));
        const ctx = makeCtx();
        await processLink(ctx, 'USED123');
        expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.');
        expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
    it('usa el chatId del contexto para vincular', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(makeLinkCode());
        const ctx = makeCtx({ chat: { id: 99999 } });
        await processLink(ctx, 'ABC12345');
        expect(prisma.user.updateMany).toHaveBeenCalledWith({
            where: { telegramChatId: '99999', id: { not: 'user-1' } },
            data: { telegramChatId: null, telegramLinkedAt: null },
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: {
                telegramChatId: '99999',
                telegramLinkedAt: expect.any(Date),
            },
        });
    });
    it('maneja chat null (ctx.chat = null)', async () => {
        vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(makeLinkCode());
        const ctx = makeCtx({ chat: null });
        await processLink(ctx, 'ABC12345');
        expect(prisma.user.updateMany).toHaveBeenCalledWith({
            where: { telegramChatId: 'undefined', id: { not: 'user-1' } },
            data: { telegramChatId: null, telegramLinkedAt: null },
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: {
                telegramChatId: 'undefined',
                telegramLinkedAt: expect.any(Date),
            },
        });
    });
});
describe('handleTextMessage', () => {
    it('saluda al usuario vinculado con su nombre', async () => {
        vi.mocked(prisma.user.findFirst).mockResolvedValue({
            id: 'user-1',
            name: 'Martín',
        });
        const ctx = makeCtx();
        await handleTextMessage(ctx);
        expect(ctx.reply).toHaveBeenCalledWith('¡Hola Martín, recordá que con HomeFix podés solucionar cualquier inconveniente que tengas en tu casa!');
    });
    it('responde con instrucciones si el usuario no está vinculado', async () => {
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
        const ctx = makeCtx();
        await handleTextMessage(ctx);
        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('No tengo tu cuenta vinculada todavía'));
    });
    it('maneja chat null sin errores', async () => {
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
        const ctx = makeCtx({ chat: null });
        await expect(handleTextMessage(ctx)).resolves.not.toThrow();
    });
});
