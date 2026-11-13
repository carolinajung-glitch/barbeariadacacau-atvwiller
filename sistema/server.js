// Barbearia da Cacau — API REST (Express + PostgreSQL)
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const seg = require('./seguranca');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'senai',
  database: process.env.DB_NAME || 'saep_db',
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const somenteDigitos = (v) => String(v || '').replace(/\D/g, '');
const trata = (res, e) => {
  if (e.code === '23503') return res.status(409).json({ erro: 'Registro em uso: existem vínculos que impedem a exclusão ou o cadastro.' });
  if (e.code === '23505') return res.status(409).json({ erro: 'Já existe um registro com esse valor.' });
  console.error(e);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
};

// ---------- Login ----------
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  try {
    const { rows } = await pool.query('SELECT id, nome, senha_hash FROM usuarios WHERE email = $1', [String(email).trim().toLowerCase()]);
    if (!rows.length || !seg.confereSenha(senha, rows[0].senha_hash)) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    }
    res.json({ token: seg.gerarToken(rows[0]), nome: rows[0].nome });
  } catch (e) { trata(res, e); }
});

// Tudo abaixo exige token válido
app.use('/api', seg.autenticar);

app.get('/api/resumo', async (req, res) => {
  try {
    const n = async (t, where = '') => (await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} ${where}`)).rows[0].n;
    res.json({
      clientes: await n('clientes'),
      barbeiros: await n('barbeiros'),
      servicos: await n('servicos'),
      agendados: await n('agendamentos', "WHERE status = 'Agendado'"),
    });
  } catch (e) { trata(res, e); }
});

// ---------- Clientes ----------
app.get('/api/clientes', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const { rows } = q
      ? await pool.query(
          `SELECT * FROM clientes WHERE nome ILIKE $1 OR telefone ILIKE $1 OR COALESCE(email,'') ILIKE $1 ORDER BY nome`,
          ['%' + q + '%'])
      : await pool.query('SELECT * FROM clientes ORDER BY nome');
    res.json(rows.map((c) => ({ id: c.id, nome: c.nome, cpf: seg.mascararCpf(c.cpf_enc), telefone: c.telefone, email: c.email })));
  } catch (e) { trata(res, e); }
});

app.post('/api/clientes', async (req, res) => {
  const { nome, cpf, telefone, email } = req.body || {};
  const dig = somenteDigitos(cpf);
  if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
  if (dig.length !== 11) return res.status(400).json({ erro: 'CPF deve ter 11 dígitos.' });
  try {
    const r = await pool.query('INSERT INTO clientes (nome, cpf_enc, telefone, email) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome.trim(), seg.cifrar(dig), telefone.trim(), email ? email.trim() : null]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { trata(res, e); }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { nome, cpf, telefone, email } = req.body || {};
  if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
  const dig = somenteDigitos(cpf);
  if (dig && dig.length !== 11) return res.status(400).json({ erro: 'CPF deve ter 11 dígitos.' });
  try {
    await pool.query(
      'UPDATE clientes SET nome=$1, telefone=$2, email=$3, cpf_enc = COALESCE($4, cpf_enc) WHERE id=$5',
      [nome.trim(), telefone.trim(), email ? email.trim() : null, dig ? seg.cifrar(dig) : null, req.params.id]);
    res.json({ ok: true });
  } catch (e) { trata(res, e); }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try { await pool.query('DELETE FROM clientes WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { trata(res, e); }
});

// ---------- Barbeiros ----------
app.get('/api/barbeiros', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM barbeiros ORDER BY nome');
    res.json(rows.map((b) => ({ id: b.id, nome: b.nome, cpf: seg.mascararCpf(b.cpf_enc), telefone: b.telefone, especialidade: b.especialidade })));
  } catch (e) { trata(res, e); }
});

app.post('/api/barbeiros', async (req, res) => {
  const { nome, cpf, telefone, especialidade } = req.body || {};
  const dig = somenteDigitos(cpf);
  if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
  if (dig.length !== 11) return res.status(400).json({ erro: 'CPF deve ter 11 dígitos.' });
  try {
    const r = await pool.query('INSERT INTO barbeiros (nome, cpf_enc, telefone, especialidade) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome.trim(), seg.cifrar(dig), telefone.trim(), especialidade || null]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { trata(res, e); }
});

app.put('/api/barbeiros/:id', async (req, res) => {
  const { nome, cpf, telefone, especialidade } = req.body || {};
  if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
  const dig = somenteDigitos(cpf);
  if (dig && dig.length !== 11) return res.status(400).json({ erro: 'CPF deve ter 11 dígitos.' });
  try {
    await pool.query(
      'UPDATE barbeiros SET nome=$1, telefone=$2, especialidade=$3, cpf_enc = COALESCE($4, cpf_enc) WHERE id=$5',
      [nome.trim(), telefone.trim(), especialidade || null, dig ? seg.cifrar(dig) : null, req.params.id]);
    res.json({ ok: true });
  } catch (e) { trata(res, e); }
});

app.delete('/api/barbeiros/:id', async (req, res) => {
  try { await pool.query('DELETE FROM barbeiros WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { trata(res, e); }
});

// ---------- Serviços (sempre vinculados a um barbeiro) ----------
app.get('/api/servicos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nome, s.preco::float AS preco, s.duracao_min, s.barbeiro_id, b.nome AS barbeiro
         FROM servicos s JOIN barbeiros b ON b.id = s.barbeiro_id ORDER BY s.nome`);
    res.json(rows);
  } catch (e) { trata(res, e); }
});

