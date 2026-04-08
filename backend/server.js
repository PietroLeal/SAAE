const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const app = express();

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS   
  }
});

async function sendResetPasswordEmail(email, resetLink, userName) {
  try {
    const mailOptions = {
      from: `"Sistema de Agendamento de Ambientes Escolares" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Redefinição de Senha - Sistema de Agendamento de Ambientes Escolares',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #0052d4, #4364f7); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0052d4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            .warning { color: #DC143C; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Sistema de Agendamento de Ambientes Escolares</h2>
            </div>
            <div class="content">
              <h3>Olá, ${userName}!</h3>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button" style="color: white;">Redefinir Senha</a>
              </div>
              <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
              <p style="background-color: #f4f4f4; padding: 10px; word-break: break-all;">${resetLink}</p>
              <p class="warning">Este link é válido por apenas 1 hora e só pode ser usado uma vez.</p>
              <p>Se você não solicitou essa redefinição, ignore este e-mail.</p>
            </div>
            <div class="footer">
              <p>Sistema de Agendamento de Ambientes Escolares - Organize salas, agendamentos e recursos</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Redefinição de Senha - Sistema de Agendamento de Ambientes Escolares
        
        Olá, ${userName}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta.
        
        Clique no link abaixo para criar uma nova senha:
        ${resetLink}
        
        ⚠️ Este link é válido por apenas 1 hora e só pode ser usado uma vez.
        
        Se você não solicitou essa redefinição, ignore este e-mail.
        
        ---
        Sistema de Agendamento de Ambientes Escolares
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ E-mail enviado com sucesso para:', email);
    console.log('📧 ID da mensagem:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    return false;
  }
}

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:4200', 'http://localhost:8100'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const allowedTables = [
  'funcionarios',
  'salas',
  'disponibilidades',
  'reservas',
  'logs',
  'permissoes',
  'recursos',
  'perfis'
];

function validateTable(table) {
  if (!allowedTables.includes(table)) {
    throw new Error('Tabela inválida');
  }
}

function formatDateToMySQL(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT),
      multipleStatements: true
    });

    console.log('⚙️ Inicializando banco de dados...');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log('📄 Executando schema.sql...');
      await connection.query(sql);
      console.log('✅ Schema.sql executado com sucesso!');
    } else {
      console.log('⚠️ Arquivo schema.sql não encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function ensureAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT)
    });

    await connection.query(`USE ${process.env.DB_NAME}`);

    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'funcionarios'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️ Tabela funcionarios não existe ainda, aguardando criação...');
      return;
    }

    const [rows] = await connection.query(
      'SELECT id FROM funcionarios WHERE email = ?',
      [process.env.ADMIN_EMAIL || 'admin@saae.com']
    );

    if (rows.length === 0) {
      console.log('⚠️ Admin não encontrado. Criando...');
      
      const hash = process.env.ADMIN_PASSWORD_HASH || '$2a$10$e8idlDTcNYKwUgX2SURJ/OR3tDSgLNZcBOOF10P6uLMDILcXyPNfm';
      
      await connection.query(
        `INSERT INTO funcionarios (nome, email, telefone, tipo, password, protegido, createdAt) 
         VALUES (?, ?, ?, ?, ?, true, NOW())`,
        [
          process.env.ADMIN_NOME || 'Administrador',
          process.env.ADMIN_EMAIL || 'admin@saae.com',
          process.env.ADMIN_TELEFONE || '(11) 99999-9999',
          process.env.ADMIN_TIPO || 'Chefe de TI',
          hash
        ]
      );
      
      console.log('✅ Admin criado com sucesso!');
    } else {
      console.log('✅ Admin já existe no banco');
    }
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
  } finally {
    if (connection) await connection.end();
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao MariaDB com sucesso!');
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
  }
}

(async () => {
  await initDatabase();      // 1. Cria as tabelas
  await ensureAdmin();       // 2. Cria o admin
  await testConnection();    // 3. Testa conexão
})();

app.get('/api/teste', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM funcionarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        tipo: user.tipo,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});


const resetTokens = new Map();

app.post('/api/auth/request-reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório' });
    }

    const [rows] = await pool.query(
      'SELECT id, nome, email FROM funcionarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log(`⚠️ E-mail não encontrado: ${email}`);
      return res.json({ 
        message: 'Se o e-mail estiver cadastrado, você receberá um link de redefinição' 
      });
    }

    const user = rows[0];
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // Expira em 1 hora
    
    resetTokens.set(token, {
      email: user.email,
      userId: user.id,
      expiresAt
    });
    
    const appUrl = process.env.APP_URL || 'http://localhost:8100';
    const resetLink = `${appUrl}/reset-password?token=${token}`;
    
    const emailSent = await sendResetPasswordEmail(user.email, resetLink, user.nome);
    
    if (emailSent) {
      console.log(`✅ Link de redefinição enviado para: ${user.email}`);
      console.log(`🔗 Link: ${resetLink}`);
      res.json({ 
        message: 'Enviamos um link de redefinição para seu e-mail. Verifique sua caixa de entrada e spam.'
      });
    } else {
      console.log('\n========================================');
      console.log('⚠️ FALHA NO ENVIO DE E-MAIL');
      console.log('========================================');
      console.log(`📧 Para: ${user.email}`);
      console.log(`👤 Usuário: ${user.nome}`);
      console.log(`🔗 Link para redefinir (copie e cole no navegador):`);
      console.log(`${resetLink}`);
      console.log('========================================\n');
      
      res.json({ 
        message: 'Não foi possível enviar o e-mail. Por favor, entre em contato com o administrador do sistema.'
      });
    }
    
  } catch (error) {
    console.error('Erro em request-reset-password:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/verify-reset-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.json({ valid: false });
  }
  
  const tokenData = resetTokens.get(token);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    if (tokenData) resetTokens.delete(token);
    return res.json({ valid: false });
  }
  
  res.json({ valid: true });
});

app.post('/api/auth/confirm-reset-password', async (req, res) => {
  const { password, token } = req.body;
  
  if (!password || !token) {
    return res.status(400).json({ error: 'Senha e token são obrigatórios' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }
  
  const tokenData = resetTokens.get(token);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    if (tokenData) resetTokens.delete(token);
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await pool.query(
      'UPDATE funcionarios SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.userId]
    );
    
    resetTokens.delete(token);
    
    console.log(`✅ Senha redefinida com sucesso para usuário ID: ${tokenData.userId}`);
    res.json({ message: 'Senha redefinida com sucesso' });
    
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});


async function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Token inválido' });
  }
}

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, telefone, tipo, createdAt FROM funcionarios WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/api/:table', async (req, res) => {
  try {
    validateTable(req.params.table);
    const [rows] = await pool.query(`SELECT * FROM ${req.params.table}`);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/:table/query', async (req, res) => {
  try {
    validateTable(req.params.table);

    const conditions = [];
    const values = [];

    for (const [key, value] of Object.entries(req.query)) {
      if (['orderBy', 'order', 'limite'].includes(key)) continue;
      conditions.push(`${key} = ?`);
      values.push(value);
    }

    let sql = `SELECT * FROM ${req.params.table}`;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const allowedColumns = ['id', 'nome', 'email', 'data', 'createdAt', 'updatedAt'];
    let orderBy = req.query.orderBy;
    let order = req.query.order === 'DESC' ? 'DESC' : 'ASC';

    if (orderBy && !allowedColumns.includes(orderBy)) {
      return res.status(400).json({ error: 'Coluna inválida' });
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${order}`;
    }

    if (req.query.limite) {
      sql += ` LIMIT ${parseInt(req.query.limite)}`;
    }

    const [rows] = await pool.query(sql, values);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:table/:id', async (req, res) => {
  try {
    validateTable(req.params.table);

    if (req.params.table === 'permissoes') {
      const [rows] = await pool.query(
        `SELECT * FROM ${req.params.table} WHERE perfil = ?`,
        [req.params.id]
      );
      res.json(rows[0] || null);
    } else {
      const [rows] = await pool.query(
        `SELECT * FROM ${req.params.table} WHERE id = ?`,
        [req.params.id]
      );
      res.json(rows[0] || null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:table', async (req, res) => {
  try {
    validateTable(req.params.table);

    if (req.params.table !== 'funcionarios') {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
      }
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    let data = { ...req.body };

    if (data.createdAt) data.createdAt = formatDateToMySQL(data.createdAt);
    if (data.updatedAt) data.updatedAt = formatDateToMySQL(data.updatedAt);
    if (data.data) data.data = data.data.split('T')[0];

    for (let key in data) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = JSON.stringify(data[key]);
      }
    }

    if (req.params.table === 'funcionarios' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const result = await pool.query(
      `INSERT INTO ${req.params.table} SET ?`,
      [data]
    );

    res.json({ id: result[0].insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/:table/:id', authMiddleware, async (req, res) => {
  try {
    validateTable(req.params.table);

    if (req.params.table === 'funcionarios') {
      const [rows] = await pool.query(
        'SELECT email, protegido FROM funcionarios WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length > 0 && (rows[0].email === (process.env.ADMIN_EMAIL || 'admin@saae.com') || rows[0].protegido === 1)) {
        if (req.body.email || req.body.tipo || req.body.password) {
          return res.status(403).json({ error: 'Não é possível alterar email, tipo ou senha do administrador' });
        }
      }
    }

    let data = { ...req.body };

    if (data.createdAt) data.createdAt = formatDateToMySQL(data.createdAt);
    if (data.updatedAt) data.updatedAt = formatDateToMySQL(data.updatedAt);

    for (let key in data) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = JSON.stringify(data[key]);
      }
    }

    if (req.params.table === 'funcionarios' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    if (req.params.table === 'permissoes') {
      await pool.query(
        `UPDATE ${req.params.table} SET ? WHERE perfil = ?`,
        [data, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE ${req.params.table} SET ? WHERE id = ?`,
        [data, req.params.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:table/:id', authMiddleware, async (req, res) => {
  try {
    validateTable(req.params.table);

    if (req.params.table === 'funcionarios') {
      const [rows] = await pool.query(
        'SELECT email, protegido FROM funcionarios WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length > 0 && (rows[0].email === (process.env.ADMIN_EMAIL || 'admin@saae.com') || rows[0].protegido === 1)) {
        return res.status(403).json({ error: 'Usuário administrador não pode ser excluído' });
      }
    }

    if (req.params.table === 'permissoes') {
      await pool.query(
        `DELETE FROM ${req.params.table} WHERE perfil = ?`,
        [req.params.id]
      );
    } else {
      await pool.query(
        `DELETE FROM ${req.params.table} WHERE id = ?`,
        [req.params.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/disponibilidades/todos-dias', authMiddleware, async (req, res) => {
  const { salaId, nomeSala, horarios, ativo } = req.body;
  
  try {
    const dias = [
      { valor: 1, nome: 'Segunda-feira' },
      { valor: 2, nome: 'Terça-feira' },
      { valor: 3, nome: 'Quarta-feira' },
      { valor: 4, nome: 'Quinta-feira' },
      { valor: 5, nome: 'Sexta-feira' }
    ];
    
    for (const dia of dias) {
      const [existing] = await pool.query(
        'SELECT id FROM disponibilidades WHERE salaId = ? AND diaSemana = ?',
        [salaId, dia.valor]
      );
      
      if (existing.length > 0) {
        await pool.query(
          'UPDATE disponibilidades SET horarios = ?, ativo = ? WHERE id = ?',
          [JSON.stringify(horarios), ativo, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO disponibilidades (salaId, nomeSala, diaSemana, diaNome, horarios, ativo) VALUES (?, ?, ?, ?, ?, ?)',
          [salaId, nomeSala, dia.valor, dia.nome, JSON.stringify(horarios), ativo]
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar disponibilidades:', error);
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Banco: ${process.env.DB_NAME}`);
  console.log(`📧 E-mail configurado com: ${process.env.EMAIL_USER || 'não configurado'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api\n`);
});