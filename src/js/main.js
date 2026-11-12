import "../style.css";

// ========================================
// 1. CONFIGURAÇÕES
// ========================================

let movimentacoes = [];
let idEmEdicao = null;

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
                        <p>Acompanhe suas receitas, despesas e seu saldo.</p>
                    </div>

                    <button type="button" id="btn-nova-movimentacao">
                        + Nova movimentação
                    </button>
                </section>

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

                </section>

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
// 4. ELEMENTOS
// ========================================

const formulario = document.querySelector("#form-movimentacao");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelar = document.querySelector("#btn-cancelar");
const tituloFormulario = document.querySelector("#titulo-formulario");

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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
// 7. NAVEGAÇÃO DO MENU
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
// 8. FORMATAR DATA
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
// 9. CARREGAR MOVIMENTAÇÕES
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
    atualizarGrafico();
  } catch (erro) {
    console.error("Erro ao carregar movimentações:", erro);

    document.querySelector("#lista-movimentacoes").textContent =
      "Erro ao carregar os dados. Verifique se o servidor está ligado.";

    document.querySelector("#grafico-mensal").textContent = "Não foi possível carregar o gráfico.";
  }
}

// ========================================
// 10. MOSTRAR MOVIMENTAÇÕES
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
// 11. ATUALIZAR RESUMO
// ========================================

function atualizarResumo() {
  let totalReceitas = 0;
  let totalDespesas = 0;

  movimentacoes.forEach((movimentacao) => {
    const valor = Number(movimentacao.valor);

    if (movimentacao.tipo === "receita") {
      totalReceitas += valor;
    }

    if (movimentacao.tipo === "despesa") {
      totalDespesas += valor;
    }
  });

  const saldo = totalReceitas - totalDespesas;

  document.querySelector("#total-receitas").textContent = formatarMoeda(totalReceitas);

  document.querySelector("#total-despesas").textContent = formatarMoeda(totalDespesas);

  document.querySelector("#saldo-total").textContent = formatarMoeda(saldo);
}

// ========================================
// 12. GRÁFICO DOS ÚLTIMOS 6 MESES
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
      mesEncontrado.receitas += Number(item.valor);
    } else if (item.tipo === "despesa") {
      mesEncontrado.despesas += Number(item.valor);
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
// 13. EDITAR MOVIMENTAÇÃO
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
  document.querySelector("#categoria").value = movimentacao.categoria;

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
// 14. CANCELAR EDIÇÃO
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
// 15. EXCLUIR MOVIMENTAÇÃO
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
// 16. CADASTRAR OU ATUALIZAR
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
  } catch (erro) {
    console.error("Erro ao salvar movimentação:", erro);
    alert(erro.message);
  }
});

// ========================================
// 17. INICIAR A APLICAÇÃO
// ========================================

carregarMovimentacoes();
