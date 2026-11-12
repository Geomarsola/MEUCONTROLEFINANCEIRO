import "../style.css";

// ========================================
// 1. CONFIGURAÇÕES
// ========================================

let movimentacoes = [];
let categorias = [];
let investimentos = [];

let idEmEdicao = null;
let idInvestimentoEmEdicao = null;

const API = "http://localhost:3000/api";

console.log("MEU CONTROLE FINANCEIRO INICIADO!");

// ========================================
// 2. VERIFICAR SESSÃO
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
// 3. ESTRUTURA DO DASHBOARD
// ========================================

const app = document.querySelector("#app");

if (!app) {
  throw new Error("Elemento #app não encontrado no HTML.");
}

app.innerHTML = `
  <div class="dashboard-layout">

    <aside class="sidebar">

      <div class="sidebar-logo">
        <div class="logo-icon">M</div>
        <div>
          <h2>Meu Controle</h2>
          <span>Financeiro</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <span class="menu-titulo">MENU PRINCIPAL</span>

        <a href="#dashboard" class="menu-link ativo">
          <span>▦</span>
          Dashboard
        </a>

        <a href="#movimentacoes" class="menu-link">
          <span>↔</span>
          Movimentações
        </a>

        <a href="#investimentos" class="menu-link">
          <span>📈</span>
          Investimentos
        </a>

        <a href="#receitas" class="menu-link">
          <span>＋</span>
          Nova movimentação
        </a>
      </nav>

      <div class="sidebar-rodape">
        <div class="usuario-avatar" id="avatar-usuario">U</div>

        <div class="usuario-info">
          <strong id="nome-sidebar"></strong>
          <span>Minha conta</span>
        </div>

        <button type="button" id="btn-sair" title="Sair">
          ↪
        </button>
      </div>

    </aside>

    <div class="dashboard-conteudo">

      <header class="topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Bem-vindo ao seu controle financeiro!</p>
        </div>

        <div class="topbar-usuario">
          <span>Olá, <strong id="nome-usuario"></strong> 👋</span>
        </div>
      </header>

      <main class="dashboard-main" id="dashboard">

        <section class="secao-boas-vindas">
          <div>
            <span class="texto-destaque">VISÃO GERAL</span>
            <h2>Suas finanças em um só lugar.</h2>
            <p>Acompanhe suas receitas, despesas, investimentos e saldo.</p>
          </div>

          <button type="button" id="btn-nova-movimentacao">
            + Nova movimentação
          </button>
        </section>

        <!-- RESUMO FINANCEIRO -->

        <section id="resumo" class="secao-resumo">

          <div class="card-resumo receita-card">
            <div class="card-resumo-topo">
              <span>Receitas</span>
              <span class="card-icone">↗</span>
            </div>
            <h2 id="total-receitas">R$ 0,00</h2>
            <p>Total de entradas</p>
          </div>

          <div class="card-resumo despesa-card">
            <div class="card-resumo-topo">
              <span>Despesas</span>
              <span class="card-icone">↘</span>
            </div>
            <h2 id="total-despesas">R$ 0,00</h2>
            <p>Total de saídas</p>
          </div>

          <div class="card-resumo saldo-card">
            <div class="card-resumo-topo">
              <span>Saldo disponível</span>
              <span class="card-icone">R$</span>
            </div>
            <h2 id="saldo-total">R$ 0,00</h2>
            <p>Receitas menos despesas</p>
          </div>

          <div class="card-resumo investimento-card">
            <div class="card-resumo-topo">
              <span>Total investido</span>
              <span class="card-icone">📈</span>
            </div>
            <h2 id="total-investido">R$ 0,00</h2>
            <p>Dinheiro aplicado</p>
          </div>

        </section>

        <!-- RELATÓRIOS -->

        <section class="secao-relatorios">

          <div class="secao-titulo">
            <div>
              <h2>Relatórios</h2>
              <p>Filtre suas movimentações e salve o resultado em PDF.</p>
            </div>
          </div>

          <div class="relatorio-controles">

            <div class="campo">
              <label for="tipo-relatorio">Tipo de relatório</label>
              <select id="tipo-relatorio">
                <option value="completo">Relatório completo</option>
                <option value="receitas">Somente receitas</option>
                <option value="despesas">Somente despesas</option>
                <option value="investimentos">Somente investimentos</option>
              </select>
            </div>

            <div class="campo">
              <label for="periodo-relatorio">Período</label>
              <select id="periodo-relatorio">
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            <div class="campo campo-data-relatorio">
              <label for="data-relatorio">Data de referência</label>
              <input type="date" id="data-relatorio">
            </div>

            <div class="campo intervalo-relatorio" hidden>
              <label for="inicio-relatorio">De</label>
              <input type="date" id="inicio-relatorio">
            </div>

            <div class="campo intervalo-relatorio" hidden>
              <label for="fim-relatorio">Até</label>
              <input type="date" id="fim-relatorio">
            </div>

            <button type="button" id="btn-baixar-relatorio">
              Baixar relatório em PDF
            </button>

          </div>
        </section>

        <!-- INVESTIMENTOS -->

        <section id="investimentos" class="secao-investimentos">

          <div class="secao-titulo">
            <div>
              <h2>Meus investimentos</h2>
              <p>Registre onde você investiu, o valor e a data da aplicação.</p>
            </div>
          </div>

          <form id="form-investimentos" class="investimento-controles">

            <div class="campo">
              <label for="valor-investido">Valor investido (R$)</label>
              <input
                type="number"
                id="valor-investido"
                min="0.01"
                step="0.01"
                placeholder="Ex.: 500,00"
                required
              >
            </div>

            <div class="campo">
              <label for="local-investimento">Onde você investiu?</label>
              <input
                type="text"
                id="local-investimento"
                maxlength="150"
                placeholder="Ex.: Nubank, CDB, Tesouro Direto..."
                required
              >
            </div>

            <div class="campo">
              <label for="data-investimento">Data do investimento</label>
              <input
                type="date"
                id="data-investimento"
                required
              >
            </div>

            <div class="botoes-formulario">
              <button type="submit" id="btn-salvar-investimento">
                Cadastrar investimento
              </button>

              <button
                type="button"
                id="btn-cancelar-investimento"
                style="display: none;"
              >
                Cancelar edição
              </button>
            </div>

            <span id="status-investimento" role="status"></span>

          </form>

          <div class="secao-titulo">
            <div>
              <h2>Histórico de investimentos</h2>
              <p>Consulte, edite ou exclua seus investimentos cadastrados.</p>
            </div>
          </div>

          <div id="lista-investimentos">
            <p>Carregando investimentos...</p>
          </div>

        </section>

        <!-- GRÁFICO -->

        <section class="secao-grafico">
          <div class="secao-titulo">
            <div>
              <h2>Visão financeira</h2>
              <p>Receitas e despesas dos últimos meses</p>
            </div>
          </div>

          <div id="grafico-mensal" class="grafico-mensal">
            <p>Carregando gráfico...</p>
          </div>
        </section>

        <!-- MOVIMENTAÇÕES -->

        <section id="movimentacoes" class="secao-movimentacoes">
          <div class="secao-titulo">
            <div>
              <h2>Movimentações recentes</h2>
              <p>Acompanhe seus últimos lançamentos.</p>
            </div>
          </div>

          <div id="lista-movimentacoes">
            <p>Carregando movimentações...</p>
          </div>
        </section>

        <!-- FORMULÁRIO DE MOVIMENTAÇÃO -->

        <section id="receitas" class="secao-formulario">

          <div class="secao-titulo">
            <div>
              <h2 id="titulo-formulario">Nova movimentação</h2>
              <p>Registre suas receitas e despesas.</p>
            </div>
          </div>

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
              </select>

              <div class="adicionar-categoria">
                <input
                  type="text"
                  id="nova-categoria"
                  maxlength="60"
                  placeholder="Nome da nova categoria"
                  aria-label="Nome da nova categoria"
                >

                <button type="button" id="btn-adicionar-categoria">
                  Adicionar
                </button>
              </div>

              <small id="status-categoria" role="status">
                Escolha o tipo da movimentação para ver as categorias.
              </small>
            </div>

            <div class="campo">
              <label for="data">Data da movimentação</label>
              <input type="date" id="data" required>
            </div>

            <div class="botoes-formulario">
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
            </div>

          </form>
        </section>

        <footer class="dashboard-footer">
          Meu Controle Financeiro © ${new Date().getFullYear()}
        </footer>

      </main>
    </div>
  </div>
`;

