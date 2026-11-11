// ========================================
// 1. IMPORTAÇÕES
// ========================================

import express from "express";
import cors from "cors";
import db from "./db.js";

// ========================================
// 2. CONFIGURAÇÕES DO SERVIDOR
// ========================================

const app = express();
const PORTA = 3000;

app.use(cors());
app.use(express.json());

// ========================================
// 3. ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
  res.json({
    mensagem: "API Meu Controle Financeiro está funcionando!",
  });
});

// ========================================
// 4. TESTAR O SERVIDOR
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    mensagem: "Servidor funcionando!",
    status: "OK",
  });
});

// ========================================
// 5. TESTAR O BANCO DE DADOS
// ========================================

app.get("/api/teste-banco", async (req, res) => {
  try {
    const [resultado] = await db.query("SELECT 1 AS teste");

    res.json({
      mensagem: "Conexão com MySQL realizada com sucesso!",
      resultado,
    });
  } catch (erro) {
    console.error("Erro ao conectar com MySQL:", erro);

    res.status(500).json({
      mensagem: "Erro ao conectar com o banco de dados.",
    });
  }
});

// ========================================
// 6. LISTAR MOVIMENTAÇÕES
// ========================================

app.get("/api/movimentacoes", async (req, res) => {
  try {
    const [movimentacoes] = await db.query(
      "SELECT * FROM movimentacoes ORDER BY data DESC, id DESC",
    );

    res.json(movimentacoes);
  } catch (erro) {
    console.error("Erro ao buscar movimentações:", erro);

    res.status(500).json({
      mensagem: "Erro ao buscar movimentações.",
    });
  }
});

// ========================================
// 7. CADASTRAR MOVIMENTAÇÃO
// ========================================

app.post("/api/movimentacoes", async (req, res) => {
  const { descricao, valor, tipo, categoria, data } = req.body;

  if (!descricao?.trim() || valor === undefined || valor === null || !tipo || !categoria || !data) {
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
    const sql = `
            INSERT INTO movimentacoes
            (descricao, valor, tipo, categoria, data)
            VALUES (?, ?, ?, ?, ?)
        `;

    const [resultado] = await db.query(sql, [
      descricao.trim(),
      Number(valor),
      tipo,
      categoria,
      data,
    ]);

    res.status(201).json({
      mensagem: "Movimentação cadastrada com sucesso!",
      id: resultado.insertId,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar movimentação:", erro);

    res.status(500).json({
      mensagem: "Erro ao cadastrar movimentação.",
    });
  }
});

// ========================================
// 8. ATUALIZAR MOVIMENTAÇÃO
// ========================================

app.put("/api/movimentacoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { descricao, valor, tipo, categoria, data } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  if (!descricao?.trim() || valor === undefined || valor === null || !tipo || !categoria || !data) {
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
    const sql = `
            UPDATE movimentacoes
            SET descricao = ?, valor = ?, tipo = ?, categoria = ?, data = ?
            WHERE id = ?
        `;

    const [resultado] = await db.query(sql, [
      descricao.trim(),
      Number(valor),
      tipo,
      categoria,
      data,
      id,
    ]);

    // Se nenhuma linha foi alterada, verificar se o ID existe.
    if (resultado.affectedRows === 0) {
      const [registros] = await db.query("SELECT id FROM movimentacoes WHERE id = ?", [id]);

      if (registros.length === 0) {
        return res.status(404).json({
          mensagem: "Movimentação não encontrada.",
        });
      }
    }

    res.json({
      mensagem: "Movimentação atualizada com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao atualizar movimentação:", erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar movimentação.",
    });
  }
});

// ========================================
// 9. EXCLUIR MOVIMENTAÇÃO
// ========================================

app.delete("/api/movimentacoes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  try {
    const [resultado] = await db.query("DELETE FROM movimentacoes WHERE id = ?", [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Movimentação não encontrada.",
      });
    }

    res.json({
      mensagem: "Movimentação excluída com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao excluir movimentação:", erro);

    res.status(500).json({
      mensagem: "Erro ao excluir movimentação.",
    });
  }
});

// ========================================
// 10. INICIAR O SERVIDOR
// ========================================

app.listen(PORTA, () => {
  console.log("------------------------------------");
  console.log("MEU CONTROLE FINANCEIRO");
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
  console.log("------------------------------------");
});
