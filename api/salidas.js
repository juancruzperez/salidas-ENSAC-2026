const { sql } = require('@vercel/postgres');
const { requirePermission } = require('./lib/auth');

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {
        const auth = await requirePermission(
            request,
            'salida:read'
        );

        if (!auth.ok) {
            return response.status(auth.status).json({
                error: auth.error
            });
        }

        const result = await sql`
            SELECT *
            FROM salidas
            ORDER BY fecha_salida DESC
        `;

        return response.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al consultar salidas:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};
