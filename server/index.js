import express from "express";
import cors from "cors";
import db from "./db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ========================================
// 1. CONFIGURAÇÕES
// ========================================

const app = express();
const PORTA = 3000;

const TEMPO_SESSAO = 7 * 24 * 60 * 60;
const COOKIE_SECURE = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// ========================================
// 2. FUNÇÕES DE SESSÃO
// ========================================

function gerarHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function obterCookie(req) {
  const cookies = req.headers.cookie || "";

  const cookie = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("mcf_session="));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring("mcf_session=".length));
}

function definirCookie(res, token) {
  let cookie = `mcf_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TEMPO_SESSAO}`;

  if (COOKIE_SECURE) {
    cookie += "; Secure";
  }

  res.setHeader("Set-Cookie", cookie);
}

function limparCookie(res) {
  let cookie = "mcf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";

  if (COOKIE_SECURE) {
    cookie += "; Secure";
  }

  res.setHeader("Set-Cookie", cookie);
}

// ========================================
// 3. AUTENTICAÇÃO
// ========================================

async function autenticar(req, res, next) {
  try {
    const token = obterCookie(req);

    if (!token) {
      return res.status(401).json({
        mensagem: "Faça login para continuar.",
      });
    }

    const tokenHash = gerarHash(token);

    const [sessoes] = await db.query(
      `SELECT
                s.usuario_id,
                u.nome,
                u.email
             FROM sessoes s
             INNER JOIN usuarios u
                ON u.id = s.usuario_id
             WHERE s.token_hash = ?
               AND s.expira_em > NOW()
               AND u.ativo = TRUE`,
      [tokenHash],
    );

    if (sessoes.length === 0) {
      limparCookie(res);

      return res.status(401).json({
        mensagem: "Sessão inválida ou expirada. Faça login novamente.",
      });
    }

    req.usuario = {
      id: sessoes[0].usuario_id,
      nome: sessoes[0].nome,
      email: sessoes[0].email,
    };

    next();
  } catch (erro) {
    console.error("Erro na autenticação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao verificar autenticação.",
    });
  }
}

// ========================================
// 4. ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
  res.json({
    mensagem: "API Meu Controle Financeiro está funcionando!",
  });
});

// ========================================
// 5. TESTAR SERVIDOR
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    mensagem: "Servidor funcionando!",
    status: "OK",
  });
});

// ========================================
// 6. TESTAR BANCO DE DADOS
// ========================================

app.get("/api/teste-banco", async (req, res) => {
  try {
    const [resultado] = await db.query("SELECT 1 AS teste");

    return res.json({
      mensagem: "Conexão com MySQL realizada com sucesso!",
      resultado,
    });
  } catch (erro) {
    console.error("Erro ao conectar com MySQL:", erro);

    return res.status(500).json({
      mensagem: "Erro ao conectar com o banco de dados.",
    });
  }
});

// ========================================
// 7. CADASTRAR USUÁRIO
// ========================================

app.post("/api/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (
    typeof nome !== "string" ||
    !nome.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof senha !== "string" ||
    !senha
  ) {
    return res.status(400).json({
      mensagem: "Preencha nome, e-mail e senha.",
    });
  }

  if (senha.length < 8) {
    return res.status(400).json({
      mensagem: "A senha deve ter pelo menos 8 caracteres.",
    });
  }

  try {
    const emailNormalizado = email.trim().toLowerCase();

    const senhaHash = await bcrypt.hash(senha, 12);

    const [resultado] = await db.query(
      `INSERT INTO usuarios (nome, email, senha)
             VALUES (?, ?, ?)`,
      [nome.trim(), emailNormalizado, senhaHash],
    );

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      id: resultado.insertId,
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado.",
      });
    }

    console.error("Erro ao cadastrar usuário:", erro);

    return res.status(500).json({
      mensagem: "Erro ao cadastrar usuário.",
    });
  }
});

