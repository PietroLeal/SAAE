
CREATE DATABASE IF NOT EXISTS reserva_salas;
USE reserva_salas;

CREATE TABLE IF NOT EXISTS funcionarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  tipo VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  protegido BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipoAmbiente VARCHAR(50) NOT NULL,
  capacidade INT NOT NULL,
  recursos JSON,
  descricao TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disponibilidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salaId INT NOT NULL,
  nomeSala VARCHAR(100) NOT NULL,
  diaSemana INT NOT NULL,
  diaNome VARCHAR(20) NOT NULL,
  horarios JSON NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (salaId) REFERENCES salas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salaId INT NOT NULL,
  salaNome VARCHAR(100) NOT NULL,
  usuarioId INT NOT NULL,
  usuarioNome VARCHAR(100) NOT NULL,
  data DATE NOT NULL,
  horario INT NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmada',
  motivo TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salaId) REFERENCES salas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuarioId) REFERENCES funcionarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  acao VARCHAR(100) NOT NULL,
  usuarioId INT NOT NULL,
  usuarioNome VARCHAR(100) NOT NULL,
  usuarioTipo VARCHAR(50) NOT NULL,
  detalhes JSON,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES funcionarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissoes (
  perfil VARCHAR(50) PRIMARY KEY,
  verDashboard BOOLEAN DEFAULT FALSE,
  agendarSala BOOLEAN DEFAULT FALSE,
  cancelarAgendamento BOOLEAN DEFAULT FALSE,
  verSalas BOOLEAN DEFAULT FALSE,
  gerenciarSalas BOOLEAN DEFAULT FALSE,
  gerenciarDisponibilidade BOOLEAN DEFAULT FALSE,
  verUsuarios BOOLEAN DEFAULT FALSE,
  gerenciarUsuarios BOOLEAN DEFAULT FALSE,
  verRelatorios BOOLEAN DEFAULT FALSE,
  gerarRelatorios BOOLEAN DEFAULT FALSE,
  verLogs BOOLEAN DEFAULT FALSE,
  gerenciarRecursos BOOLEAN DEFAULT FALSE,
  gerenciarPerfis BOOLEAN DEFAULT FALSE,
  manutencaoSistema BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS recursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perfis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT IGNORE INTO permissoes (perfil, verDashboard, agendarSala, cancelarAgendamento, verSalas, gerenciarSalas, gerenciarDisponibilidade, verUsuarios, gerenciarUsuarios, verRelatorios, gerarRelatorios, verLogs, gerenciarRecursos, gerenciarPerfis, manutencaoSistema) VALUES 
('Professor', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
('Funcionário Administrativo', 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0),
('Coordenador', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0),
('Diretor', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
('Chefe de TI', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);

INSERT IGNORE INTO perfis (nome, descricao) VALUES 
('Professor', 'Usuário comum que pode agendar salas'),
('Funcionário Administrativo', 'Usuário com permissões administrativas básicas'),
('Coordenador', 'Usuário com permissões de coordenação'),
('Diretor', 'Usuário com permissões de direção'),
('Chefe de TI', 'Usuário com todas as permissões do sistema');

INSERT IGNORE INTO recursos (nome, descricao) VALUES
('Projetor', 'Projetor multimídia com HDMI e VGA'),
('Quadro Branco', 'Quadro branco com marcadores'),
('Ar Condicionado', 'Ar condicionado split 12000 BTUs'),
('Cadeiras', 'Cadeiras estofadas'),
('Mesas', 'Mesas para trabalho em grupo'),
('Computador', 'Computador com acesso à internet'),
('Caixa de Som', 'Caixa de som amplificada'),
('Microfone', 'Microfone sem fio');

INSERT IGNORE INTO salas (nome, tipoAmbiente, capacidade, recursos, ativa) VALUES
('Sala 101', 'sala', 40, '[1,2,3]', TRUE),
('Sala 102', 'sala', 40, '[1,2,3]', TRUE),
('Laboratório de Química', 'laboratorio', 30, '[1,4,5]', TRUE),
('Laboratório de Informática', 'sala_informatica', 35, '[1,6,7]', TRUE),
('Auditório Principal', 'auditorio', 150, '[1,3,7,8]', TRUE),
('Biblioteca', 'biblioteca', 50, '[4,5]', TRUE),
('Quadra Esportiva', 'quadra', 80, '[]', TRUE);

INSERT IGNORE INTO disponibilidades (salaId, nomeSala, diaSemana, diaNome, horarios, ativo) VALUES
(1, 'Sala 101', 1, 'Segunda-feira', '[1,2,3,4,5,6,7,8,9,10,11,12]', TRUE),
(1, 'Sala 101', 2, 'Terça-feira', '[1,2,3,4,5,6,7,8,9,10,11,12]', TRUE),
(1, 'Sala 101', 3, 'Quarta-feira', '[1,2,3,4,5,6,7,8,9,10,11,12]', TRUE),
(1, 'Sala 101', 4, 'Quinta-feira', '[1,2,3,4,5,6,7,8,9,10,11,12]', TRUE),
(1, 'Sala 101', 5, 'Sexta-feira', '[1,2,3,4,5,6,7,8,9,10,11,12]', TRUE);