const { sql } = require('@vercel/postgres');
const { requirePermission } = require('./lib/auth');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {
        const auth = await requirePermission(
            request,
            'estudiante:manage'
        );

        if (!auth.ok) {
            return response.status(auth.status).json({
                error: auth.error
            });
        }

        const { estudiantes } = request.body || {};

        if (!Array.isArray(estudiantes)) {
            return response.status(400).json({
                error: 'El campo estudiantes debe ser un array.'
            });
        }

        for (const est of estudiantes) {
            if (
                !est ||
                typeof est.dni !== 'string' ||
                est.dni.trim() === ''
            ) {
                return response.status(400).json({
                    error: 'Cada estudiante debe tener un DNI válido.'
                });
            }

            await sql`
                UPDATE estudiantes
                SET
                    grupo_sanguineo = ${est.grupoSanguineo || null},
                    fecha_nacimiento = ${est.fechaNacimiento || null}
                WHERE dni = ${est.dni.trim()}
            `;
        }

        return response.status(200).json({
            success: true,
            message: 'Datos actualizados correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar estudiantes:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};
