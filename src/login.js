const API = "http://localhost:3000/api";

// ========================================
// 1. ELEMENTOS DA PÁGINA
// ========================================

const formulario = document.querySelector("#form-login");
const email = document.querySelector("#email");
const senha = document.querySelector("#senha");
const mensagem = document.querySelector("#mensagem");
const botao = document.querySelector("#btn-entrar");

// ========================================
// 2. REALIZAR LOGIN
// ========================================

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagem.textContent = "";

  try {
    botao.disabled = true;
    botao.textContent = "Entrando...";

    const resposta = await fetch(`${API}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value.trim(),
        senha: senha.value,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "E-mail ou senha inválidos.");
    }

    if (!resultado.usuario || !resultado.usuario.id) {
      throw new Error("O servidor não retornou os dados do usuário.");
    }

    // Dados apenas para exibição.
    // A autenticação verdadeira fica no cookie HttpOnly.

    localStorage.setItem("usuario", JSON.stringify(resultado.usuario));

    mensagem.textContent = "Login realizado com sucesso!";
    mensagem.style.color = "green";

    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  } catch (erro) {
    mensagem.textContent = erro.message;
    mensagem.style.color = "red";

    console.error("Erro no login:", erro);

    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});
