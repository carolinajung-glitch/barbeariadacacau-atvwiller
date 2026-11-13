-- PostgreSQL | Barbearia da Cacau
-- Uso: createdb -U postgres saep_db && psql -U postgres -d saep_db -f saep_db.sql
DROP TABLE IF EXISTS agendamentos, servicos, clientes, barbeiros, usuarios CASCADE;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL
);
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cpf_enc VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(100)
);
CREATE TABLE barbeiros (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cpf_enc VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  especialidade VARCHAR(60)
);
CREATE TABLE servicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(60) NOT NULL,
  preco NUMERIC(8,2) NOT NULL,
  duracao_min INT NOT NULL,
  barbeiro_id INT NOT NULL REFERENCES barbeiros(id)
);
CREATE TABLE agendamentos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id),
  servico_id INT NOT NULL REFERENCES servicos(id),
  barbeiro_id INT NOT NULL REFERENCES barbeiros(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado','Concluído','Cancelado'))
);

INSERT INTO usuarios (nome, email, senha_hash) VALUES
  ('Administrador', 'admin@cacau.com', '$2a$10$K2UptBeuCNlegJ0TXocdQu685KclNn4rba.CSdJRkPo0Nzy33y3fG'),
  ('Recepção Centro', 'recepcao@cacau.com', '$2a$10$.Z8drkLpmsj5ODOi/tGFpuWw0ym3xxtzxyp.6f6lfplcOmZxSFgqy'),
  ('Gerente Lagoa', 'gerente@cacau.com', '$2a$10$e/ICQ1KA98FGf0fRKtN9ju5P9SETU7gRsI8zekxvxw02Ork3EvjPG');

INSERT INTO clientes (nome, cpf_enc, telefone, email) VALUES
  ('Carlos Eduardo Lima', 'b6345f120ee5df6d43475ad965011c5e:3cffc94e5e3d9e01b10076c1e62803a9', '(48) 99811-2030', 'carlos@email.com'),
  ('Rafael Moreira', 'becd809df4b007539756a5b4be3dda08:df225943e11bf28d5b231fc4db8bbd1b', '(48) 99922-4411', 'rafael@email.com'),
  ('Thiago Nunes', '1637d6b89ad6034d4f231764ed93415d:d08320944fa8f986f7b0b08692ea6eee', '(48) 98877-6655', NULL),
  ('Bruno Albuquerque', 'ac6a15ec5e7f857d0ecccb59aecd6496:d610310a1112ef439cd91f940fcb6451', '(48) 99133-0092', 'bruno@email.com');

INSERT INTO barbeiros (nome, cpf_enc, telefone, especialidade) VALUES
  ('Marcos Teixeira', '4ac30b5b91045ae8fac84a58eced1c50:c1942a0a7d1907ecccca0e7cf11ad190', '(48) 99701-1010', 'Degradê e navalhado'),
  ('Diego Campos', '6922fbebd22580654925ce55e651c020:eb9fb23b7ca27a29a14037e37fbb59c7', '(48) 99702-2020', 'Barba e bigode'),
  ('Leandro Pires', '4bccb6365d438a203263730bc9bbca4f:d1cfad24648885b34cf8e7c22db3e675', '(48) 99703-3030', 'Corte clássico');

INSERT INTO servicos (nome, preco, duracao_min, barbeiro_id) VALUES
  ('Corte degradê', 55, 45, 1),
  ('Barba completa', 40, 30, 2),
  ('Corte clássico', 45, 40, 3),
  ('Combo corte + barba', 85, 75, 1);

INSERT INTO agendamentos (cliente_id, servico_id, barbeiro_id, data, hora, status) VALUES
  (1, 1, 1, '2026-11-12', '09:00:00', 'Concluído'),
  (2, 2, 2, '2026-11-12', '10:30:00', 'Concluído'),
  (3, 3, 3, '2026-11-16', '14:00:00', 'Agendado'),
  (4, 4, 1, '2026-11-16', '16:00:00', 'Agendado'),
  (1, 2, 2, '2026-11-17', '09:30:00', 'Agendado'),
  (2, 1, 1, '2026-11-17', '11:00:00', 'Cancelado');
