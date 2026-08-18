const { sql } = require('@vercel/postgres');
const { requirePermission } = require('./lib/auth');

function normalizeDni(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.replace(/\D/g, '');
}

function normalizeEmail(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toLowerCase();
}

function cleanOptionalString(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();

    return normalized === '' ? null : normalized;
}

function buildDocenteResponse(row) {
    return {
        id: row.id,
        dni: row.dni,
        apellido: row.apellido,
        nombre: row.nombre,
        telefono: row.telefono,
        grupoSanguineo: row.grupo_sanguineo,
        contactoEmergencia: row.contacto_emergencia,
        activo: row.activo,
        creadoEn: row.creado_en,
        actualizadoEn: row.actualizado_en
    };
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Método no permitido.'
        });
    }

    try {
        const body = request.body || {};
        const action = body.action;

        let permission;

        switch (action) {
            case 'find':
                permission = 'docente:read';
                break;

            case 'create':
                permission = 'docente:create';
                break;

            case 'update':
                permission = 'docente:update';
                break;

            default:
                return response.status(400).json({
                    error: 'Operación inválida.'
                });
        }

        const auth = await requirePermission(
            request,
            permission
        );

        if (!auth.ok) {
            return response.status(auth.status).json({
                error: auth.error
            });
        }

        const dni = normalizeDni(body.dni);

        if (!dni) {
            return response.status(400).json({
                error: 'El DNI es obligatorio.'
            });
        }

        if (action === 'find') {
            
            console.log('ENV DIAGNOSTIC:', {
    postgresUrlHost: process.env.POSTGRES_URL
        ? new URL(process.env.POSTGRES_URL).hostname
        : null,
    postgresUrlNonPoolingHost: process.env.POSTGRES_URL_NON_POOLING
        ? new URL(process.env.POSTGRES_URL_NON_POOLING).hostname
        : null,
    databaseUrlHost: process.env.DATABASE_URL
        ? new URL(process.env.DATABASE_URL).hostname
        : null
});
            
            const debugDb = await sql`
                SELECT
                    current_database() AS database_name,
                    current_user AS database_user,
                    current_schema() AS schema_name,
                    current_setting('neon.branch_id', true) AS neon_branch_id,
                    current_setting('neon.project_id', true) AS neon_project_id,
                    to_regclass('public.docentes') AS docentes_table
            `;

console.log('DB DIAGNOSTIC:', debugDb.rows[0]);

            const result = await sql`
                SELECT
                    id,
                    dni,
                    apellido,
                    nombre,
                    telefono,
                    grupo_sanguineo,
                    contacto_emergencia,
                    activo,
                    creado_en,
                    actualizado_en
                FROM docentes
                WHERE dni = ${dni}
                LIMIT 1
            `;

            if (result.rows.length === 0) {
                return response.status(200).json({
                    found: false,
                    docente: null
                });
            }

            return response.status(200).json({
                found: true,
                docente: buildDocenteResponse(result.rows[0])
            });
        }

        const apellido = cleanOptionalString(body.apellido);
        const nombre = cleanOptionalString(body.nombre);
        const telefono = cleanOptionalString(body.telefono);
        const grupoSanguineo = cleanOptionalString(
            body.grupoSanguineo
        );
        const contactoEmergencia = cleanOptionalString(
            body.contactoEmergencia
        );

        if (!apellido || !nombre) {
            return response.status(400).json({
                error: 'Apellido y nombre son obligatorios.'
            });
        }

        const email = normalizeEmail(
            body.modifiedByEmail || body.emailDocente
        );

        if (!email) {
            return response.status(400).json({
                error: 'El email es obligatorio para registrar la trazabilidad.'
            });
        }

        if (action === 'create') {
            try {
                const result = await sql`
                    INSERT INTO docentes (
                        dni,
                        apellido,
                        nombre,
                        telefono,
                        grupo_sanguineo,
                        contacto_emergencia,
                        creado_por_email,
                        actualizado_por_email
                    )
                    VALUES (
                        ${dni},
                        ${apellido},
                        ${nombre},
                        ${telefono},
                        ${grupoSanguineo},
                        ${contactoEmergencia},
                        ${email},
                        ${email}
                    )
                    RETURNING
                        id,
                        dni,
                        apellido,
                        nombre,
                        telefono,
                        grupo_sanguineo,
                        contacto_emergencia,
                        activo,
                        creado_en,
                        actualizado_en
                `;

                return response.status(201).json({
                    created: true,
                    docente: buildDocenteResponse(result.rows[0])
                });
            } catch (error) {
                if (error.code === '23505') {
                    return response.status(409).json({
                        error: 'Ya existe un docente registrado con ese DNI.'
                    });
                }

                throw error;
            }
        }

        const result = await sql`
            UPDATE docentes
            SET
                apellido = ${apellido},
                nombre = ${nombre},
                telefono = ${telefono},
                grupo_sanguineo = ${grupoSanguineo},
                contacto_emergencia = ${contactoEmergencia},
                actualizado_por_email = ${email},
                actualizado_en = NOW()
            WHERE dni = ${dni}
            RETURNING
                id,
                dni,
                apellido,
                nombre,
                telefono,
                grupo_sanguineo,
                contacto_emergencia,
                activo,
                creado_en,
                actualizado_en
        `;

        if (result.rows.length === 0) {
            return response.status(404).json({
                error: 'No existe un docente con ese DNI.'
            });
        }

        return response.status(200).json({
            updated: true,
            docente: buildDocenteResponse(result.rows[0])
        });

    } catch (error) {
        console.error('Error en /api/docentes:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};
