// Importar o MySQL2
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Carregar as variáveis do arquivo .env
dotenv.config();

// Criar a conexão com o banco de dados
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Exportar a conexão
export default db;
