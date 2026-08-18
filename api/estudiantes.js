const { sql } = require('@vercel/postgres');
const { requirePermission } = require('./lib/auth');

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'MÃ©todo no permitido'
        });
    }

    try {
        const auth = await requirePermission(
            request,
            'estudiante:read'
        );

        if (!auth.ok) {
            return response.status(auth.status).json({
                error: auth.error
            });
        }

        const { turno, ano, division, ciclo } = request.query;

        let query = 'SELECT * FROM estudiantes WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (turno && turno !== 'TODOS') {
            query += ` AND turno = $${paramIndex++}`;
            params.push(turno);
        }

        if (ano && ano !== 'TODOS') {
            query += ` AND ano = $${paramIndex++}`;
            params.push(ano);
        }

        if (division && division !== 'TODOS') {
            query += ` AND division = $${paramIndex++}`;
            params.push(division);
        }

        if (ciclo && ciclo !== 'TODOS') {
            query += ` AND ciclo_especializacion = $${paramIndex++}`;
            params.push(ciclo);
        }

        query += ' ORDER BY apellido_nombre ASC';

        const result = await sql.query(query, params);

        return response.status(200).json(result.rows);
    } catch (error) {
        console.error('Error en la base de datos:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

