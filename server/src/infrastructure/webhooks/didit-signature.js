import crypto from 'crypto';
function sortKeys(obj) {
    if (Array.isArray(obj))
        return obj.map(sortKeys);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj)
            .sort()
            .reduce((acc, key) => {
            acc[key] = sortKeys(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}
function shortenFloats(data) {
    if (Array.isArray(data))
        return data.map(shortenFloats);
    if (data !== null && typeof data === 'object') {
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, shortenFloats(v)]));
    }
    if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0) {
        return Math.trunc(data);
    }
    return data;
}
export function verifySignatureV2(body, signature, timestamp, secret) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300)
        return false;
    const canonical = JSON.stringify(sortKeys(shortenFloats(body)));
    const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function verifySignatureSimple(body, signature, timestamp, secret) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300)
        return false;
    const canonical = [
        body.timestamp ?? '',
        body.session_id ?? '',
        body.status ?? '',
        body.webhook_type ?? '',
    ].join(':');
    const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
