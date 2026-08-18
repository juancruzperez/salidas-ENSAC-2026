const {
    deleteSession,
    getSessionToken,
    clearSessionCookie
} = require('./lib/session');
const {
    requireSameOrigin
} = require('./lib/auth');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Método no permitido.'
        });
    }

    try {
        const origin = requireSameOrigin(request);

        if (!origin.ok) {
            return response.status(origin.status).json({
                error: origin.error
            });
        }

        const token = getSessionToken(request);

        if (token) {
            await deleteSession(token);
        }

        response.setHeader(
            'Set-Cookie',
            clearSessionCookie()
        );

        return response.status(200).json({
            success: true
        });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};