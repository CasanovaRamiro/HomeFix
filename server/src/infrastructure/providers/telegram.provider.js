import { Telegraf } from 'telegraf';
import { env } from '../../lib/envConfig.js';
import { createHttpError } from '../../lib/errors.js';
let _bot = null;
export const getBot = () => {
    if (_bot)
        return _bot;
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token)
        throw createHttpError(500, 'TELEGRAM_BOT_TOKEN is not configured');
    _bot = new Telegraf(token);
    return _bot;
};
export const createTelegramProvider = () => {
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
        return { name: 'telegram', send: async () => false };
    }
    const bot = getBot();
    return {
        name: 'telegram',
        async send(recipient, message) {
            try {
                const parseMode = message.parseMode === 'HTML' ? 'HTML'
                    : message.parseMode === 'Markdown' ? 'Markdown'
                        : undefined;
                const extra = {};
                if (parseMode)
                    extra.parse_mode = parseMode;
                if (message.buttons?.length) {
                    extra.reply_markup = { inline_keyboard: [message.buttons.map((b) => ({ text: b.text, url: b.url }))] };
                }
                await bot.telegram.sendMessage(recipient, message.text, extra);
                return true;
            }
            catch (err) {
                const code = err?.code;
                if (code === 403) {
                    console.warn(`Bot blocked by user ${recipient}`);
                }
                else {
                    console.error(`Telegram send error: ${err instanceof Error ? err.message : err}`);
                }
                return false;
            }
        },
    };
};
