import "../style.css";

// ========================================
// 1. CONFIGURAÇÕES
// ========================================

let movimentacoes = [];
let idEmEdicao = null;

const API = "http://localhost:3000/api";

console.log("MEU CONTROLE FINANCEIRO INICIADO!");

// ========================================
// 2. VERIFICAR SESSÃO NO SERVIDOR
// ========================================

let usuario;

try {
  const resposta = await fetch(`${API}/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!resposta.ok) {
    localStorage.removeItem("usuario");
    window.location.href = "/login.html";
    throw new Error("Sessão não encontrada.");
  }

  const resultado = await resposta.json();

  usuario = resultado.usuario;

  if (!usuario || !usuario.id || !usuario.nome) {
    throw new Error("Dados do usuário inválidos.");
  }

  localStorage.setItem("usuario", JSON.stringify(usuario));
} catch (erro) {
  console.error("Erro ao verificar sessão:", erro);

  localStorage.removeItem("usuario");
  window.location.href = "/login.html";

  throw erro;
}

// ========================================
// 3. ESTRUTURA HTML
// ========================================

const app = document.querySelector("#app");

app.innerHTML = `
    <header>
        <h1>Meu Controle Financeiro</h1>
        <p>Organize suas finanças em um só lugar.</p>

        <div class="usuario-logado">
            <p>Olá, <strong id="nome-usuario"></strong>! 👋</p>
            <button type="button" id="btn-sair">Sair</button>
        </div>
    </header>

    <main>

        <section id="resumo">
            <h2>Resumo financeiro</h2>

            <div class="cards-resumo">
                <div class="card">
                    <h3>Receitas</h3>
                    <p id="total-receitas">R$ 0,00</p>
                </div>

                <div class="card">
                    <h3>Despesas</h3>
                    <p id="total-despesas">R$ 0,00</p>
                </div>

                <div class="card">
                    <h3>Saldo</h3>
                    <p id="saldo-total">R$ 0,00</p>
                </div>
            </div>
        </section>

        <section id="receitas">
            <h2 id="titulo-formulario">Nova movimentação</h2>

            <form id="form-movimentacao">

                <div class="campo">
                    <label for="descricao">Descrição</label>
                    <input
                        type="text"
                        id="descricao"
                        placeholder="Ex.: Salário, aluguel..."
                        required
                    >
                </div>

                <div class="campo">
                    <label for="valor">Valor (R$)</label>
                    <input
                        type="number"
                        id="valor"
                        placeholder="0,00"
                        step="0.01"
                        min="0.01"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="tipo">Tipo</label>
                    <select id="tipo" required>
                        <option value="">Selecione</option>
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                    </select>
                </div>

                <div class="campo">
                    <label for="categoria">Categoria</label>
                    <select id="categoria" required>
                        <option value="">Selecione uma categoria</option>
                        <option value="salario">Salário</option>
                        <option value="alimentacao">Alimentação</option>
                        <option value="moradia">Moradia</option>
                        <option value="transporte">Transporte</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>

                <div class="campo">
                    <label for="data">Data da movimentação</label>
                    <input type="date" id="data" required>
                </div>

                <button type="submit" id="btn-salvar">
                    Cadastrar movimentação
                </button>

                <button
                    type="button"
                    id="btn-cancelar"
                    style="display: none;"
                >
                    Cancelar edição
                </button>

            </form>
        </section>

        <section id="movimentacoes">
            <h2>Movimentações</h2>

            <div id="lista-movimentacoes">
                <p>Carregando movimentações...</p>
            </div>
        </section>

    </main>
`;

// ========================================
// 4. MOSTRAR NOME DO USUÁRIO
// ========================================

document.querySelector("#nome-usuario").textContent = usuario.nome;

// ========================================
// 5. BOTÃO SAIR
// ========================================

document.querySelector("#btn-sair").addEventListener("click", async () => {
  const confirmar = confirm("Deseja realmente sair da sua conta?");

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível encerrar a sessão.");
    }

    localStorage.removeItem("usuario");

    window.location.href = "/login.html";
  } catch (erro) {
    console.error("Erro ao sair:", erro);
    alert("Não foi possível encerrar a sessão.");
  }
});

// ========================================
// 6. CAPTURAR ELEMENTOS
// ========================================

const formulario = document.querySelector("#form-movimentacao");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelar = document.querySelector("#btn-cancelar");
const tituloFormulario = document.querySelector("#titulo-formulario");

// ========================================
// 7. FORMATAR DATA
// ========================================

function formatarData(data) {
  if (!data) return "Data não informada";

  const dataTexto =
    typeof data === "string" ? data.slice(0, 10) : new Date(data).toISOString().slice(0, 10);

  const partes = dataTexto.split("-");

  if (partes.length !== 3) return "Data inválida";

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

// ========================================
// 8. CARREGAR MOVIMENTAÇÕES
// ========================================

async function carregarMovimentacoes() {
  try {
    const resposta = await fetch(`${API}/movimentacoes`, {
      credentials: "include",
    });

    if (resposta.status === 401) {
      localStorage.removeItem("usuario");
      window.location.href = "/login.html";
      return;
    }

    if (!resposta.ok) {
      throw new Error("Não foi possível buscar as movimentações.");
    }

    movimentacoes = await resposta.json();

    mostrarMovimentacoes();
    atualizarResumo();
  } catch (erro) {
    console.error("Erro ao carregar movimentações:", erro);

    document.querySelector("#lista-movimentacoes").innerHTML =
      "<p>Erro ao carregar os dados. Verifique se o servidor está ligado.</p>";
  }
}

// ========================================
// 9. MOSTRAR MOVIMENTAÇÕES
// ========================================

function mostrarMovimentacoes() {
  const lista = document.querySelector("#lista-movimentacoes");

  lista.innerHTML = "";

  if (movimentacoes.length === 0) {
    lista.innerHTML = "<p>Nenhuma movimentação cadastrada.</p>";
    return;
  }

  movimentacoes.forEach(function (movimentacao) {
    const card = document.createElement("div");
    card.className = `card ${movimentacao.tipo}`;

    const titulo = document.createElement("h3");
    titulo.textContent = movimentacao.descricao;

    const valor = document.createElement("p");
    valor.textContent = `Valor: ${Number(movimentacao.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;

    const tipo = document.createElement("p");
    tipo.className = "tipo-movimentacao";
    tipo.textContent = movimentacao.tipo === "receita" ? "Receita" : "Despesa";

    const data = document.createElement("p");
    data.textContent = `Data: ${formatarData(movimentacao.data)}`;

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "btn-editar";
    botaoEditar.textContent = "Editar";

    botaoEditar.addEventListener("click", function () {
      editarMovimentacao(movimentacao.id);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.textContent = "Excluir";

    botaoExcluir.addEventListener("click", function () {
      excluirMovimentacao(movimentacao.id);
    });

    card.appendChild(titulo);
    card.appendChild(valor);
    card.appendChild(tipo);
    card.appendChild(data);
    card.appendChild(botaoEditar);
    card.appendChild(botaoExcluir);

    lista.appendChild(card);
  });
}

// ========================================
// 10. ATUALIZAR RESUMO
// ========================================

function atualizarResumo() {
  let totalReceitas = 0;
  let totalDespesas = 0;

  movimentacoes.forEach(function (movimentacao) {
    const valor = Number(movimentacao.valor);

    if (movimentacao.tipo === "receita") {
      totalReceitas += valor;
    }

    if (movimentacao.tipo === "despesa") {
      totalDespesas += valor;
    }
  });

  const saldo = totalReceitas - totalDespesas;

  document.querySelector("#total-receitas").textContent = totalReceitas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  document.querySelector("#total-despesas").textContent = totalDespesas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  document.querySelector("#saldo-total").textContent = saldo.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ========================================
// 11. EDITAR MOVIMENTAÇÃO
// ========================================

function editarMovimentacao(id) {
  const movimentacao = movimentacoes.find(function (item) {
    return Number(item.id) === Number(id);
  });

  if (!movimentacao) {
    alert("Movimentação não encontrada.");
    return;
  }

  document.querySelector("#descricao").value = movimentacao.descricao;
  document.querySelector("#valor").value = movimentacao.valor;
  document.querySelector("#tipo").value = movimentacao.tipo;
  document.querySelector("#categoria").value = movimentacao.categoria;

  const dataTexto =
    typeof movimentacao.data === "string"
      ? movimentacao.data.slice(0, 10)
      : new Date(movimentacao.data).toISOString().slice(0, 10);

  document.querySelector("#data").value = dataTexto;

  idEmEdicao = movimentacao.id;

  tituloFormulario.textContent = "Editar movimentação";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.style.display = "inline-block";

  formulario.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ========================================
// 12. CANCELAR EDIÇÃO
// ========================================

function cancelarEdicao() {
  idEmEdicao = null;

  formulario.reset();

  tituloFormulario.textContent = "Nova movimentação";
  botaoSalvar.textContent = "Cadastrar movimentação";
  botaoCancelar.style.display = "none";
}

botaoCancelar.addEventListener("click", cancelarEdicao);

// ========================================
// 13. EXCLUIR MOVIMENTAÇÃO
// ========================================

async function excluirMovimentacao(id) {
  const confirmar = confirm("Deseja realmente excluir esta movimentação?");

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API}/movimentacoes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const resultado = await resposta.json();

    if (resposta.status === 401) {
      localStorage.removeItem("usuario");
      window.location.href = "/login.html";
      return;
    }

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao excluir movimentação.");
    }

    if (Number(idEmEdicao) === Number(id)) {
      cancelarEdicao();
    }

    alert("Movimentação excluída com sucesso!");

    await carregarMovimentacoes();
  } catch (erro) {
    console.error("Erro ao excluir:", erro);
    alert(erro.message);
  }
}

// ========================================
// 14. CADASTRAR OU ATUALIZAR
// ========================================

formulario.addEventListener("submit", async function (event) {
  event.preventDefault();

  const descricao = document.querySelector("#descricao").value.trim();
  const valor = Number(document.querySelector("#valor").value);
  const tipo = document.querySelector("#tipo").value;
  const categoria = document.querySelector("#categoria").value;
  const data = document.querySelector("#data").value;

  const movimentacao = {
    descricao,
    valor,
    tipo,
    categoria,
    data,
  };

  const editando = idEmEdicao !== null;

  const url = editando ? `${API}/movimentacoes/${idEmEdicao}` : `${API}/movimentacoes`;

  const metodo = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method: metodo,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movimentacao),
    });

    const resultado = await resposta.json();

    if (resposta.status === 401) {
      localStorage.removeItem("usuario");
      window.location.href = "/login.html";
      return;
    }

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao salvar movimentação.");
    }

    alert(
      editando ? "Movimentação atualizada com sucesso!" : "Movimentação cadastrada com sucesso!",
    );

    cancelarEdicao();

    await carregarMovimentacoes();

    console.log("Operação realizada:", resultado);
  } catch (erro) {
    console.error("Erro ao salvar movimentação:", erro);
    alert(erro.message);
  }
});

// ========================================
// 15. INICIAR A APLICAÇÃO
// ========================================

carregarMovimentacoes();
