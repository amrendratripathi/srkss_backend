const crypto = require('crypto');

function createToken(user, secret) {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const payload = encode({ sub: String(user.id), role: user.role, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 });
    const signingInput = `${header}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
    return `${signingInput}.${signature}`;
}

function requireAdmin(secret) {
    return (req, res, next) => {
        const parts = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').split('.');
        if (parts.length !== 3) return res.status(401).json({ message: 'Admin login required' });
        try {
            const [header, payload, signature] = parts;
            const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest();
            const actual = Buffer.from(signature, 'base64url');
            if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
                return res.status(401).json({ message: 'Invalid login session' });
            }
            const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
                return res.status(401).json({ message: 'Login session expired' });
            }
            if (claims.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
            req.auth = claims;
            return next();
        } catch {
            return res.status(401).json({ message: 'Invalid login session' });
        }
    };
}

function requireAuth(secret) {
    return (req, res, next) => {
        const parts = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').split('.');
        if (parts.length !== 3) return res.status(401).json({ message: 'Login required' });
        try {
            const [header, payload, signature] = parts;
            const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest();
            const actual = Buffer.from(signature, 'base64url');
            if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
                return res.status(401).json({ message: 'Invalid login session' });
            }
            const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
                return res.status(401).json({ message: 'Login session expired' });
            }
            req.auth = claims;
            return next();
        } catch {
            return res.status(401).json({ message: 'Invalid login session' });
        }
    };
}

module.exports = { createToken, requireAdmin, requireAuth };
