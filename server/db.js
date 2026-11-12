import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar as configurações da raiz do projeto
const resultado = dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});

// Verificar se as configurações foram carregadas
if (resultado.error) {
  throw resultado.error;
}

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error("Configurações do MySQL não encontradas no arquivo .env");
}

// Criar conexão com o banco
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
