const db = require('./db');

function seedCasos() {
  const count = db.prepare('SELECT COUNT(*) as c FROM casos_clinicos').get().c;
  if (count > 0) return;

  const stmt = db.prepare(`
    INSERT INTO casos_clinicos (nivel, area, titulo, descricao, paciente_fala, dica_pequena, ordem)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const casos = [
    // NÍVEL 1 — Fundamentos
    [1, 'ansiedade', 'Primeiro contato', 'João, 28 anos, procura terapia pela 1ª vez. Fala rápida, olhar desviado.', '"Doutora, eu não sei se isso vai dar certo. Mas eu preciso de ajuda. Não aguento mais ficar assim."', 'Dica: A primeira intervenção é a validação, não resolução do problema.', 1],
    [1, 'depressão', 'Acolhimento inicial', 'Maria, 34 anos, vem referenciada pelo médico. Sentada, cabeça baixa, voz rouca.', '"As vezes eu nem sei porque estou aqui. Nada funciona pra mim."', 'Dica: Nomear a emoção e validar a dificuldade de vir.', 2],
    [1, 'luto', 'Escuta na perda', 'Carlos, 50 anos, perdeu a mãe há 6 meses. Olha para o chão, mãos nervosas.', '"Eu deveria estar melhor já, né? Faz tempo e eu ainda choro."', 'Dica: Não corrija o tempo. Valide a relação e a culpa.', 3],
    [1, 'autoestima', 'Construção de vínculo', 'Ana, 22 anos, permissiva, sorri muito, fala sobre a mãe.', '"Minha mãe sempre disse que eu podia mais. Mas eu nao consegui."', 'Dica: Diferencie expectativa externa da autoavaliação.', 4],
    [1, 'ansiedade', 'Clarificação de demanda', 'Pedro, 40 anos, hipertenso, veio por pressão da esposa.', '"Ela que decidiu que eu preciso vir. Eu não vejo assim."', 'Dica: Valide a posição dele e explore a própria percepção.', 5],

    // NÍVEL 2 — Avançado
    [2, 'depressão', 'Formulação de caso', 'Lucia, 30 anos, terceira sessão. Melhora leve, mas relata culpa.', '"Eu falei para minha amiga ontem e ela disse que eu não deveria sentir isso."', 'Dica: Explore a invalidação e a validação externa como mecanismo.', 1],
    [2, 'ansiedade', 'Hipóteses clínicas', 'Rafael, 27 ans, evita metrô. Evitação crescendo.', '"Eu sei que é irracional, mas meu coração acelera só de imaginar."', 'Dica: Não conteste a irracionalidade. Mapeie a cadeia de evitação.', 2],
    [2, 'luto', 'Manejo emocional', 'Sandra, 45 anos, perdeu filho. Choros incontroláveis, trabalho afetado.', '"As pessoas me dizem para seguir em frente. Eu não consigo."', 'Dica: Diferencie luto normal de luto complicado. Valide a rebeldia.', 3],
    [2, 'autoestima', 'Conceitualização', 'Bruno, 35 anos, terapeuta anterior abandonou. Desconfiança palpável.', '"A última terapeuta sumiu sem explicar. Como eu sei que você vai ficar?"', 'Dica: Valide a experiência, não prometa. Construa aliança de forma diferente.', 4],

    // NÍVEL 3 — Alta Performance
    [3, 'borderline', 'Ruptura de aliança', 'Juliana, 25 anos, diagnosticada BPD. SMS às 3h. Telefonema na sessão.', '"Você não se importa comigo. Se se importasse, atenderia."', 'Dica: Mantenha o limite sem invalidar. Nomeie o teste de vínculo.', 1],
    [3, 'casal', 'Intervenção complexa', 'Casal há 10 anos. Ela reclama que ele não ouve. Ele se cala.', '"Eu falo e ele fica olhando para o celular. É como se eu não existisse."', 'Dica: Pare o ciclo. Intervenção direta na dinâmica, não no conteúdo.', 2],
    [3, 'adolescente', 'Timing e linguagem', 'Mateus, 16 anos, mãe obrigou. Olhos no teto, respostas monossilábicas.', '"Não tem nada de errado comigo. É minha mãe que é doida."', 'Dica: Valide a posição, explore o contrato, não force a cooperação.', 3],

    // NÍVEL 4 — Especialista
    [4, 'múltiplas queixas', 'Raciocínio clínico avançado', 'Fernanda, 52 anos, dor crônica, depressão, conflito com filha. Sessão 12.', '"Ninguém entende. Os médicos dizem que é "tudo na cabeça". A minha filha nem fala mais comigo."', 'Dica: Identifique o tema central (invalidação crônica). Conecte as peças.', 1],
    [4, 'comorbidades', 'Planejamento terapêutico', 'Roberto, 38 anos, TAG + depressão + suspeita de TOC. Medicação instável.', '"Eu já tomei tanta coisa... às vezes eu acho que vou ficar assim para sempre."', 'Dica: Ordenar prioridades. Não trate tudo ao mesmo tempo. Escolha um ponto de entrada.', 2],
  ];

  for (const c of casos) stmt.run(...c);
  console.log('[seed] Casos clínicos inseridos:', casos.length);
}

seedCasos();
