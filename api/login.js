const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { username, password } = request.body;

    const result = await sql`
      SELECT * FROM usuarios WHERE username = ${username} AND password = ${password}
    `;

    if (result.rows.length === 0) {
      return response.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const usuario = result.rows[0];

    return response.status(200).json({
      success: true,
      user: {
        username: usuario.username,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error("Error en el login:", error);
    return response.status(500).json({ error: error.message });
  }
};