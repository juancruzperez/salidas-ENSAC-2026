const { sql } = require('@vercel/postgres');
const nodemailer = require('nodemailer');
const {
    requireSameOrigin,
    requirePermission
} = require('./lib/auth');
const {
    validateSalida
} = require('./lib/validation/salida');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {
        const origin = requireSameOrigin(request);

        if (!origin.ok) {
            return response.status(origin.status).json({
                error: origin.error
            });
        }

        const auth = await requirePermission(
            request,
            'salida:create'
        );

        if (!auth.ok) {
            return response.status(auth.status).json({
                error: auth.error
            });
        }

        const {
            destinoFinal,
            lugarSalida,
            lugarRegreso,
            cantEstudiantes,
            cantAcompanantes,
            fechaSalida,
            horaSalida,
            fechaRegreso,
            horaRegreso,
            sinPernocte,
            nombreAlojamiento,
            docenteOrganizador,
            emailDocente
        } = request.body || {};

        const validation = validateSalida({
            cantEstudiantes,
            cantAcompanantes,
            fechaSalida,
            horaSalida,
            fechaRegreso,
            horaRegreso,
            sinPernocte,
            nombreAlojamiento
        });

        if (!validation.valid) {
            return response.status(400).json({
                error: 'Los datos de la salida no son válidos.',
                details: validation.errors
            });
        }

        const result = await sql`
            INSERT INTO salidas (
                destino,
                lugar_salida,
                lugar_regreso,
                cant_estudiantes,
                cant_acompanantes,
                fecha_salida,
                hora_salida,
                fecha_regreso,
                hora_regreso,
                es_pernocte,
                alojamiento_nombre,
                docente_organizador
            ) VALUES (
                ${destinoFinal},
                ${lugarSalida},
                ${lugarRegreso},
                ${cantEstudiantes},
                ${cantAcompanantes},
                ${fechaSalida},
                ${horaSalida},
                ${fechaRegreso},
                ${horaRegreso},
                ${!sinPernocte},
                ${nombreAlojamiento || null},
                ${docenteOrganizador || 'NO ESPECIFICADO'}
            )
            RETURNING id;
        `;

        const idSalida = result.rows[0].id;
        const docenteOrgTexto =
            docenteOrganizador || 'Un docente organizador';

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const fSalidaFormat = fechaSalida
            ? fechaSalida.split('-').reverse().join('/')
            : '-';

        const fRegresoFormat = fechaRegreso
            ? fechaRegreso.split('-').reverse().join('/')
            : '-';

        const modalidadTexto = sinPernocte
            ? 'SIN PERNOCTE (Ida y vuelta en el dí­a)'
            : 'CON PERNOCTE';

        const destinatarioSecretaria =
            process.env.VERCEL_ENV === 'preview' && process.env.TEST_EMAIL_TO
                ? process.env.TEST_EMAIL_TO
                : 'juanceprez@gmail.com';

        const mailOptionsSecretaria = {
            from: `"Sistema de Salidas Educativas" <${process.env.GMAIL_USER}>`,
            to: destinatarioSecretaria,
            cc: emailDocente,
            subject: `${docenteOrgTexto} ha generado una salida nueva`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 8px;">
                        Ã°Å¸â€œâ€ž Resumen Ejecutivo: Nueva Salida Educativa #${idSalida}
                    </h2>

                    <p>
                        Se ha registrado una nueva solicitud de Salida Educativa en el sistema.
                        A continuación los datos más relevantes:
                    </p>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 10px; font-weight: bold; width: 40%; border: 1px solid #dee2e6;">
                                Docente/s Organizador/es:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${docenteOrgTexto}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Destino:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${destinoFinal}
                            </td>
                        </tr>

                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Modalidad:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${modalidadTexto}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Fecha y Hora de Salida:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${fSalidaFormat} a las ${horaSalida} HS (${lugarSalida})
                            </td>
                        </tr>

                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Fecha y Hora de Regreso:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${fRegresoFormat} a las ${horaRegreso} HS (${lugarRegreso})
                            </td>
                        </tr>

                        ${!sinPernocte ? `
                        <tr>
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Alojamiento:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${nombreAlojamiento || 'No especificado'}
                            </td>
                        </tr>
                        ` : ''}

                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Cantidad de Estudiantes:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${cantEstudiantes}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">
                                Cantidad de Acompañantes:
                            </td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                ${cantAcompanantes}
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 25px; padding: 12px; background-color: #e7f1ff; border-left: 4px solid #0d6efd; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #084298;">
                            Ã¢â€žÂ¹Ã¯Â¸ Puede consultar la documentación completa ingresando al
                            <strong>Panel de Resúmenes Ejecutivos</strong> en la plataforma.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptionsSecretaria);

        return response.status(200).json({
            success: true,
            idSalida
        });
    } catch (error) {
        console.error('Error al guardar salida o enviar correo:', error);

        return response.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