// ========================================
// 4. ELEMENTOS E FUNÇÕES GERAIS
// ========================================

const formulario = document.querySelector("#form-movimentacao");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelar = document.querySelector("#btn-cancelar");
const tituloFormulario = document.querySelector("#titulo-formulario");

const formularioInvestimentos = document.querySelector("#form-investimentos");
const botaoSalvarInvestimento = document.querySelector("#btn-salvar-investimento");
const botaoCancelarInvestimento = document.querySelector("#btn-cancelar-investimento");

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function obterDataHoje() {
  const hoje = new Date();

  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

async function lerRespostaApi(resposta) {
  const tipoConteudo = resposta.headers.get("content-type") || "";

  if (!tipoConteudo.includes("application/json")) {
    throw new Error("A API não reconheceu esta rota. Verifique o backend e tente novamente.");
  }

  return resposta.json();
}

function verificarSessaoExpirada(resposta) {
  if (resposta.status !== 401) return false;

  localStorage.removeItem("usuario");
  window.location.href = "/login.html";

  return true;
}

// ========================================
// 5. MOSTRAR USUÁRIO
// ========================================

document.querySelector("#nome-usuario").textContent = usuario.nome;
document.querySelector("#nome-sidebar").textContent = usuario.nome;

document.querySelector("#avatar-usuario").textContent = usuario.nome.charAt(0).toUpperCase();

// ========================================
// 6. BOTÃO SAIR
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
// 7. NAVEGAÇÃO
// ========================================

document.querySelectorAll(".menu-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".menu-link").forEach((item) => {
      item.classList.remove("ativo");
    });

    link.classList.add("ativo");
  });
});

