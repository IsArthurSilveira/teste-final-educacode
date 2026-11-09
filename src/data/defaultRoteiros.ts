export interface RoteiroDidatico {
  id: string;
  segmento: 'ANOS INICIAIS' | 'ANOS FINAIS';
  modulo: string;
  titulo: string;
  subtitulo: string;
  anoSugerido: string;
  categoria?: string;
  duracao: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  bncc: string[];
  objetivos: string[];
  materiais: string[];
  etapas: {
    aquecimento: string;
    desenvolvimento: string;
    maoNaMassa: string;
    desafio: string;
    avaliacao: string;
  };
  linkMaterial?: string;
  autor?: string;
  createdAt?: string;
}

export const MODULOS_ANOS_INICIAIS = [
  'Scratch Jr',
  'WeDo',
  'Spike Essential',
] as const;

export const MODULOS_ANOS_FINAIS = [
  'Scratch',
  'EV3',
  'Spike Prime',
  'Python',
  'Arduino / Maker',
] as const;

export const TODOS_MODULOS = [
  ...MODULOS_ANOS_INICIAIS,
  ...MODULOS_ANOS_FINAIS,
] as const;

export const DEFAULT_ROTEIROS: RoteiroDidatico[] = [
  // ==================== ANOS INICIAIS ====================
  {
    id: 'rot-ini-01',
    segmento: 'ANOS INICIAIS',
    modulo: 'Scratch Jr',
    titulo: 'Histórias Interativas e Animações com Scratch Jr',
    subtitulo: 'Introdução à programação visual em tablets, sequenciamento e contação de histórias',
    anoSugerido: '1º e 2º Ano',
    categoria: 'Scratch Jr',
    duracao: '2 Encontros (4 horas/aula)',
    nivel: 'Iniciante',
    bncc: ['EF01MA09', 'EF02MA12', 'EF15AR26'],
    objetivos: [
      'Compreender o conceito de algoritmo através de blocos gráficos intuitivos.',
      'Desenvolver noções de sequência temporal e lateralidade na movimentação de personagens.',
      'Criar uma narrativa digital autoral integrando texto, som gravado e animação.',
    ],
    materiais: [
      'Tablets com o aplicativo Scratch Jr instalado',
      'Cartões impressos com os blocos de movimento (amarelos e azuis)',
      'Folha de storyboard para desenho prévio das cenas',
    ],
    etapas: {
      aquecimento: 'Conversa em roda: como os personagens de desenhos ganham vida? Dinâmica com cartões de movimento guiando o colega.',
      desenvolvimento: 'Apresentação do palco do Scratch Jr, troca de cenário e comandos de início com a bandeira verde.',
      maoNaMassa: 'Criação de uma história animada com dois personagens conversando sobre preservação ambiental no Recife.',
      desafio: 'Fazer o personagem tocar um áudio gravado pela própria criança ao encostar em outro objeto.',
      avaliacao: 'Compartilhamento das animações em duplas e registro da cena favorita na ficha de atividades.',
    },
    linkMaterial: 'https://scratchjr.org',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'rot-ini-02',
    segmento: 'ANOS INICIAIS',
    modulo: 'WeDo',
    titulo: 'Guindaste e Carrossel Motorizado com LEGO WeDo',
    subtitulo: 'Mecanismos de transmissão, engrenagens, polias e sensor de inclinação',
    anoSugerido: '2º ao 4º Ano',
    categoria: 'WeDo',
    duracao: '2 Encontros (4 horas/aula)',
    nivel: 'Iniciante',
    bncc: ['EF03CI01', 'EF04CI04', 'EF05MA18'],
    objetivos: [
      'Explorar princípios de máquinas simples: engrenagens retas, correias e polias de redução.',
      'Montar estrutura articulada motorizada com peças LEGO Education WeDo.',
      'Programar motor inteligente para girar em sentido horário e anti-horário com sensor.',
    ],
    materiais: [
      'Kits LEGO Education WeDo 2.0 com hub Bluetooth',
      'Computadores ou tablets com o software WeDo',
      'Objetos leves (borrachas, blocos plásticos) para carga do guindaste',
    ],
    etapas: {
      aquecimento: 'Apresentação de guindastes portuários do Porto de Suape e debate: como motores conseguem erguer cargas pesadas?',
      desenvolvimento: 'Experimento prático com engrenagem motora grande e movida pequena para comparar velocidade e força.',
      maoNaMassa: 'Construção guiada do guindaste com correia de transmissão e programação de acionamento por botão na tela.',
      desafio: 'Adicionar o sensor de inclinação para fazer o guindaste erguer o gancho quando o sensor for inclinado para cima.',
      avaliacao: 'Teste de carga: verificar qual grupo montou a transmissão mais estável e registrar no diário maker.',
    },
    linkMaterial: 'https://education.lego.com',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'rot-ini-03',
    segmento: 'ANOS INICIAIS',
    modulo: 'Spike Essential',
    titulo: 'Parque de Diversões Interativo com LEGO Spike Essential',
    subtitulo: 'Sensores de cor, matriz de LED e programação lúdica de atrações motorizadas',
    anoSugerido: '3º ao 5º Ano',
    categoria: 'Spike Essential',
    duracao: '3 Encontros (6 horas/aula)',
    nivel: 'Intermediário',
    bncc: ['EF04CI02', 'EF05MA22', 'EF15AR23'],
    objetivos: [
      'Integrar o sensor de cor para automação de paradas de emergência em brinquedos.',
      'Utilizar a matriz de luz 3x3 para exibir emojis e mensagens de boas-vindas.',
      'Trabalhar em equipe na construção colaborativa de uma maquete de parque temático.',
    ],
    materiais: [
      'Kits LEGO Spike Essential com hub inteligente e motores angulares',
      'Sensor de cor e luz LEGO',
      'Peças decorativas e cartolinas coloridas para ambientação',
    ],
    etapas: {
      aquecimento: 'Debate sobre segurança em parques de diversão: como os brinquedos modernos sabem a hora de parar?',
      desenvolvimento: 'Exploração dos blocos de ícones do Spike Essential: controle de velocidade de rotação e leitura de cor.',
      maoNaMassa: 'Montagem de uma roda-gigante ou carrinho maluco acionado por cores: verde acelera, vermelho freia.',
      desafio: 'Programar a matriz de LED para desenhar um sorriso quando o carrinho estiver em movimento e um X ao parar.',
      avaliacao: 'Exposição das atrações na sala e demonstração prática do funcionamento dos sensores.',
    },
    linkMaterial: 'https://education.lego.com/spike-essential',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-02-20T10:00:00Z',
  },

  // ==================== ANOS FINAIS ====================
  {
    id: 'rot-fin-01',
    segmento: 'ANOS FINAIS',
    modulo: 'Scratch',
    titulo: 'Desenvolvimento de Game 2D de Aventura com Scratch',
    subtitulo: 'Lógica condicional avançada, variáveis de pontuação, colisões e controle de gravidade',
    anoSugerido: '6º e 7º Ano',
    categoria: 'Scratch',
    duracao: '3 Encontros (6 horas/aula)',
    nivel: 'Intermediário',
    bncc: ['EF06MA24', 'EF07MA31', 'EF69AR35'],
    objetivos: [
      'Implementar sistema de coordenadas cartesianas (X e Y) para movimentação suave de personagens.',
      'Criar mecânica de gravidade e detecção precisa de bordas e plataformas por cor.',
      'Gerenciar variáveis globais de vidas, placar e temporizador da fase.',
    ],
    materiais: [
      'Computadores com acesso ao Scratch 3.0 online ou instalado',
      'Banco de sprites e efeitos sonoros livres de direitos',
      'Guia de depuração de lógica (debug) em blocos',
    ],
    etapas: {
      aquecimento: 'Análise de clássicos dos videogames 2D: como a física simples de saltos funciona na tela?',
      desenvolvimento: 'Programação do loop principal: blocos "sempre", operadores condicionais "se... então" e gravidade.',
      maoNaMassa: 'Criação do jogo "Guardiões do Recife": desviar de obstáculos e coletar materiais recicláveis para pontuar.',
      desafio: 'Implementar tela de Game Over e vitória com reinício automático ao pressionar a tecla de espaço.',
      avaliacao: 'Playtest cruzado entre colegas da turma com preenchimento de ficha de feedback técnico.',
    },
    linkMaterial: 'https://scratch.mit.edu',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'rot-fin-02',
    segmento: 'ANOS FINAIS',
    modulo: 'EV3',
    titulo: 'Missão Autônoma de Resgate e Navegação com LEGO EV3',
    subtitulo: 'Sensor ultrassônico, giroscópio de precisão e controle de malha fechada',
    anoSugerido: '7º ao 9º Ano',
    categoria: 'EV3',
    duracao: '4 Encontros (8 horas/aula)',
    nivel: 'Avançado',
    bncc: ['EF07CI05', 'EF08CI06', 'EF09MA06'],
    objetivos: [
      'Programar robô com blocos EV3-G ou Scratch EV3 para contorno autônomo de obstáculos.',
      'Utilizar giroscópio integrado para rotações precisas em ângulos de 90 e 180 graus.',
      'Construir garra motora para resgate e transporte de objeto até a zona segura.',
    ],
    materiais: [
      'Kits LEGO MINDSTORMS EV3 Core Set com tijolo inteligente',
      '2 Servomotores grandes e 1 servomotor médio',
      'Sensores ultrassônico, de toque e giroscópio',
      'Arena de testes com obstáculos e fita de delimitação',
    ],
    etapas: {
      aquecimento: 'Apresentação de desafios da OBR (Olimpíada Brasileira de Robótica) e missões de busca em áreas de desastre.',
      desenvolvimento: 'Estudo do sensor ultrassônico medindo distâncias em centímetros e calibração de curvas com giroscópio.',
      maoNaMassa: 'Montagem mecânica do robô móvel com tração diferencial e implementação da rotina de varredura autônoma.',
      desafio: 'Percorrer um labirinto sem tocar em nenhuma parede e acionar a garra para resgatar a vítima simulada.',
      avaliacao: 'Tomada de tempo oficial na pista de testes e discussão sobre repetibilidade de trajetórias.',
    },
    linkMaterial: 'https://education.lego.com/mindstorms-ev3',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'rot-fin-03',
    segmento: 'ANOS FINAIS',
    modulo: 'Spike Prime',
    titulo: 'Robô Classificador com Sensor de Cor Spike Prime',
    subtitulo: 'Robótica competitiva, cinemática de manipuladores e programação em blocos ou Python',
    anoSugerido: '7º ao 9º Ano',
    categoria: 'Spike Prime',
    duracao: '3 Encontros (6 horas/aula)',
    nivel: 'Avançado',
    bncc: ['EF07MA29', 'EF08CI02', 'EF09CI13'],
    objetivos: [
      'Configurar o sensor óptico de cores Spike Prime para distinguir matizes e intensidades de luz.',
      'Programar rotina de esteira rolante ou braço seletor com parada e descarte categorizado.',
      'Explorar a transição suave de blocos visuais para comandos de texto em MicroPython.',
    ],
    materiais: [
      'Kits LEGO Education Spike Prime com Hub avançado de 6 portas',
      'Motores angulares de precisão',
      'Peças LEGO coloridas para teste de classificação automática',
    ],
    etapas: {
      aquecimento: 'Estudo de caso: como centros de triagem de reciclagem separam materiais por sensores ópticos em alta velocidade.',
      desenvolvimento: 'Configuração do sensor de cores do Spike Prime e estrutura de decisão condicional aninhada.',
      maoNaMassa: 'Construção do robô triador: leitura da peça, rotação para o cesto correspondente e descarte mecânico.',
      desafio: 'Contar em tempo real quantas peças de cada cor foram separadas e exibir o total na tela matricial.',
      avaliacao: 'Demonstração em grupo do percentual de acerto e debate sobre calibração de iluminação ambiente.',
    },
    linkMaterial: 'https://education.lego.com/spike-prime',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'rot-fin-04',
    segmento: 'ANOS FINAIS',
    modulo: 'Python',
    titulo: 'Lógica Computacional e Análise de Dados com Python',
    subtitulo: 'Programação textual, estruturas de repetição, funções e análise de dados reais',
    anoSugerido: '8º e 9º Ano',
    categoria: 'Python',
    duracao: '4 Encontros (8 horas/aula)',
    nivel: 'Avançado',
    bncc: ['EF08MA04', 'EF09MA08', 'EF09CI14'],
    objetivos: [
      'Dominar a sintaxe fundamental da linguagem Python: variáveis, tipos de dados e indentação.',
      'Manipular listas, dicionários e laços for/while para processamento de informações.',
      'Desenvolver um programa de linha de comando para análise estatística e simulação científica.',
    ],
    materiais: [
      'Computadores com Python 3 ou ambiente web (Replit / Jupyter Notebook)',
      'Conjuntos de dados abertos (temperatura, chuva ou trânsito urbano em formato CSV)',
      'Apostila prática de exercícios de sintaxe Python',
    ],
    etapas: {
      aquecimento: 'Discussão sobre inteligência artificial e linguagens de programação usadas na indústria tecnológica.',
      desenvolvimento: 'Conceitos de entrada (input), processamento matemático e formatação de saídas limpas no terminal.',
      maoNaMassa: 'Construção de uma calculadora científica de consumo energético e simulador de custos escolares.',
      desafio: 'Ler um arquivo com temperaturas de uma semana e calcular automaticamente a média, máxima e amplitude térmica.',
      avaliacao: 'Apresentação dos scripts desenvolvidos e explicação oral da lógica do código estruturado.',
    },
    linkMaterial: 'https://python.org',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'rot-fin-05',
    segmento: 'ANOS FINAIS',
    modulo: 'Arduino / Maker',
    titulo: 'Robô Seguidor de Linha e Circuitos Eletrônicos com Arduino',
    subtitulo: 'Eletrônica aplicada, sensores infravermelhos, ponte H e controle de motores DC',
    anoSugerido: '8º e 9º Ano',
    categoria: 'Arduino / Maker',
    duracao: '4 Encontros (8 horas/aula)',
    nivel: 'Avançado',
    bncc: ['EF08CI06', 'EF09CI01', 'EF09MA06'],
    objetivos: [
      'Compreender montagem em protoboard, sinais analógicos e digitais e controle PWM.',
      'Controlar direção e velocidade de motores elétricos com driver ponte H.',
      'Programar microcontrolador Arduino na IDE em C/C++ para seguir trajetos com precisão.',
    ],
    materiais: [
      'Placa compatível com Arduino Uno ou Nano com cabo USB',
      'Chassi robótico de 2 rodas com motores DC com caixa de redução',
      'Módulo de sensores de linha infravermelhos (TCRT5000)',
      'Driver ponte H (L298N) e protoboard com cabos jumpers',
      'Pista com traçado de fita isolante preta',
    ],
    etapas: {
      aquecimento: 'Apresentação de AGVs (Veículos Guiados Automaticamente) em logística moderna e conceitos de corrente elétrica.',
      desenvolvimento: 'Montagem do circuito de alimentação e calibração dos limiares de leitura nos pinos digitais.',
      maoNaMassa: 'Construção do chassi, soldagem/conexão dos cabos e carregamento do código base de malha de controle.',
      desafio: 'Ajustar as constantes de velocidade para vencer uma curva fechada e parada de segurança ao fim da pista.',
      avaliacao: 'Bateria de testes cronometrados na pista e análise de falhas de alinhamento com a turma.',
    },
    linkMaterial: 'https://arduino.cc',
    autor: 'Equipe Pedagógica CETEC',
    createdAt: '2026-03-15T10:00:00Z',
  },
];
