const crypto = require('node:crypto');
const { sql } = require('@vercel/postgres');

const SESSION_COOKIE_NAME = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

function createSessionToken() {
    return crypto.randomBytes(32).toString('base64url');
}

function hashSessionToken(token) {
    return crypto
        .createHash('sha256')
        .update(token, 'utf8')
        .digest('hex');
}

async function createSession(userId) {
    if (!Number.isInteger(userId)) {
        throw new Error('userId inválido');
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    await sql`
        INSERT INTO sessions (
            token_hash,
            user_id,
            expires_at
        )
        VALUES (
            ${tokenHash},
            ${userId},
            NOW() + INTERVAL '8 hours'
        )
    `;

    return {
        token,
        expiresIn: SESSION_TTL_SECONDS
    };
}

async function getSession(token) {
    if (typeof token !== 'string' || token.length === 0) {
        return null;
    }

    const tokenHash = hashSessionToken(token);

    const result = await sql`
        SELECT
            s.id AS session_id,
            s.user_id,
            s.expires_at,
            u.username,
            u.role
        FROM sessions s
        INNER JOIN usuarios u
            ON u.id = s.user_id
        WHERE s.token_hash = ${tokenHash}
          AND s.expires_at > NOW()
        LIMIT 1
    `;

    if (result.rows.length === 0) {
        return null;
    }

    await sql`
        UPDATE sessions
        SET last_seen_at = NOW()
        WHERE id = ${result.rows[0].session_id}
    `;

    return result.rows[0];
}

async function deleteSession(token) {
    if (typeof token !== 'string' || token.length === 0) {
        return;
    }

    const tokenHash = hashSessionToken(token);

    await sql`
        DELETE FROM sessions
        WHERE token_hash = ${tokenHash}
    `;
}

function getSessionCookieOptions() {
    return [
        `${SESSION_COOKIE_NAME}=`,
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        'Path=/'
    ].join('; ');
}

function createSessionCookie(token, expiresIn) {
    return [
        `${SESSION_COOKIE_NAME}=${token}`,
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${expiresIn}`
    ].join('; ');
}

function clearSessionCookie() {
    return [
        `${SESSION_COOKIE_NAME}=`,
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        'Path=/',
        'Max-Age=0'
    ].join('; ');
}

function parseCookies(request) {
    const cookieHeader = request.headers?.cookie;

    if (typeof cookieHeader !== 'string' || cookieHeader === '') {
        return {};
    }

    return cookieHeader.split(';').reduce((cookies, item) => {
        const separatorIndex = item.indexOf('=');

        if (separatorIndex === -1) {
            return cookies;
        }

        const name = item.slice(0, separatorIndex).trim();
        const value = item.slice(separatorIndex + 1).trim();

        if (name) {
            cookies[name] = decodeURIComponent(value);
        }

        return cookies;
    }, {});
}

function getSessionToken(request) {
    const cookies = parseCookies(request);
    return cookies[SESSION_COOKIE_NAME] || null;
}

module.exports = {
    SESSION_COOKIE_NAME,
    SESSION_TTL_SECONDS,
    createSession,
    getSession,
    deleteSession,
    createSessionCookie,
    clearSessionCookie,
    getSessionCookieOptions,
    parseCookies,
    getSessionToken,
    hashSessionToken
};

