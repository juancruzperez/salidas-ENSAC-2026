const {
    getSession,
    getSessionToken
} = require('./lib/session');

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'Método no permitido.'
        });
    }

    try {
        const token = getSessionToken(request);
        const session = await getSession(token);

        if (!session) {
            return response.status(401).json({
                authenticated: false
            });
        }

        return response.status(200).json({
            authenticated: true,
            user: {
                id: session.user_id,
                username: session.username,
                role: session.role
            }
        });

    } catch (error) {
        console.error('Error al consultar la sesión:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};
