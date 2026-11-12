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

  if (COOKIE_SECURE) cookie += "; Secure";

  res.setHeader("Set-Cookie", cookie);
}

function limparCookie(res) {
  let cookie = "mcf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";

  if (COOKIE_SECURE) cookie += "; Secure";

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
       INNER JOIN usuarios u ON u.id = s.usuario_id
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
// 4. FUNÇÕES AUXILIARES
// ========================================

function validarData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataValidada.getUTCFullYear() === ano &&
    dataValidada.getUTCMonth() === mes - 1 &&
    dataValidada.getUTCDate() === dia
  );
}

function validarInvestimento(dados) {
  const local = typeof dados.local_investimento === "string" ? dados.local_investimento.trim() : "";

  const valor = Number(dados.valor);
  const data = dados.data_investimento;

  if (!local || local.length > 150) {
    return {
      valido: false,
      mensagem: "Informe onde o dinheiro foi investido.",
    };
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return {
      valido: false,
      mensagem: "Informe um valor maior que zero.",
    };
  }

  if (!validarData(data)) {
    return {
      valido: false,
      mensagem: "Informe uma data válida.",
    };
  }

  return {
    valido: true,
    local,
    valor,
    data,
  };
}

// ========================================
// 5. ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
  res.json({
    mensagem: "API Meu Controle Financeiro está funcionando!",
  });
});

// ========================================
// 6. TESTAR SERVIDOR
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    mensagem: "Servidor funcionando!",
    status: "OK",
  });
});

// ========================================
// 7. TESTAR BANCO DE DADOS
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
// 8. CADASTRAR USUÁRIO
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
// 9. REALIZAR LOGIN
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
// 10. VERIFICAR USUÁRIO LOGADO
// ========================================

app.get("/api/me", autenticar, (req, res) => {
  return res.json({
    usuario: req.usuario,
  });
});

// ========================================
// 11. ENCERRAR SESSÃO
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
// 12. LISTAR MOVIMENTAÇÕES
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
// 13. CADASTRAR MOVIMENTAÇÃO
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
// 14. ATUALIZAR MOVIMENTAÇÃO
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
        `SELECT id FROM movimentacoes
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
// 15. EXCLUIR MOVIMENTAÇÃO
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
// 16. CATEGORIAS
// ========================================

app.get("/api/categorias", autenticar, async (req, res) => {
  try {
    const [categorias] = await db.query(
      `SELECT id, nome, tipo
       FROM categorias
       WHERE usuario_id = ?
       ORDER BY nome`,
      [req.usuario.id],
    );

    return res.json(categorias);
  } catch (erro) {
    console.error("Erro ao buscar categorias:", erro);

    return res.status(500).json({
      mensagem: "Erro ao buscar categorias.",
    });
  }
});

app.post("/api/categorias", autenticar, async (req, res) => {
  const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";

  const { tipo } = req.body;

  if (!nome || nome.length > 60 || !["receita", "despesa"].includes(tipo)) {
    return res.status(400).json({
      mensagem: "Informe um nome de até 60 caracteres e escolha receita ou despesa.",
    });
  }

  try {
    const [resultado] = await db.query(
      `INSERT INTO categorias (usuario_id, nome, tipo)
       VALUES (?, ?, ?)`,
      [req.usuario.id, nome, tipo],
    );

    return res.status(201).json({
      categoria: {
        id: resultado.insertId,
        nome,
        tipo,
      },
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Você já tem uma categoria com esse nome para esse tipo.",
      });
    }

    console.error("Erro ao criar categoria:", erro);

    return res.status(500).json({
      mensagem: "Erro ao criar categoria.",
    });
  }
});

// ========================================
// 17. LISTAR INVESTIMENTOS
// ========================================

app.get("/api/investimentos", autenticar, async (req, res) => {
  try {
    const [investimentos] = await db.query(
      `SELECT
         id,
         valor,
         local_investimento,
         DATE_FORMAT(data_investimento, '%Y-%m-%d') AS data_investimento
       FROM investimentos_registros
       WHERE usuario_id = ?
       ORDER BY data_investimento DESC, id DESC`,
      [req.usuario.id],
    );

    const [resultado] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM investimentos_registros
       WHERE usuario_id = ?`,
      [req.usuario.id],
    );

    return res.json({
      investimentos,
      total: Number(resultado[0].total),
    });
  } catch (erro) {
    console.error("Erro ao listar investimentos:", erro);

    return res.status(500).json({
      mensagem: "Erro ao buscar investimentos.",
    });
  }
});

