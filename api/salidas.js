const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const result = await sql`SELECT * FROM salidas ORDER BY fecha_salida DESC`;
    return response.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar salidas:", error);
    return response.status(500).json({ error: error.message });
  }
};