// script.js atualizado para uso com backend (sem localStorage)

let usuarioLogado = null;

function abrirPainelLogin() {
  document.getElementById('painelLogin').classList.remove('hidden');
  document.getElementById('painelUsuario').classList.add('hidden');
}

function fazerLogin() {
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const erro = document.getElementById('erroLogin');

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha })
  })
  .then(res => res.json())
  .then(data => {
    if (data.sucesso) {
      document.getElementById('painelLogin').classList.add('hidden');
      document.getElementById('painelADM').classList.remove('hidden');
      document.getElementById('painelDeposito').classList.add('hidden');
      atualizarListaCupons();
      atualizarListaSolicitacoes();
    } else {
      erro.textContent = data.mensagem || "Erro no login.";
    }
  });
}

function loginUsuario() {
  const nome = document.getElementById('usuarioNome').value.trim();
  const id = document.getElementById('usuarioID').value.trim();
  const telefone = document.getElementById('usuarioTelefone').value.trim();
  const erro = document.getElementById('erroUsuario');

  if (nome && id && telefone) {
    usuarioLogado = { nome, id, telefone };
    document.getElementById('painelUsuario').classList.add('hidden');
    document.getElementById('painelDeposito').classList.remove('hidden');
    document.getElementById('infoUsuario').innerHTML =
      `🎫 Jogador: <strong>${nome}</strong> | ID: <strong>${id}</strong> | Tel: <strong>${telefone}</strong>`;
  } else {
    erro.textContent = "Preencha todos os campos para continuar.";
  }
}

function adicionarCupom() {
  const cupom = document.getElementById('novoCupom').value.trim().toLowerCase();
  if (cupom) {
    fetch('/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cupom })
    })
    .then(res => res.json())
    .then(() => {
      document.getElementById('novoCupom').value = '';
      atualizarListaCupons();
    });
  }
}

function atualizarListaCupons() {
  fetch('/cupons')
    .then(res => res.json())
    .then(cupons => {
      const ul = document.getElementById('listaCupons');
      ul.innerHTML = '';
      cupons.forEach((cupom, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${cupom}`;
        ul.appendChild(li);
      });
    });
}

function calcularRecebimento() {
  const cupom = document.getElementById('campoCupom').value.trim().toLowerCase();
  const deposito = parseFloat(document.getElementById('campoDeposito').value);
  const resultadoDiv = document.getElementById('resultadoPublico');

  if (!usuarioLogado) {
    resultadoDiv.innerHTML = "Você precisa estar logado.";
    return;
  }
  if (isNaN(deposito) || deposito <= 0) {
    resultadoDiv.innerHTML = "Digite um valor de depósito válido.";
    return;
  }

  fetch('/solicitacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...usuarioLogado, cupom, deposito })
  })
  .then(res => res.json())
  .then(data => {
    resultadoDiv.innerHTML = `
      ✅ <strong>Recebemos sua solicitação!</strong><br>
      Em breve entraremos em contato pelo telefone informado.<br><br>
      Cupom: <strong>${data.cupom}</strong><br>
      Status: ${data.status}<br>
      Você irá receber: <strong>${data.valorFinal} Reais</strong>`;
    atualizarListaSolicitacoes();
  });
}

function atualizarListaSolicitacoes() {
  fetch('/solicitacoes')
    .then(res => res.json())
    .then(lista => {
      const ul = document.getElementById('listaSolicitacoes');
      ul.innerHTML = '';
      lista.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${i + 1}</strong> - ${s.nome} (ID: ${s.id}, Tel: ${s.telefone})<br>
          Cupom: <strong>${s.cupom}</strong> | Status: ${s.status}<br>
          Depósito: ${s.deposito} → Vai receber: <strong>${s.valorFinal} Reais</strong><br>
          <span>Status de pagamento: <strong style="color: ${s.pago ? '#00ff00' : '#ff4444'}">${s.pago ? 'Pago' : 'Não pago'}</strong></span><br>
          ${!s.pago ? `<button onclick="marcarComoPago(${s.id})">✔ Marcar como pago</button>` : ''}<hr>`;
        ul.appendChild(li);
      });
    });
}

function marcarComoPago(id) {
  fetch(`/solicitacao/${id}/pagar`, { method: 'POST' })
    .then(() => atualizarListaSolicitacoes());
}

function exportarCSV() {
  window.location.href = '/exportar_csv';
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarListaCupons();
  atualizarListaSolicitacoes();
});