// ========================================
// 8. REALIZAR LOGIN
// ========================================

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (typeof email !== "string" || !email.trim() || typeof senha !== "string" || !senha) {
    return res.status(400).json({
      mensagem: "Informe o e-mail e a senha.",
    });
  }

  try {
    const emailNormalizado = email.trim().toLowerCase();

    const [usuarios] = await db.query(
      `SELECT id, nome, email, senha
             FROM usuarios
             WHERE email = ? AND ativo = TRUE`,
      [emailNormalizado],
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const usuario = usuarios[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = gerarHash(token);

    await db.query("DELETE FROM sessoes WHERE expira_em <= NOW()");

    await db.query(
      `INSERT INTO sessoes
                (usuario_id, token_hash, expira_em)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [usuario.id, tokenHash],
    );

    definirCookie(res, token);

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (erro) {
    console.error("Erro no login:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login.",
    });
  }
});

// ========================================
// 9. VERIFICAR USUÁRIO LOGADO
// ========================================

app.get("/api/me", autenticar, (req, res) => {
  return res.json({
    usuario: req.usuario,
  });
});

// ========================================
// 10. ENCERRAR SESSÃO
// ========================================

app.post("/api/logout", async (req, res) => {
  try {
    const token = obterCookie(req);

    if (token) {
      await db.query("DELETE FROM sessoes WHERE token_hash = ?", [gerarHash(token)]);
    }

    limparCookie(res);

    return res.json({
      mensagem: "Sessão encerrada com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao encerrar sessão:", erro);

    return res.status(500).json({
      mensagem: "Erro ao encerrar sessão.",
    });
  }
});

// ========================================
// 11. LISTAR MOVIMENTAÇÕES DO USUÁRIO
// ========================================

app.get("/api/movimentacoes", autenticar, async (req, res) => {
  try {
    const [movimentacoes] = await db.query(
      `SELECT *
             FROM movimentacoes
             WHERE usuario_id = ?
             ORDER BY data DESC, id DESC`,
      [req.usuario.id],
    );

    return res.json(movimentacoes);
  } catch (erro) {
    console.error("Erro ao buscar movimentações:", erro);

    return res.status(500).json({
      mensagem: "Erro ao buscar movimentações.",
    });
  }
});

// ========================================
// 12. CADASTRAR MOVIMENTAÇÃO
// ========================================

app.post("/api/movimentacoes", autenticar, async (req, res) => {
  const { descricao, valor, tipo, categoria, data } = req.body;

  if (
    typeof descricao !== "string" ||
    !descricao.trim() ||
    valor === undefined ||
    valor === null ||
    !tipo ||
    !categoria ||
    !data
  ) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos da movimentação.",
    });
  }

  if (!["receita", "despesa"].includes(tipo)) {
    return res.status(400).json({
      mensagem: "O tipo deve ser receita ou despesa.",
    });
  }

  if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({
      mensagem: "Informe um valor maior que zero.",
    });
  }

  try {
    const [resultado] = await db.query(
      `INSERT INTO movimentacoes
                (descricao, valor, tipo, categoria, data, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [descricao.trim(), Number(valor), tipo, categoria, data, req.usuario.id],
    );

    return res.status(201).json({
      mensagem: "Movimentação cadastrada com sucesso!",
      id: resultado.insertId,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar movimentação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao cadastrar movimentação.",
    });
  }
});

// ========================================
// 13. ATUALIZAR MOVIMENTAÇÃO
// ========================================

app.put("/api/movimentacoes/:id", autenticar, async (req, res) => {
  const id = Number(req.params.id);
  const { descricao, valor, tipo, categoria, data } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  if (
    typeof descricao !== "string" ||
    !descricao.trim() ||
    valor === undefined ||
    valor === null ||
    !tipo ||
    !categoria ||
    !data
  ) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos.",
    });
  }

  if (!["receita", "despesa"].includes(tipo)) {
    return res.status(400).json({
      mensagem: "Tipo inválido.",
    });
  }

  if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({
      mensagem: "Informe um valor maior que zero.",
    });
  }

  try {
    const [resultado] = await db.query(
      `UPDATE movimentacoes
             SET descricao = ?,
                 valor = ?,
                 tipo = ?,
                 categoria = ?,
                 data = ?
             WHERE id = ? AND usuario_id = ?`,
      [descricao.trim(), Number(valor), tipo, categoria, data, id, req.usuario.id],
    );

    if (resultado.affectedRows === 0) {
      const [registros] = await db.query(
        `SELECT id
                 FROM movimentacoes
                 WHERE id = ? AND usuario_id = ?`,
        [id, req.usuario.id],
      );

      if (registros.length === 0) {
        return res.status(404).json({
          mensagem: "Movimentação não encontrada.",
        });
      }
    }

    return res.json({
      mensagem: "Movimentação atualizada com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao atualizar movimentação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao atualizar movimentação.",
    });
  }
});

// ========================================
// 14. EXCLUIR MOVIMENTAÇÃO
// ========================================

app.delete("/api/movimentacoes/:id", autenticar, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  try {
    const [resultado] = await db.query(
      `DELETE FROM movimentacoes
             WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Movimentação não encontrada.",
      });
    }

    return res.json({
      mensagem: "Movimentação excluída com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao excluir movimentação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao excluir movimentação.",
    });
  }
});

// ========================================
// 15. INICIAR SERVIDOR
// ========================================

async function iniciarServidor() {
  try {
    await db.query(`
            CREATE TABLE IF NOT EXISTS sessoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                token_hash CHAR(64) NOT NULL UNIQUE,
                expira_em DATETIME NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sessoes_usuario (usuario_id),
                INDEX idx_sessoes_expiracao (expira_em),
                CONSTRAINT fk_sessoes_usuarios
                    FOREIGN KEY (usuario_id)
                    REFERENCES usuarios(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

    app.listen(PORTA, () => {
      console.log("------------------------------------");
      console.log("MEU CONTROLE FINANCEIRO");
      console.log(`Servidor rodando em http://localhost:${PORTA}`);
      console.log("------------------------------------");
    });
  } catch (erro) {
    console.error("Erro ao iniciar o servidor:", erro);
    process.exit(1);
  }
}

iniciarServidor();
