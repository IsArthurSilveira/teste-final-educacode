export interface IntegranteProjeto {
  id: string;
  nome: string;
  matricula?: string;
  anoEscolar: string;
  genero?: 'M' | 'F';
  tamanhoCamisa?: string;
}

export type ModalidadeProjeto = 'FIC' | 'FECOM';

export type RecursoRobotica = 'Humanóide NAO' | 'EV3' | 'WeDo' | 'Arduino/maker' | 'outro';

export interface ProjetoFicFecom {
  id: string;
  titulo: string;
  modalidade: ModalidadeProjeto;
  escola: string;
  utec: string;
  professor?: string;
  estagiario?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  dataCadastro: string;

  // Pergunta 2: Integrantes
  integrantesList: IntegranteProjeto[];

  // Pergunta 4: Justificativa dos motivos
  justificativaTematica: string;

  // Pergunta 5: Processo de construção e atribuições
  processoConstrucao: string;

  // Pergunta 6: Pensar Brincando e linguagens
  pensarBrincando: string;
  linguagensUsadas: string[];

  // Pergunta 7: P de Propósito e impacto coletivo
  propositoColetivo: string;

  // Pergunta 9: Recursos de robótica usados
  recursosRobotica: string[];
  recursosOutroDescricao?: string;

  // Perguntas pedagógicas escolares e BNCC
  conteudosEscolares: string;
  competenciasBncc: string;
  habilidadesBncc: string;
}

const STORAGE_KEY = 'educacode_projetos_fic_fecom_v1';

