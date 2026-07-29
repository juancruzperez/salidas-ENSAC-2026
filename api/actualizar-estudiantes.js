const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  // Solo aceptamos peticiones POST (envío de datos)
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { estudiantes } = request.body;

    // Recorremos la lista de estudiantes que nos envió la web y los actualizamos uno por uno
    for (const est of estudiantes) {
      await sql.query(`
        UPDATE estudiantes 
        SET grupo_sanguineo = $1, fecha_nacimiento = $2 
        WHERE dni = $3
      `, [est.grupoSanguineo, est.fechaNacimiento, est.dni]);
    }

    return response.status(200).json({ success: true, message: 'Datos actualizados correctamente' });
  } catch (error) {
    console.error("Error al actualizar estudiantes:", error);
    return response.status(500).json({ error: error.message });
  }
};