// ========================================
// 18. CADASTRAR NOVO INVESTIMENTO
// ========================================

app.post("/api/investimentos", autenticar, async (req, res) => {
  const validacao = validarInvestimento(req.body);

  if (!validacao.valido) {
    return res.status(400).json({
      mensagem: validacao.mensagem,
    });
  }

  try {
    const [resultado] = await db.query(
      `INSERT INTO investimentos_registros
       (usuario_id, valor, local_investimento, data_investimento)
       VALUES (?, ?, ?, ?)`,
      [req.usuario.id, validacao.valor, validacao.local, validacao.data],
    );

    return res.status(201).json({
      mensagem: "Investimento cadastrado com sucesso!",
      id: resultado.insertId,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar investimento:", erro);

    return res.status(500).json({
      mensagem: "Erro ao cadastrar investimento.",
    });
  }
});

// ========================================
// 19. EDITAR INVESTIMENTO
// ========================================

app.put("/api/investimentos/:id", autenticar, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID do investimento inválido.",
    });
  }

  const validacao = validarInvestimento(req.body);

  if (!validacao.valido) {
    return res.status(400).json({
      mensagem: validacao.mensagem,
    });
  }

  try {
    const [resultado] = await db.query(
      `UPDATE investimentos_registros
       SET valor = ?,
           local_investimento = ?,
           data_investimento = ?
       WHERE id = ? AND usuario_id = ?`,
      [validacao.valor, validacao.local, validacao.data, id, req.usuario.id],
    );

    if (resultado.affectedRows === 0) {
      const [registros] = await db.query(
        `SELECT id
         FROM investimentos_registros
         WHERE id = ? AND usuario_id = ?`,
        [id, req.usuario.id],
      );

      if (registros.length === 0) {
        return res.status(404).json({
          mensagem: "Investimento não encontrado.",
        });
      }
    }

    return res.json({
      mensagem: "Investimento atualizado com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao atualizar investimento:", erro);

    return res.status(500).json({
      mensagem: "Erro ao atualizar investimento.",
    });
  }
});

// ========================================
// 20. EXCLUIR INVESTIMENTO
// ========================================

app.delete("/api/investimentos/:id", autenticar, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID do investimento inválido.",
    });
  }

  try {
    const [resultado] = await db.query(
      `DELETE FROM investimentos_registros
       WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Investimento não encontrado.",
      });
    }

    return res.json({
      mensagem: "Investimento excluído com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao excluir investimento:", erro);

    return res.status(500).json({
      mensagem: "Erro ao excluir investimento.",
    });
  }
});

// ========================================
// 21. INICIAR SERVIDOR
// ========================================

async function iniciarServidor() {
  try {
    // Tabela de categorias
    await db.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nome VARCHAR(60) NOT NULL,
        tipo ENUM('receita', 'despesa') NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_categoria_usuario_nome_tipo (usuario_id, nome, tipo),
        CONSTRAINT fk_categorias_usuarios FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Tabela de investimentos individuais
    await db.query(`
      CREATE TABLE IF NOT EXISTS investimentos_registros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        valor DECIMAL(15,2) NOT NULL,
        local_investimento VARCHAR(150) NOT NULL,
        data_investimento DATE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_investimentos_usuario (usuario_id),
        CONSTRAINT fk_investimentos_registros_usuarios
          FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Tabela de sessões
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
          REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Migrar o valor antigo para o histórico, uma única vez por usuário.
    // A tabela antiga é preservada.
    await db.query(`
      INSERT INTO investimentos_registros
        (usuario_id, valor, local_investimento, data_investimento)
      SELECT
        antigo.usuario_id,
        antigo.valor,
        'Investimento anterior',
        DATE(antigo.atualizado_em)
      FROM investimentos antigo
      WHERE antigo.valor > 0
        AND NOT EXISTS (
          SELECT 1
          FROM investimentos_registros novo
          WHERE novo.usuario_id = antigo.usuario_id
            AND novo.local_investimento = 'Investimento anterior'
        )
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
