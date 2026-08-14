const crypto = require('node:crypto');

const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

const SCRYPT_OPTIONS = {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
};

function hashPassword(password) {
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('La contraseña debe ser un string no vacío');
    }

    const salt = crypto.randomBytes(SALT_LENGTH);

    const derivedKey = crypto.scryptSync(
        password,
        salt,
        KEY_LENGTH,
        SCRYPT_OPTIONS
    );

    return [
        'scrypt',
        SCRYPT_OPTIONS.N,
        SCRYPT_OPTIONS.r,
        SCRYPT_OPTIONS.p,
        salt.toString('hex'),
        derivedKey.toString('hex')
    ].join('$');
}

function verifyPassword(password, storedHash) {
    if (
        typeof password !== 'string' ||
        typeof storedHash !== 'string'
    ) {
        return false;
    }

    const parts = storedHash.split('$');

    if (parts.length !== 6 || parts[0] !== 'scrypt') {
        return false;
    }

    const [, n, r, p, saltHex, hashHex] = parts;

    const N = Number(n);
    const R = Number(r);
    const P = Number(p);

    if (
        !Number.isInteger(N) ||
        !Number.isInteger(R) ||
        !Number.isInteger(P) ||
        !/^[0-9a-f]+$/i.test(saltHex) ||
        !/^[0-9a-f]+$/i.test(hashHex)
    ) {
        return false;
    }

    try {
        const salt = Buffer.from(saltHex, 'hex');
        const expectedHash = Buffer.from(hashHex, 'hex');

        const actualHash = crypto.scryptSync(
            password,
            salt,
            expectedHash.length,
            {
                N,
                r: R,
                p: P,
                maxmem: 64 * 1024 * 1024
            }
        );

        if (actualHash.length !== expectedHash.length) {
            return false;
        }

        return crypto.timingSafeEqual(actualHash, expectedHash);
    } catch {
        return false;
    }
}

module.exports = {
    hashPassword,
    verifyPassword
};