export const DEFAULT_PROJETOS_FIC_FECOM: ProjetoFicFecom[] = [
  {
    id: 'proj-1',
    titulo: 'EcoSense: Monitoramento Inteligente da Bacia do Capibaribe',
    modalidade: 'FECOM',
    escola: 'Escola Municipal Santos Dumont',
    utec: 'UTEC Santo Amaro',
    professor: 'Carlos Eduardo Santos',
    estagiario: 'Lucas Gabriel (Estagiário)',
    status: 'em_andamento',
    dataCadastro: '2026-02-20',
    integrantesList: [
      { id: 'int-1', nome: 'Mariana Duarte Ramos', anoEscolar: '8º Ano B', genero: 'F' },
      { id: 'int-2', nome: 'Arthur Silveira de Souza', anoEscolar: '9º Ano A', genero: 'M' },
      { id: 'int-3', nome: 'Caio Felipe Mendes', anoEscolar: '8º Ano B', genero: 'M' },
      { id: 'int-4', nome: 'Letícia Barbosa Vieira', anoEscolar: '7º Ano C', genero: 'F' },
    ],
    justificativaTematica:
      'A equipe escolheu este projeto diante dos constantes alagamentos e do descarte inadequado de resíduos sólidos nas margens do Rio Capibaribe, próximo à nossa comunidade. O projeto representa nosso compromisso cidadão com a sustentabilidade e a preservação dos ecossistemas ribeirinhos da cidade do Recife.',
    processoConstrucao:
      'Iniciamos com pesquisas de campo e entrevistas com moradores ribeirinhos. A aluna Mariana liderou o mapeamento dos pontos críticos, enquanto Arthur e Caio programaram os sensores de turbidez e nível de água. Letícia ficou responsável pelo design da interface visual e documentação fotográfica do projeto.',
    pensarBrincando:
      'Utilizamos Scratch integrado a microcontroladores Arduino. Foi uma experiência estimulante testar o envio de dados em tempo real para a tela interativa. Aprendemos brincando como variáveis e blocos condicionais transformam leituras físicas em alertas sonoros e gráficos coloridos.',
    linguagensUsadas: ['Scratch', 'Arduino / C++'],
    propositoColetivo:
      'O propósito mobilizador é fornecer à comunidade escolar um sistema de alerta antecipado contra inundações e poluição hídrica, promovendo educação ambiental prática e ações de limpeza coletiva.',
    recursosRobotica: ['Arduino/maker'],
    recursosOutroDescricao: 'Sensores de turbidez e ultrassônicos',
    conteudosEscolares:
      'Ciências Naturais (ciclo da água, ecossistemas estuarinos e poluição ambiental), Geografia (bacias hidrográficas e urbanização desordenada) e Matemática (médias, porcentagem e leitura de gráficos).',
    competenciasBncc:
      'Competência Geral 2 (Pensamento científico, crítico e criativo), Competência Geral 7 (Argumentação ética e sustentabilidade) e Competência da Computação (Pensamento Computacional e Mundo Digital com análise de dados de sensores).',
    habilidadesBncc:
      'EF08CI05 (Propor ações coletivas para preservação hídrica), EF07GE09 (Mapeamento de riscos socioambientais urbanos) e EF08MA23 (Coleta, organização e interpretação de dados estatísticos).',
  },
  {
    id: 'proj-2',
    titulo: 'Robô Guia Acessível: Inclusão Escolar para Alunos com Baixa Visão',
    modalidade: 'FIC',
    escola: 'Escola Dom Bosco',
    utec: 'UTEC Boa Viagem',
    professor: 'Mariana Lima de Albuquerque',
    estagiario: 'Beatriz Martins (Estagiária)',
    status: 'concluido',
    dataCadastro: '2026-02-15',
    integrantesList: [
      { id: 'int-5', nome: 'Beatriz Vasconcelos', anoEscolar: '7º Ano A', genero: 'F' },
      { id: 'int-6', nome: 'Gabriel Henrique Santos', anoEscolar: '7º Ano A', genero: 'M' },
      { id: 'int-7', nome: 'Helena Ribeiro Costa', anoEscolar: '6º Ano C', genero: 'F' },
    ],
    justificativaTematica:
      'Decidimos construir o robô guia após a chegada de um colega com deficiência visual severa na nossa escola. Sentimos a necessidade de criar um suporte tecnológico autônomo que auxiliasse no deslocamento pelos corredores, biblioteca e refeitório com segurança e dignidade.',
    processoConstrucao:
      'O grupo projetou a estrutura física com peças LEGO Mindstorms EV3. Beatriz programou a rota sensorial usando sensor de ultrassom e giroscópio. Gabriel desenhou os avisos sonoros sintetizados e Helena realizou os testes práticos com os alunos e equipe gestora.',
    pensarBrincando:
      'Ao utilizar o EV3 e blocos de som, a equipe descobriu que programar obstáculos não precisava ser apenas teórico: testamos com vendas nos olhos e criamos um jogo onde o robô nos orientava por labirintos de cadeiras na sala de aula.',
    linguagensUsadas: ['LEGO EV3 Lab', 'Python Básico'],
    propositoColetivo:
      'Garantir autonomia e acessibilidade no ambiente escolar, transformando a escola em um espaço verdadeiramente acolhedor para pessoas com deficiência física e sensorial.',
    recursosRobotica: ['EV3'],
    conteudosEscolares:
      'Língua Portuguesa (comunicação acessível e audiodescrição), Física/Ciências (ondas sonoras, reflexão de ondas e eco) e História (direitos humanos e acessibilidade cidadã).',
    competenciasBncc:
      'Competência Geral 9 (Empatia e cooperação), Competência Geral 4 (Comunicação inclusiva) e Competência da Computação (Algoritmos de tomada de decisão e automação assistiva).',
    habilidadesBncc:
      'EF07CI01 (Propagação sonora e aplicações de sensores), EF69LP20 (Apresentação oral e defesa de soluções tecnológicas para a comunidade escolar).',
  },
  {
    id: 'proj-3',
    titulo: 'Horta Automatizada com Irrigação Solar e Inteligência Maker',
    modalidade: 'FECOM',
    escola: 'Escola João Alfredo',
    utec: 'UTEC Gregório Bezerra',
    professor: 'Renata Albuquerque Silva',
    estagiario: 'Matheus Henrique (Estagiário)',
    status: 'em_andamento',
    dataCadastro: '2026-03-01',
    integrantesList: [
      { id: 'int-8', nome: 'Júlia Nogueira Brandão', anoEscolar: '9º Ano B', genero: 'F' },
      { id: 'int-9', nome: 'Lucas Vinícius Prado', anoEscolar: '9º Ano B', genero: 'M' },
      { id: 'int-10', nome: 'Sofia Vasconcelos Lira', anoEscolar: '8º Ano A', genero: 'F' },
    ],
    justificativaTematica:
      'Nossa escola cultiva hortaliças para a merenda escolar, mas durante os finais de semana e feriados as plantas sofriam com a falta de irrigação. Desenvolvemos uma solução automatizada para combater o desperdício de água e alimentar a horta de maneira sustentável.',
    processoConstrucao:
      'O protótipo foi construído em equipe: Lucas montou a estrutura hidráulica com minibomba e relé; Júlia programou os limites de umidade do solo no Arduino; e Sofia configurou a placa fotovoltaica e o painel de monitoramento.',
    pensarBrincando:
      'Explorar a conexão entre a terra úmida, a eletricidade e o código foi como um videogame real. Testamos diferentes tipos de terra (areia, argila e adubo orgânico) e vibramos quando a bomba ligou sozinha pela primeira vez.',
    linguagensUsadas: ['Arduino / C++', 'Scratch for Arduino (S4A)'],
    propositoColetivo:
      'Contribuir com a segurança alimentar da comunidade escolar e ensinar práticas de agricultura urbana sustentável aliadas à tecnologia.',
    recursosRobotica: ['Arduino/maker'],
    recursosOutroDescricao: 'Painel solar 12V e sensor higrômetro de solo',
    conteudosEscolares:
      'Biologia/Ciências (fisiologia vegetal e transpiração), Geografia (recursos hídricos e energias renováveis) e Matemática (cálculo de vazão e temporizadores).',
    competenciasBncc:
      'Competência Geral 10 (Responsabilidade e cidadania), Competência Geral 5 (Cultura digital aplicada à produção sustentável) e Competência da Computação (Automação de processos físicos).',
    habilidadesBncc:
      'EF09CI13 (Desenvolvimento e teste de protótipos de energia limpa), EF08GE14 (Uso consciente de recursos naturais na agricultura urbana).',
  },
  {
    id: 'proj-4',
    titulo: 'Lili e o Robô Humanóide: Contação de Histórias e Alfabetização Lúdica',
    modalidade: 'FIC',
    escola: 'Escola Municipal Creuza de Oliveira',
    utec: 'UTEC Cordeiro',
    professor: 'Profª Aline Guimarães',
    estagiario: 'Gabriel Costa (Estagiário)',
    status: 'em_andamento',
    dataCadastro: '2026-03-05',
    integrantesList: [
      { id: 'int-11', nome: 'Pedro Henrique Alcantara', anoEscolar: '5º Ano A', genero: 'M' },
      { id: 'int-12', nome: 'Alice Medeiros Cavalcanti', anoEscolar: '5º Ano A', genero: 'F' },
    ],
    justificativaTematica:
      'Criar uma ponte de afeto e curiosidade científica para as crianças das turmas de alfabetização da escola, incentivando o gosto pela leitura através da interação com o robô humanóide NAO.',
    processoConstrucao:
      'As crianças roteirizaram uma peça teatral infantil sobre lendas folclóricas de Pernambuco. Programaram gestos e falas no software Choregraphe para que o robô interaja diretamente com as crianças da Educação Infantil.',
    pensarBrincando:
      'Fazer o robô dançar ciranda e contar piadas sobre o Rio Capibaribe foi uma explosão de criatividade. As crianças do 5º ano se sentiram verdadeiras diretoras de cinema e programadoras de alta tecnologia.',
    linguagensUsadas: ['Choregraphe (NAO)', 'Scratch'],
    propositoColetivo:
      'Estímulo ao letramento e democratização do acesso a tecnologias de ponta para alunos dos anos iniciais da rede pública municipal.',
    recursosRobotica: ['Humanóide NAO'],
    conteudosEscolares:
      'Língua Portuguesa (narrativa, entonação, literatura infantil e folclore pernambucano) e Artes (expressão corporal, ritmo e encenação teatral).',
    competenciasBncc:
      'Competência Geral 3 (Repertório cultural e manifestações artísticas) e Competência Geral 1 (Valorização dos saberes científicos e linguísticos).',
    habilidadesBncc:
      'EF15LP05 (Produção de textos orais com recursos paralinguísticos) e EF15AR04 (Experimentação do teatro e da robótica como linguagem artística).',
  },
];

