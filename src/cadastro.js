const API = "http://localhost:3000/api";

const formulario = document.querySelector("#form-cadastro");
const nome = document.querySelector("#nome");
const email = document.querySelector("#email");
const senha = document.querySelector("#senha");
const confirmarSenha = document.querySelector("#confirmar-senha");
const mensagem = document.querySelector("#mensagem");
const botao = document.querySelector("#btn-cadastrar");

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagem.textContent = "";
  mensagem.style.color = "";

  const dados = {
    nome: nome.value.trim(),
    email: email.value.trim(),
    senha: senha.value,
  };

  if (!dados.nome || !dados.email || !dados.senha) {
    mensagem.textContent = "Preencha todos os campos.";
    mensagem.style.color = "red";
    return;
  }

  if (dados.senha.length < 8) {
    mensagem.textContent = "A senha precisa ter pelo menos 8 caracteres.";
    mensagem.style.color = "red";
    return;
  }

  if (dados.senha !== confirmarSenha.value) {
    mensagem.textContent = "As senhas não são iguais.";
    mensagem.style.color = "red";
    return;
  }

  try {
    botao.disabled = true;
    botao.textContent = "Cadastrando...";

    const resposta = await fetch(`${API}/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao cadastrar usuário.");
    }

    mensagem.textContent = "Conta criada com sucesso!";
    mensagem.style.color = "green";

    formulario.reset();
  } catch (erro) {
    mensagem.textContent = erro.message;
    mensagem.style.color = "red";
  } finally {
    botao.disabled = false;
    botao.textContent = "Criar conta";
  }
});
