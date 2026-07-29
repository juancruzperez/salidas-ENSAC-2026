import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    const { turno, ano, division, ciclo } = request.query;
    
    // Construimos la consulta SQL de forma dinámica según los filtros que elija el docente
    let query = `SELECT * FROM estudiantes WHERE 1=1`;
    let params = [];
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

    // Ejecutamos la consulta en tu base de datos de Vercel Postgres
    const result = await sql.query(query, params);
    
    return response.status(200).json(result.rows);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}