document.querySelector("#btn-nova-movimentacao").addEventListener("click", () => {
  document.querySelector("#receitas").scrollIntoView({
    behavior: "smooth",
  });
});

// ========================================
// 8. CATEGORIAS
// ========================================

const categoriaSelect = document.querySelector("#categoria");
const tipoSelect = document.querySelector("#tipo");

function atualizarOpcoesCategoria(valorSelecionado = "") {
  const tipo = tipoSelect.value;

  const nomesPadrao =
    tipo === "receita"
      ? ["Salário", "Renda extra", "Outros"]
      : ["Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Contas", "Outros"];

  const nomes = [
    ...nomesPadrao,
    ...categorias
      .filter((item) => item.tipo === tipo || item.tipo === "ambos")
      .map((item) => item.nome),
  ];

  const nomesUnicos = [...new Set(nomes)];

  categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';

  nomesUnicos.forEach((nome) => {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    categoriaSelect.appendChild(option);
  });

  if (valorSelecionado && !nomesUnicos.includes(valorSelecionado)) {
    const option = document.createElement("option");
    option.value = valorSelecionado;
    option.textContent = valorSelecionado;
    categoriaSelect.appendChild(option);
  }

  categoriaSelect.value = valorSelecionado;

  document.querySelector("#status-categoria").textContent = tipo
    ? "Você também pode adicionar suas próprias categorias."
    : "Escolha o tipo da movimentação para ver as categorias.";
}

tipoSelect.addEventListener("change", () => atualizarOpcoesCategoria());

async function carregarCategorias() {
  try {
    const resposta = await fetch(`${API}/categorias`, {
      credentials: "include",
    });

    if (verificarSessaoExpirada(resposta)) return;

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar as categorias.");
    }

    categorias = await lerRespostaApi(resposta);
    atualizarOpcoesCategoria(categoriaSelect.value);
  } catch (erro) {
    console.error("Erro ao carregar categorias:", erro);
  }
}

document.querySelector("#btn-adicionar-categoria").addEventListener("click", async () => {
  const nome = document.querySelector("#nova-categoria").value.trim();
  const tipo = tipoSelect.value;
  const status = document.querySelector("#status-categoria");

  if (!tipo) {
    status.textContent = "Selecione primeiro se a categoria será de receita ou despesa.";
    return;
  }

  if (!nome) {
    status.textContent = "Digite o nome da categoria.";
    return;
  }

  try {
    const resposta = await fetch(`${API}/categorias`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, tipo }),
    });

    if (verificarSessaoExpirada(resposta)) return;

    const resultado = await lerRespostaApi(resposta);

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Não foi possível adicionar a categoria.");
    }

    categorias.push(resultado.categoria);
    atualizarOpcoesCategoria(nome);

    document.querySelector("#nova-categoria").value = "";
    status.textContent = `Categoria "${nome}" adicionada.`;
  } catch (erro) {
    status.textContent = erro.message;
  }
});

// ========================================
// 9. FORMATAR DATA
// ========================================

function formatarData(data) {
  if (!data) return "Data não informada";

  const dataTexto = String(data).slice(0, 10);
  const partes = dataTexto.split("-");

  if (partes.length !== 3) return "Data inválida";

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

// ========================================
// 10. CARREGAR MOVIMENTAÇÕES
// ========================================

async function carregarMovimentacoes() {
  try {
    const resposta = await fetch(`${API}/movimentacoes`, {
      credentials: "include",
    });

    if (verificarSessaoExpirada(resposta)) return;

    if (!resposta.ok) {
      throw new Error("Não foi possível buscar as movimentações.");
    }

    movimentacoes = await lerRespostaApi(resposta);

    mostrarMovimentacoes();
    atualizarResumo();
    atualizarGrafico();
  } catch (erro) {
    console.error("Erro ao carregar movimentações:", erro);

    document.querySelector("#lista-movimentacoes").textContent =
      "Erro ao carregar os dados. Verifique se o servidor está ligado.";

    document.querySelector("#grafico-mensal").textContent = "Não foi possível carregar o gráfico.";
  }
}

// ========================================
// 11. CARREGAR INVESTIMENTOS
// ========================================

async function carregarInvestimentos() {
  try {
    const resposta = await fetch(`${API}/investimentos`, {
      credentials: "include",
    });

    if (verificarSessaoExpirada(resposta)) return;

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar os investimentos.");
    }

    const resultado = await lerRespostaApi(resposta);

    investimentos = Array.isArray(resultado.investimentos) ? resultado.investimentos : [];

    mostrarInvestimentos();
    atualizarResumo();
  } catch (erro) {
    console.error("Erro ao carregar investimentos:", erro);

    document.querySelector("#lista-investimentos").textContent =
      "Não foi possível carregar o histórico de investimentos.";
  }
}

