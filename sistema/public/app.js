// Barbearia da Cacau — funções compartilhadas do front-end
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinheiro = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  const sem = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return sem + ', ' + d.toLocaleDateString('pt-BR');
};

function sair() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('nome');
  location.href = 'login.html';
}

async function api(url, metodo = 'GET', corpo) {
  const r = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('token') },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.endsWith('/login')) {
    alert('Sua sessão expirou. Entre novamente.');
    sair();
    throw new Error('sessão expirada');
  }
  if (!r.ok) throw new Error(dados.erro || 'Algo deu errado.');
  return dados;
}

let tTimer;
function aviso(texto, erro = false) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = texto;
  t.className = 'on' + (erro ? ' erro' : '');
  clearTimeout(tTimer);
  tTimer = setTimeout(() => (t.className = ''), 3200);
}

// Monta o menu lateral com o nome do usuário logado e o botão de sair
function iniciar(pagina) {
  if (!sessionStorage.getItem('token')) { location.href = 'login.html'; return false; }
  const links = [
    ['index.html', 'Painel'],
    ['agendamentos.html', 'Agendamentos'],
    ['clientes.html', 'Clientes'],
    ['barbeiros.html', 'Barbeiros e serviços'],
  ];
  document.getElementById('menu').innerHTML =
    '<div class="marca"><span class="pole"></span><span>Barbearia<br>da Cacau</span></div>' +
    '<nav aria-label="Principal">' +
    links.map(([h, t]) => `<a href="${h}"${h === pagina ? ' aria-current="page"' : ''}>${t}</a>`).join('') +
    '</nav><div class="usuario"><span>Logado como</span><strong>' + esc(sessionStorage.getItem('nome')) +
    '</strong><button class="btn" id="btnSair" type="button">Sair</button></div>';
  document.getElementById('btnSair').onclick = sair;
  return true;
}
