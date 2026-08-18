const { sql } = require('@Vercel/postgres');
const { hashPassword, verifyPassword } = require('./lib/password');
const {
    createSession,
    createSessionCookie
} = require('./lib/session');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Método no permitido.'
        });
    }

    const contentType = request.headers['content-type'] || '';

    if (!contentType.toLowerCase().startsWith('application/json')) {
        return response.status(415).json({
            error: 'El contenido debe ser JSON.'
        });
    }

    let body;

    try {
        body = request.body;
    } catch (error) {
        return response.status(400).json({
            error: 'Solicitud inválida.'
        });
    }

    try {
        const { username, password } = body || {};

        if (
            typeof username !== 'string' ||
            typeof password !== 'string' ||
            username.trim() === '' ||
            password === ''
        ) {
            return response.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        const normalizedUsername = username.trim();

        const result = await sql`
            SELECT
                id,
                username,
                password,
                password_hash,
                role
            FROM usuarios
            WHERE username = ${normalizedUsername}
            LIMIT 1
        `;

        if (result.rows.length === 0) {
            return response.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        const usuario = result.rows[0];

        let passwordValida = false;
        let requiereMigracion = false;

        if (usuario.password_hash) {
            passwordValida = verifyPassword(
                password,
                usuario.password_hash
            );
        } else if (usuario.password) {
            passwordValida = usuario.password === password;
            requiereMigracion = passwordValida;
        }

        if (!passwordValida) {
            return response.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        if (requiereMigracion) {
            const passwordHash = hashPassword(password);

            await sql`
                UPDATE usuarios
                SET password_hash = ${passwordHash}
                WHERE id = ${usuario.id}
                  AND password_hash IS NULL
            `;
        }

        const session = await createSession(usuario.id);

        response.setHeader(
            'Set-Cookie',
            createSessionCookie(
                session.token,
                session.expiresIn
            )
        );

        return response.status(200).json({
            success: true,
            user: {
                id: usuario.id,
                username: usuario.username,
                role: usuario.role
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};