// ========================================
// 12. MOSTRAR HISTÓRICO DE INVESTIMENTOS
// ========================================

function mostrarInvestimentos() {
  const lista = document.querySelector("#lista-investimentos");

  lista.innerHTML = "";

  if (investimentos.length === 0) {
    lista.innerHTML = `
      <div class="lista-vazia">
        <span>📈</span>
        <p>Nenhum investimento cadastrado.</p>
        <small>Registre seu primeiro investimento acima.</small>
      </div>
    `;
    return;
  }

  const recentes = [...investimentos].sort((a, b) =>
    String(b.data_investimento).localeCompare(String(a.data_investimento)),
  );

  recentes.forEach((investimento) => {
    const linha = document.createElement("div");
    linha.className = "movimentacao-item investimento";

    const informacoes = document.createElement("div");
    informacoes.className = "movimentacao-info";

    const local = document.createElement("strong");
    local.textContent = investimento.local_investimento;

    const detalhes = document.createElement("span");
    detalhes.textContent = `Investimento • ${formatarData(investimento.data_investimento)}`;

    informacoes.appendChild(local);
    informacoes.appendChild(detalhes);

    const valor = document.createElement("strong");
    valor.className = "movimentacao-valor";
    valor.textContent = formatarMoeda(investimento.valor);

    const acoes = document.createElement("div");
    acoes.className = "movimentacao-acoes";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn-editar";
    editar.textContent = "Editar";

    editar.addEventListener("click", () => {
      editarInvestimento(investimento.id);
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "btn-excluir";
    excluir.textContent = "Excluir";

    excluir.addEventListener("click", () => {
      excluirInvestimento(investimento.id);
    });

    acoes.appendChild(editar);
    acoes.appendChild(excluir);

    linha.appendChild(informacoes);
    linha.appendChild(valor);
    linha.appendChild(acoes);

    lista.appendChild(linha);
  });
}

// ========================================
// 13. CADASTRAR OU ATUALIZAR INVESTIMENTO
// ========================================

formularioInvestimentos.addEventListener("submit", async (event) => {
  event.preventDefault();

  const valor = Number(document.querySelector("#valor-investido").value);
  const local_investimento = document.querySelector("#local-investimento").value.trim();
  const data_investimento = document.querySelector("#data-investimento").value;
  const status = document.querySelector("#status-investimento");

  if (!valor || valor <= 0 || !local_investimento || !data_investimento) {
    status.textContent = "Preencha todos os campos corretamente.";
    return;
  }

  const dados = {
    valor,
    local_investimento,
    data_investimento,
  };

  const editando = idInvestimentoEmEdicao !== null;

  const url = editando ? `${API}/investimentos/${idInvestimentoEmEdicao}` : `${API}/investimentos`;

  const metodo = editando ? "PUT" : "POST";

  try {
    botaoSalvarInvestimento.disabled = true;

    const resposta = await fetch(url, {
      method: metodo,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    if (verificarSessaoExpirada(resposta)) return;

    const resultado = await lerRespostaApi(resposta);

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Não foi possível salvar o investimento.");
    }

    cancelarEdicaoInvestimento();

    status.textContent = editando
      ? "Investimento atualizado com sucesso!"
      : "Investimento cadastrado com sucesso!";

    await carregarInvestimentos();
  } catch (erro) {
    console.error("Erro ao salvar investimento:", erro);
    status.textContent = erro.message;
  } finally {
    botaoSalvarInvestimento.disabled = false;
  }
});

// ========================================
// 14. EDITAR INVESTIMENTO
// ========================================

function editarInvestimento(id) {
  const investimento = investimentos.find((item) => Number(item.id) === Number(id));

  if (!investimento) {
    alert("Investimento não encontrado.");
    return;
  }

  document.querySelector("#valor-investido").value = investimento.valor;

  document.querySelector("#local-investimento").value = investimento.local_investimento;

  document.querySelector("#data-investimento").value = String(investimento.data_investimento).slice(
    0,
    10,
  );

  idInvestimentoEmEdicao = investimento.id;

  botaoSalvarInvestimento.textContent = "Salvar alterações";
  botaoCancelarInvestimento.style.display = "inline-block";

  document.querySelector("#status-investimento").textContent = "Editando investimento selecionado.";

  document.querySelector("#investimentos").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ========================================
// 15. CANCELAR EDIÇÃO DE INVESTIMENTO
// ========================================

function cancelarEdicaoInvestimento() {
  idInvestimentoEmEdicao = null;

  formularioInvestimentos.reset();

  botaoSalvarInvestimento.textContent = "Cadastrar investimento";
  botaoCancelarInvestimento.style.display = "none";

  document.querySelector("#status-investimento").textContent = "";
}

botaoCancelarInvestimento.addEventListener("click", cancelarEdicaoInvestimento);

// ========================================
// 16. EXCLUIR INVESTIMENTO
// ========================================

async function excluirInvestimento(id) {
  const confirmar = confirm("Deseja realmente excluir este investimento?");

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API}/investimentos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (verificarSessaoExpirada(resposta)) return;

    const resultado = await lerRespostaApi(resposta);

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao excluir investimento.");
    }

    if (Number(idInvestimentoEmEdicao) === Number(id)) {
      cancelarEdicaoInvestimento();
    }

    await carregarInvestimentos();

    alert("Investimento excluído com sucesso!");
  } catch (erro) {
    console.error("Erro ao excluir investimento:", erro);
    alert(erro.message);
  }
}

// ========================================
// 17. RELATÓRIOS
// ========================================

function obterIntervaloRelatorio() {
  const tipo = document.querySelector("#periodo-relatorio").value;

  if (tipo === "personalizado") {
    return {
      inicio: document.querySelector("#inicio-relatorio").value,
      fim: document.querySelector("#fim-relatorio").value,
      titulo: "Período personalizado",
    };
  }

  const referencia = document.querySelector("#data-relatorio").value || obterDataHoje();

  const data = new Date(`${referencia}T12:00:00`);

  const dataChave = (valor) =>
    `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}-${String(valor.getDate()).padStart(2, "0")}`;

  if (tipo === "mensal") {
    return {
      inicio: `${referencia.slice(0, 7)}-01`,
      fim: dataChave(new Date(data.getFullYear(), data.getMonth() + 1, 0)),
      titulo: `Relatório mensal — ${data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })}`,
    };
  }

  const inicio = new Date(data);
  inicio.setDate(data.getDate() - ((data.getDay() + 6) % 7));

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  return {
    inicio: dataChave(inicio),
    fim: dataChave(fim),
    titulo: `Relatório semanal — ${formatarData(dataChave(inicio))} a ${formatarData(dataChave(fim))}`,
  };
}

// Data inicial do relatório
document.querySelector("#data-relatorio").value = obterDataHoje();

// Alternar período personalizado
document.querySelector("#periodo-relatorio").addEventListener("change", (event) => {
  const personalizado = event.target.value === "personalizado";

  document.querySelector(".campo-data-relatorio").hidden = personalizado;

  document.querySelectorAll(".intervalo-relatorio").forEach((campo) => {
    campo.hidden = !personalizado;
  });
});

// ========================================
// GERAR RELATÓRIO PDF
// ========================================

document.querySelector("#btn-baixar-relatorio").addEventListener("click", () => {
  const intervalo = obterIntervaloRelatorio();

  const tipoRelatorio = document.querySelector("#tipo-relatorio").value;

  if (!intervalo.inicio || !intervalo.fim || intervalo.inicio > intervalo.fim) {
    alert("Informe um período válido.");
    return;
  }

  // Filtrar movimentações pelo período
  const movimentacoesPeriodo = movimentacoes
    .filter((item) => {
      const data = String(item.data).slice(0, 10);

      return data >= intervalo.inicio && data <= intervalo.fim;
    })
    .filter((item) => {
      if (tipoRelatorio === "receitas") {
        return item.tipo === "receita";
      }

      if (tipoRelatorio === "despesas") {
        return item.tipo === "despesa";
      }

      return tipoRelatorio === "completo";
    })
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));

  // Filtrar investimentos pelo período
  const investimentosPeriodo = investimentos
    .filter((item) => {
      const data = String(item.data_investimento).slice(0, 10);

      return data >= intervalo.inicio && data <= intervalo.fim;
    })
    .sort((a, b) => String(a.data_investimento).localeCompare(String(b.data_investimento)));

  // Definir quais dados entram no relatório
  const incluirReceitas = tipoRelatorio === "completo" || tipoRelatorio === "receitas";

  const incluirDespesas = tipoRelatorio === "completo" || tipoRelatorio === "despesas";

  const incluirInvestimentos = tipoRelatorio === "completo" || tipoRelatorio === "investimentos";

  // Calcular totais
  const totais = movimentacoesPeriodo.reduce(
    (acc, item) => {
      if (item.tipo === "receita") {
        acc.receita += Number(item.valor) || 0;
      }

      if (item.tipo === "despesa") {
        acc.despesa += Number(item.valor) || 0;
      }

      return acc;
    },
    { receita: 0, despesa: 0 },
  );

  const totalInvestimentos = investimentosPeriodo.reduce(
    (total, item) => total + (Number(item.valor) || 0),
    0,
  );

  // Saldo não desconta investimentos
  const saldoPeriodo = totais.receita - totais.despesa;

  // Nome do relatório
  const nomesRelatorios = {
    completo: "Relatório financeiro completo",
    receitas: "Relatório de receitas",
    despesas: "Relatório de despesas",
    investimentos: "Relatório de investimentos",
  };

  const tituloRelatorio = nomesRelatorios[tipoRelatorio];

  // Montar linhas das movimentações
  const linhasMovimentacoes = movimentacoesPeriodo
    .map(
      (item) => `
          <tr>
            <td>${formatarData(item.data)}</td>
            <td>${escapeHtml(item.descricao)}</td>
            <td>${escapeHtml(item.categoria || "Outros")}</td>
            <td>${item.tipo === "receita" ? "Receita" : "Despesa"}</td>
            <td>${formatarMoeda(item.valor)}</td>
          </tr>
        `,
    )
    .join("");

  // Montar linhas dos investimentos
  const linhasInvestimentos = investimentosPeriodo
    .map(
      (item) => `
          <tr>
            <td>${formatarData(item.data_investimento)}</td>
            <td>${escapeHtml(item.local_investimento)}</td>
            <td>Investimento</td>
            <td>Aplicação</td>
            <td>${formatarMoeda(item.valor)}</td>
          </tr>
        `,
    )
    .join("");

  // Combinar registros conforme a opção escolhida
  let linhas = "";

  if (incluirReceitas || incluirDespesas) {
    linhas += linhasMovimentacoes;
  }

  if (incluirInvestimentos) {
    linhas += linhasInvestimentos;
  }

  // Montar os indicadores do relatório
  let resumo = "";

  if (incluirReceitas) {
    resumo += `
        <div class="indicador receita">
          <span>Receitas</span>
          <strong>${formatarMoeda(totais.receita)}</strong>
        </div>
      `;
  }

  if (incluirDespesas) {
    resumo += `
        <div class="indicador despesa">
          <span>Despesas</span>
          <strong>${formatarMoeda(totais.despesa)}</strong>
        </div>
      `;
  }

  if (incluirInvestimentos) {
    resumo += `
        <div class="indicador investimento">
          <span>Investimentos</span>
          <strong>${formatarMoeda(totalInvestimentos)}</strong>
        </div>
      `;
  }

  if (tipoRelatorio === "completo") {
    resumo += `
        <div class="indicador saldo">
          <span>Saldo disponível</span>
          <strong>${formatarMoeda(saldoPeriodo)}</strong>
        </div>
      `;
  }

  // Verificar se existem registros
  if (!linhas) {
    linhas = `
        <tr>
          <td colspan="5">Nenhum registro encontrado neste período.</td>
        </tr>
      `;
  }

  // Abrir janela do PDF
  const janela = window.open("", "_blank");

  if (!janela) {
    alert("Permita a abertura da janela para gerar o PDF.");
    return;
  }

  janela.document.write(`
      <!doctype html>
      <html lang="pt-BR">

      <head>
        <meta charset="utf-8">

        <title>${escapeHtml(tituloRelatorio)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #26352a;
            padding: 32px;
          }

          h1 {
            color: #1b5e20;
            margin-bottom: 5px;
          }

          h2 {
            margin-top: 25px;
          }

          p {
            color: #526354;
          }

          .cabecalho {
            border-bottom: 2px solid #1b5e20;
            padding-bottom: 15px;
          }

          .resumo {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 25px;
          }

          .indicador {
            padding: 15px;
            border-radius: 8px;
            background: #f1f5f2;
          }

          .indicador span {
            display: block;
            color: #526354;
            margin-bottom: 8px;
          }

          .indicador strong {
            font-size: 19px;
          }

          .receita strong {
            color: #168044;
          }

          .despesa strong {
            color: #d33c3c;
          }

          .investimento strong {
            color: #7951c7;
          }

          .saldo strong {
            color: #1b5e20;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
          }

          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #dce5dd;
          }

          th {
            background: #edf5ee;
          }

          .rodape {
            margin-top: 35px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>

        <div class="cabecalho">
          <h1>Meu Controle Financeiro</h1>
          <h2>${escapeHtml(tituloRelatorio)}</h2>

          <p>
            Período: ${formatarData(intervalo.inicio)}
            até ${formatarData(intervalo.fim)}
          </p>

          <p>
            Usuário: ${escapeHtml(usuario.nome)}
          </p>
        </div>

        <h2>Resumo financeiro</h2>

        <div class="resumo">
          ${resumo}
        </div>

        <h2>Detalhamento dos registros</h2>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição / Local</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            ${linhas}
          </tbody>
        </table>

        <div class="rodape">
          Meu Controle Financeiro © ${new Date().getFullYear()}
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>

      </body>
      </html>
    `);

  janela.document.close();
});

