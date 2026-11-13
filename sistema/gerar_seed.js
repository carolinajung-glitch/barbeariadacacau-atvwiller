// Regenera o saep_db.sql (hashes bcrypt e CPFs AES novos). Uso: npm run seed
const fs = require('fs');
const path = require('path');
const { hashSenha, cifrar } = require('./seguranca');

const q = (s) => (s === null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const lista = (linhas) => linhas.map((l) => '  (' + l.join(', ') + ')').join(',\n');

const usuarios = [
  ['Administrador', 'admin@cacau.com', 'Admin@123'],
  ['Recepção Centro', 'recepcao@cacau.com', 'Recep@123'],
  ['Gerente Lagoa', 'gerente@cacau.com', 'Gerente@123'],
];
const clientes = [
  ['Carlos Eduardo Lima', '52998224725', '(48) 99811-2030', 'carlos@email.com'],
  ['Rafael Moreira', '11144477735', '(48) 99922-4411', 'rafael@email.com'],
  ['Thiago Nunes', '39053344705', '(48) 98877-6655', null],
  ['Bruno Albuquerque', '16899535009', '(48) 99133-0092', 'bruno@email.com'],
];
const barbeiros = [
  ['Marcos Teixeira', '93541134780', '(48) 99701-1010', 'Degradê e navalhado'],
  ['Diego Campos', '74697131401', '(48) 99702-2020', 'Barba e bigode'],
  ['Leandro Pires', '12345678909', '(48) 99703-3030', 'Corte clássico'],
];
const servicos = [
  ['Corte degradê', 55, 45, 1],
  ['Barba completa', 40, 30, 2],
  ['Corte clássico', 45, 40, 3],
  ['Combo corte + barba', 85, 75, 1],
];
const agendamentos = [
  [1, 1, 1, '2026-11-12', '09:00:00', 'Concluído'],
  [2, 2, 2, '2026-11-12', '10:30:00', 'Concluído'],
  [3, 3, 3, '2026-11-16', '14:00:00', 'Agendado'],
  [4, 4, 1, '2026-11-16', '16:00:00', 'Agendado'],
  [1, 2, 2, '2026-11-17', '09:30:00', 'Agendado'],
  [2, 1, 1, '2026-11-17', '11:00:00', 'Cancelado'],
];

const ddl = fs.readFileSync(path.join(__dirname, '..', 'saep_db.sql'), 'utf8').split('INSERT INTO')[0];

const sql = ddl +
  'INSERT INTO usuarios (nome, email, senha_hash) VALUES\n' +
  lista(usuarios.map(([n, e, s]) => [q(n), q(e), q(hashSenha(s))])) + ';\n\n' +
  'INSERT INTO clientes (nome, cpf_enc, telefone, email) VALUES\n' +
  lista(clientes.map(([n, c, t, e]) => [q(n), q(cifrar(c)), q(t), q(e)])) + ';\n\n' +
  'INSERT INTO barbeiros (nome, cpf_enc, telefone, especialidade) VALUES\n' +
  lista(barbeiros.map(([n, c, t, s]) => [q(n), q(cifrar(c)), q(t), q(s)])) + ';\n\n' +
  'INSERT INTO servicos (nome, preco, duracao_min, barbeiro_id) VALUES\n' +
  lista(servicos.map(([n, p, d, b]) => [q(n), p, d, b])) + ';\n\n' +
  'INSERT INTO agendamentos (cliente_id, servico_id, barbeiro_id, data, hora, status) VALUES\n' +
  lista(agendamentos.map(([c, s, b, d, h, st]) => [c, s, b, q(d), q(h), q(st)])) + ';\n';

fs.writeFileSync(path.join(__dirname, '..', 'saep_db.sql'), sql);
console.log('saep_db.sql regenerado com sucesso.');