export function getStoredProjetosFicFecom(): ProjetoFicFecom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJETOS_FIC_FECOM));
      return DEFAULT_PROJETOS_FIC_FECOM;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => ({
        ...p,
        integrantesList: (p.integrantesList || []).map((m: any) => ({
          ...m,
          matricula: m.matricula || 'S/ MATRÍCULA',
          genero: m.genero || 'M',
          tamanhoCamisa: m.tamanhoCamisa || 'M',
        })),
      }));
    }
    return DEFAULT_PROJETOS_FIC_FECOM;
  } catch (err) {
    console.error('Erro ao ler projetos FIC/FECOM do localStorage:', err);
    return DEFAULT_PROJETOS_FIC_FECOM;
  }
}

export function saveProjetoFicFecom(projeto: ProjetoFicFecom): ProjetoFicFecom[] {
  try {
    const current = getStoredProjetosFicFecom();
    const existingIndex = current.findIndex((p) => p.id === projeto.id);
    let updated: ProjetoFicFecom[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = projeto;
    } else {
      updated = [projeto, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar projeto FIC/FECOM:', err);
    return getStoredProjetosFicFecom();
  }
}

export function deleteProjetoFicFecom(id: string): ProjetoFicFecom[] {
  try {
    const current = getStoredProjetosFicFecom();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao remover projeto FIC/FECOM:', err);
    return getStoredProjetosFicFecom();
  }
}

export function clearStoredProjetosFicFecom(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Erro ao limpar projetos FIC/FECOM:', err);
  }
}

