// Barbearia da Cacau — segurança: bcrypt (senha), AES-256-CBC (CPF) e JWT com expiração
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const CHAVE = crypto.createHash('sha256').update(process.env.CHAVE_AES || 'barbearia-da-cacau-lgpd').digest();
const JWT_SEGREDO = process.env.JWT_SEGREDO || 'cacau-jwt-segredo-dev';
const EXPIRACAO = '30m';

const hashSenha = (senha) => bcrypt.hashSync(senha, 10);
const confereSenha = (senha, hash) => bcrypt.compareSync(senha, hash);

function cifrar(texto) {
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv('aes-256-cbc', CHAVE, iv);
  const enc = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

function decifrar(valor) {
  try {
    const [ivHex, encHex] = valor.split(':');
    const d = crypto.createDecipheriv('aes-256-cbc', CHAVE, Buffer.from(ivHex, 'hex'));
    return Buffer.concat([d.update(Buffer.from(encHex, 'hex')), d.final()]).toString('utf8');
  } catch (e) {
    return '';
  }
}

// Exibe apenas os 2 últimos dígitos: ***.***.***-25
function mascararCpf(cifrado) {
  const d = decifrar(cifrado);
  return d.length === 11 ? '***.***.***-' + d.slice(9) : '***.***.***-**';
}

const gerarToken = (u) => jwt.sign({ id: u.id, nome: u.nome }, JWT_SEGREDO, { expiresIn: EXPIRACAO });

function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.usuario = jwt.verify(token, JWT_SEGREDO);
    next();
  } catch (e) {
    res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

module.exports = { hashSenha, confereSenha, cifrar, decifrar, mascararCpf, gerarToken, autenticar };