// ========================================
// 18. PROTEGER TEXTO HTML
// ========================================

function escapeHtml(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caractere],
  );
}

// ========================================
// 19. MOSTRAR MOVIMENTAÇÕES
// ========================================

function mostrarMovimentacoes() {
  const lista = document.querySelector("#lista-movimentacoes");

  lista.innerHTML = "";

  if (movimentacoes.length === 0) {
    lista.innerHTML = `
      <div class="lista-vazia">
        <span>📋</span>
        <p>Nenhuma movimentação cadastrada.</p>
        <small>Comece registrando sua primeira receita ou despesa.</small>
      </div>
    `;
    return;
  }

  const recentes = [...movimentacoes].sort((a, b) => String(b.data).localeCompare(String(a.data)));

  recentes.forEach((movimentacao) => {
    const linha = document.createElement("div");
    linha.className = `movimentacao-item ${movimentacao.tipo}`;

    const informacoes = document.createElement("div");
    informacoes.className = "movimentacao-info";

    const descricao = document.createElement("strong");
    descricao.textContent = movimentacao.descricao;

    const detalhes = document.createElement("span");
    detalhes.textContent = `${movimentacao.categoria || "Outros"} • ${formatarData(movimentacao.data)}`;

    informacoes.appendChild(descricao);
    informacoes.appendChild(detalhes);

    const valor = document.createElement("strong");
    valor.className = "movimentacao-valor";

    valor.textContent = `${movimentacao.tipo === "receita" ? "+" : "-"} ${formatarMoeda(movimentacao.valor)}`;

    const acoes = document.createElement("div");
    acoes.className = "movimentacao-acoes";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn-editar";
    editar.textContent = "Editar";

    editar.addEventListener("click", () => {
      editarMovimentacao(movimentacao.id);
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "btn-excluir";
    excluir.textContent = "Excluir";

    excluir.addEventListener("click", () => {
      excluirMovimentacao(movimentacao.id);
    });

    acoes.appendChild(editar);
    acoes.appendChild(excluir);

    linha.appendChild(informacoes);
    linha.appendChild(valor);
    linha.appendChild(acoes);

    lista.appendChild(linha);
  });
}

// ========================================
// 20. ATUALIZAR RESUMO FINANCEIRO
// ========================================

function atualizarResumo() {
  let totalReceitas = 0;
  let totalDespesas = 0;
  let totalInvestido = 0;

  movimentacoes.forEach((movimentacao) => {
    const valor = Number(movimentacao.valor) || 0;

    if (movimentacao.tipo === "receita") {
      totalReceitas += valor;
    }

    if (movimentacao.tipo === "despesa") {
      totalDespesas += valor;
    }
  });

  investimentos.forEach((investimento) => {
    totalInvestido += Number(investimento.valor) || 0;
  });

  // Investimentos não são descontados do saldo disponível.
  const saldo = totalReceitas - totalDespesas;

  document.querySelector("#total-receitas").textContent = formatarMoeda(totalReceitas);

  document.querySelector("#total-despesas").textContent = formatarMoeda(totalDespesas);

  document.querySelector("#total-investido").textContent = formatarMoeda(totalInvestido);

  document.querySelector("#saldo-total").textContent = formatarMoeda(saldo);
}

// ========================================
// 21. GRÁFICO DOS ÚLTIMOS 6 MESES
// ========================================

function atualizarGrafico() {
  const grafico = document.querySelector("#grafico-mensal");

  grafico.innerHTML = "";

  const meses = [];

  for (let i = 5; i >= 0; i--) {
    const data = new Date();

    data.setDate(1);
    data.setMonth(data.getMonth() - i);

    meses.push({
      ano: data.getFullYear(),
      mes: data.getMonth(),
      nome: data.toLocaleDateString("pt-BR", { month: "short" }),
      receitas: 0,
      despesas: 0,
    });
  }

  movimentacoes.forEach((item) => {
    const data = new Date(`${String(item.data).slice(0, 10)}T12:00:00`);

    const mesEncontrado = meses.find(
      (mes) => mes.ano === data.getFullYear() && mes.mes === data.getMonth(),
    );

    if (!mesEncontrado) return;

    if (item.tipo === "receita") {
      mesEncontrado.receitas += Number(item.valor) || 0;
    } else if (item.tipo === "despesa") {
      mesEncontrado.despesas += Number(item.valor) || 0;
    }
  });

  const maiorValor = Math.max(1, ...meses.flatMap((mes) => [mes.receitas, mes.despesas]));

  const legenda = document.createElement("div");
  legenda.className = "grafico-legenda";

  legenda.innerHTML = `
    <span><i class="legenda-receita"></i> Receitas</span>
    <span><i class="legenda-despesa"></i> Despesas</span>
  `;

  grafico.appendChild(legenda);

  const barras = document.createElement("div");
  barras.className = "grafico-barras";

  meses.forEach((mes) => {
    const grupo = document.createElement("div");
    grupo.className = "grafico-grupo";

    const coluna = document.createElement("div");
    coluna.className = "grafico-coluna";

    const alturaReceita = (mes.receitas / maiorValor) * 100;
    const alturaDespesa = (mes.despesas / maiorValor) * 100;

    const barraReceita = document.createElement("div");
    barraReceita.className = "barra receita";
    barraReceita.style.height = `${Math.max(alturaReceita, 2)}%`;
    barraReceita.title = `Receitas: ${formatarMoeda(mes.receitas)}`;

    const barraDespesa = document.createElement("div");
    barraDespesa.className = "barra despesa";
    barraDespesa.style.height = `${Math.max(alturaDespesa, 2)}%`;
    barraDespesa.title = `Despesas: ${formatarMoeda(mes.despesas)}`;

    coluna.appendChild(barraReceita);
    coluna.appendChild(barraDespesa);

    const nomeMes = document.createElement("span");
    nomeMes.className = "grafico-mes";
    nomeMes.textContent = mes.nome;

    grupo.appendChild(coluna);
    grupo.appendChild(nomeMes);

    barras.appendChild(grupo);
  });

  grafico.appendChild(barras);
}

// ========================================
// 22. EDITAR MOVIMENTAÇÃO
// ========================================

function editarMovimentacao(id) {
  const movimentacao = movimentacoes.find((item) => Number(item.id) === Number(id));

  if (!movimentacao) {
    alert("Movimentação não encontrada.");
    return;
  }

  document.querySelector("#descricao").value = movimentacao.descricao;
  document.querySelector("#valor").value = movimentacao.valor;
  document.querySelector("#tipo").value = movimentacao.tipo;

  atualizarOpcoesCategoria(movimentacao.categoria);

  document.querySelector("#data").value = String(movimentacao.data).slice(0, 10);

  idEmEdicao = movimentacao.id;

  tituloFormulario.textContent = "Editar movimentação";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.style.display = "inline-block";

  document.querySelector("#receitas").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ========================================
// 23. CANCELAR EDIÇÃO DE MOVIMENTAÇÃO
// ========================================

function cancelarEdicao() {
  idEmEdicao = null;

  formulario.reset();

  tituloFormulario.textContent = "Nova movimentação";
  botaoSalvar.textContent = "Cadastrar movimentação";
  botaoCancelar.style.display = "none";

  atualizarOpcoesCategoria();
}

botaoCancelar.addEventListener("click", cancelarEdicao);

// ========================================
// 24. EXCLUIR MOVIMENTAÇÃO
// ========================================

async function excluirMovimentacao(id) {
  const confirmar = confirm("Deseja realmente excluir esta movimentação?");

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API}/movimentacoes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (verificarSessaoExpirada(resposta)) return;

    const resultado = await lerRespostaApi(resposta);

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao excluir movimentação.");
    }

    if (Number(idEmEdicao) === Number(id)) {
      cancelarEdicao();
    }

    await carregarMovimentacoes();

    alert("Movimentação excluída com sucesso!");
  } catch (erro) {
    console.error("Erro ao excluir:", erro);
    alert(erro.message);
  }
}

// ========================================
// 25. CADASTRAR OU ATUALIZAR MOVIMENTAÇÃO
// ========================================

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const descricao = document.querySelector("#descricao").value.trim();
  const valor = Number(document.querySelector("#valor").value);
  const tipo = document.querySelector("#tipo").value;
  const categoria = document.querySelector("#categoria").value;
  const data = document.querySelector("#data").value;

  if (!descricao || !valor || valor <= 0 || !tipo || !categoria || !data) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

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

    if (verificarSessaoExpirada(resposta)) return;

    const resultado = await lerRespostaApi(resposta);

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao salvar movimentação.");
    }

    alert(
      editando ? "Movimentação atualizada com sucesso!" : "Movimentação cadastrada com sucesso!",
    );

    cancelarEdicao();

    await carregarMovimentacoes();
  } catch (erro) {
    console.error("Erro ao salvar movimentação:", erro);
    alert(erro.message);
  }
});

// ========================================
// 26. INICIAR A APLICAÇÃO
// ========================================

document.querySelector("#data-investimento").value = obterDataHoje();
document.querySelector("#data").value = obterDataHoje();

carregarMovimentacoes();
carregarInvestimentos();
carregarCategorias();
