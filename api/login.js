import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NEON_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  try {
    const query = `
      SELECT usu_user, usu_nombre, usu_tipo
      FROM USUARIO
      WHERE usu_user = $1 AND usu_pass = $2
      LIMIT 1;
    `;
    const result = await pool.query(query, [usuario, password]);

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales inválidas" });
    }

    return res.json({ ok: true, datos: result.rows[0] });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}