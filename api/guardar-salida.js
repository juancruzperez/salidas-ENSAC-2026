const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { 
      destinoFinal, lugarSalida, lugarRegreso, cantEstudiantes, 
      cantAcompanantes, fechaSalida, horaSalida, fechaRegreso, 
      horaRegreso, sinPernocte, nombreAlojamiento, docenteOrganizador 
    } = request.body;

    const result = await sql`
      INSERT INTO salidas (
        destino, lugar_salida, lugar_regreso, cant_estudiantes, 
        cant_acompanantes, fecha_salida, hora_salida, fecha_regreso, 
        hora_regreso, es_pernocte, alojamiento_nombre, docente_organizador
      ) VALUES (
        ${destinoFinal}, ${lugarSalida}, ${lugarRegreso}, ${cantEstudiantes}, 
        ${cantAcompanantes}, ${fechaSalida}, ${horaSalida}, ${fechaRegreso}, 
        ${horaRegreso}, ${!sinPernocte}, ${nombreAlojamiento || null}, ${docenteOrganizador || ''}
      ) RETURNING id;
    `;

    return response.status(200).json({ success: true, idSalida: result.rows[0].id });
  } catch (error) {
    console.error("Error al guardar salida:", error);
    return response.status(500).json({ error: error.message });
  }
};