async function validaServico(b) {
  if (!b.nome || !(Number(b.preco) >= 0) || !(Number(b.duracao_min) > 0)) return 'Informe nome, preço e duração válidos.';
  if (!b.barbeiro_id) return 'Selecione o barbeiro responsável pelo serviço.';
  const r = await pool.query('SELECT 1 FROM barbeiros WHERE id=$1', [b.barbeiro_id]);
  return r.rowCount ? null : 'Barbeiro responsável não encontrado.';
}

app.post('/api/servicos', async (req, res) => {
  try {
    const erro = await validaServico(req.body || {});
    if (erro) return res.status(400).json({ erro });
    const b = req.body;
    const r = await pool.query('INSERT INTO servicos (nome, preco, duracao_min, barbeiro_id) VALUES ($1,$2,$3,$4) RETURNING id',
      [b.nome.trim(), b.preco, b.duracao_min, b.barbeiro_id]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { trata(res, e); }
});

app.put('/api/servicos/:id', async (req, res) => {
  try {
    const erro = await validaServico(req.body || {});
    if (erro) return res.status(400).json({ erro });
    const b = req.body;
    await pool.query('UPDATE servicos SET nome=$1, preco=$2, duracao_min=$3, barbeiro_id=$4 WHERE id=$5',
      [b.nome.trim(), b.preco, b.duracao_min, b.barbeiro_id, req.params.id]);
    res.json({ ok: true });
  } catch (e) { trata(res, e); }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try { await pool.query('DELETE FROM servicos WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { trata(res, e); }
});

// ---------- Agendamentos ----------
app.get('/api/agendamentos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, to_char(a.data,'YYYY-MM-DD') AS data, to_char(a.hora,'HH24:MI') AS hora, a.status,
              c.id AS cliente_id, c.nome AS cliente, c.telefone AS cliente_telefone,
              s.nome AS servico, s.preco::float AS preco, s.duracao_min,
              b.nome AS barbeiro
         FROM agendamentos a
         JOIN clientes c ON c.id = a.cliente_id
         JOIN servicos s ON s.id = a.servico_id
         JOIN barbeiros b ON b.id = a.barbeiro_id
        ORDER BY a.data, a.hora`);
    res.json(rows);
  } catch (e) { trata(res, e); }
});

app.post('/api/agendamentos', async (req, res) => {
  const { cliente_id, servico_id, data, hora } = req.body || {};
  if (!cliente_id || !servico_id || !data || !hora) return res.status(400).json({ erro: 'Preencha cliente, serviço, data e hora.' });
  try {
    const s = await pool.query('SELECT barbeiro_id FROM servicos WHERE id=$1', [servico_id]);
    if (!s.rowCount) return res.status(400).json({ erro: 'Serviço não encontrado.' });
    const barbeiro_id = req.body.barbeiro_id || s.rows[0].barbeiro_id;
    const conflito = await pool.query(
      `SELECT 1 FROM agendamentos WHERE barbeiro_id=$1 AND data=$2 AND hora=$3 AND status <> 'Cancelado'`,
      [barbeiro_id, data, hora]);
    if (conflito.rowCount) return res.status(409).json({ erro: 'Este barbeiro já tem um atendimento nesse dia e horário.' });
    const r = await pool.query(
      'INSERT INTO agendamentos (cliente_id, servico_id, barbeiro_id, data, hora) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [cliente_id, servico_id, barbeiro_id, data, hora]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { trata(res, e); }
});

app.patch('/api/agendamentos/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!['Agendado', 'Concluído', 'Cancelado'].includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
  try { await pool.query('UPDATE agendamentos SET status=$1 WHERE id=$2', [status, req.params.id]); res.json({ ok: true }); }
  catch (e) { trata(res, e); }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try { await pool.query('DELETE FROM agendamentos WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { trata(res, e); }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log('Barbearia da Cacau rodando em http://localhost:' + PORTA + '/login.html'));
