-- PSI Eficaz — Schema SQLite

CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT,
  nivel_atual INTEGER DEFAULT 1,
  nota_media REAL DEFAULT 0,
  tentativas_total INTEGER DEFAULT 0,
  sessoes_concluidas INTEGER DEFAULT 0,
  carga_horaria_min INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS casos_clinicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nivel INTEGER NOT NULL,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  paciente_fala TEXT NOT NULL,
  dica_pequena TEXT,
  ordem INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tentativas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  caso_id INTEGER NOT NULL,
  resposta_aluno TEXT NOT NULL,
  nota INTEGER,
  pontos_fortes TEXT,
  pontos_melhorar TEXT,
  risco_clinico TEXT,
  alternativa_experiente TEXT,
  micro_ensino TEXT,
  passou INTEGER DEFAULT 0,
  tokens_enviados INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id),
  FOREIGN KEY (caso_id) REFERENCES casos_clinicos(id)
);

CREATE TABLE IF NOT EXISTS conteudo_biblioteca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tags TEXT,
  nivel_min INTEGER DEFAULT 1,
  url TEXT
);

CREATE TABLE IF NOT EXISTS progresso (
  aluno_id INTEGER NOT NULL,
  nivel INTEGER NOT NULL,
  modulo TEXT,
  concluido INTEGER DEFAULT 0,
  nota_minima_atingida INTEGER DEFAULT 0,
  PRIMARY KEY (aluno_id, nivel, modulo)
);

CREATE INDEX idx_tentativas_aluno ON tentativas(aluno_id);
CREATE INDEX idx_tentativas_caso ON tentativas(caso_id);
CREATE INDEX idx_casos_nivel ON casos_clinicos(nivel);

-- Níveis e notas mínimas
CREATE TABLE IF NOT EXISTS niveis (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nota_minima INTEGER NOT NULL,
  carga_horaria INTEGER DEFAULT 20
);

INSERT OR IGNORE INTO niveis (id, nome, nota_minima, carga_horaria) VALUES
(1, 'Psicoterapeuta Estruturado', 80, 20),
(2, 'Psicoterapeuta Avançado', 85, 25),
(3, 'Psicoterapeuta de Alta Performance', 90, 30),
(4, 'Especialista PSI Eficaz', 95, 35);
