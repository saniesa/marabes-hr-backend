const pool = require("../config/db");

exports.getAll = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM categories");
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name } = req.body;
  const [result] = await pool.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name]
  );
  res.json({ id: result.insertId, name });
};