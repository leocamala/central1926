/* Central 1926 — conteúdo das páginas dos espaços. Este arquivo é editado à mão.
 *
 * O nome, o andar, a área e a linha de descrição de cada espaço vêm de
 * js/planta-dados.js (gerado). Aqui fica o resto de cada página:
 *
 *   fotos   caminhos das fotos, na ordem em que aparecem. A primeira é a foto principal
 *           (grande, ao lado dos dados); as seguintes, até 10, vão para a galeria.
 *           Onde ainda não há foto, a página mostra o quadro vazio.
 *           Ex.: fotos: ['img/espacos/venue/1.jpg', 'img/espacos/venue/2.jpg']
 *   texto   parágrafos sobre o espaço.
 *   dados   linhas a mais na tabela de informações: ['Rótulo', 'valor'].
 *           Valor vazio ('') aparece como "a informar".
 *   listas  blocos de lista: { titulo: '...', itens: ['...', '...'] }.
 *
 * Tudo o que está escrito aqui saiu das apresentações da casa
 * (APRESENTACOES/LEIA-ME.md). Onde a casa não diz nada, fica vazio.
 */
window.CENTRAL = {
  // WhatsApp de locação (o do site atual). Este é o único lugar onde o número aparece.
  whats: '5511976442255',

  // Foto 360° que aparece como foto principal (a grande) na página de cada espaço.
  // É o código de uma publicação do Kuula: o final do endereço kuula.co/post/h5Hpv.
  // POR ENQUANTO É UM TESTE: todos os espaços usam esta mesma foto, que não é da casa
  // (é um render de outro projeto, "Casa Velasco", publicado no Kuula por terceiros).
  // Quando cada espaço tiver a sua, pôr  foto360: 'código'  dentro do espaço, lá embaixo;
  // um espaço sem 360 fica com  foto360: ''  e volta a usar a primeira foto da lista.
  foto360: 'h5Hpv',

  // true: corta a faixa de cima do player do Kuula, onde ficam o logo deles e o botão INFO
  // (que traz os créditos da foto). Vale só para o teste no computador: o Kuula só deixa
  // esconder isso em conta paga, e a foto de teste é de outro projeto, com autor. Por isso
  // o _fontes/empacotar.py, que monta a versão para publicar, sempre troca para false.
  ocultarMarcaKuula: false,

  // true: os quadros de foto ainda sem foto aparecem vazios (bom enquanto o site é montado).
  // false: só aparecem as fotos que existem. Trocar para false antes de pôr o site no ar.
  quadrosVazios: true,

  // o que a casa põe à disposição de qualquer evento
  estrutura: [
    'Wi-fi dedicado de banda larga',
    'Som imersivo Dolby Atmos',
    'Copa e cozinha',
    'Elevador e 2 escadas',
    'Ar-condicionado',
    'Rider de mobiliário',
    'Área técnica',
    'Camarim com banheiro',
    'Gerador (stand-by)',
    'No-break',
    '110 e 220 V',
    'Estacionamento',
  ],

  espacos: {
    // ------------------------------------------------------------ térreo
    'venue': {
      fotos: [],          // foto preparada, ainda fora do site: img/espacos/venue.jpg
      texto: [],
      dados: [['Capacidade', '']],
      listas: [],
    },
    'estudio': {
      fotos: [],          // foto preparada: img/espacos/estudio.jpg
      texto: [
        'Estúdio de gravação com projeto acústico do escritório catalão Acousthink. Quatro trabalhos gravados aqui ganharam o Latin Grammy.',
      ],
      dados: [
        ['Salas', '4, conectadas'],
        ['Projeto acústico', 'Acousthink'],
      ],
      listas: [
        {
          titulo: 'Serviços',
          itens: ['Produção musical', 'Gravação', 'Mixagem e masterização', 'Lives e podcast', 'Photoshooting e videoclipe'],
        },
        {
          titulo: 'Equipamento',
          itens: [
            '6 caixas Mackie Thump 15',
            '2 sistemas TurboSound iP3000',
            'Mesa digital Mackie DL32R',
            'Microfones sem fio Shure',
            'Monitor principal ATC SCM200 ASL, com par de subwoofers ATC de 18"',
            'Bateria Pearl Master Series',
            'Amplificador de baixo Gallien-Krueger GK800',
            'Amplificadores de guitarra Marshall JCM800, Mesa Boogie Triple Rectifier e par de Fender DeVille',
            'Gerador de 260 kVA',
            'Internet dedicada de 300 mega',
          ],
        },
        {
          titulo: 'Latin Grammy',
          itens: [
            'A Mulher do Fim do Mundo, Elza Soares (2016)',
            'Dancê, Tulipa Ruiz (2015)',
            'AmarElo, Emicida (2020)',
            'Veia Nordestina, Mariana Aydar (2020)',
          ],
        },
      ],
    },
    'patio': {
      fotos: [],          // foto preparada: img/espacos/patio.jpg
      texto: [],
      dados: [['Capacidade', '']],
      listas: [],
    },
    'hall-terreo': {
      fotos: [],          // foto preparada: img/espacos/hall-terreo.jpg
      texto: [],
      dados: [],
      listas: [],
    },
    'cozinha': {
      fotos: [],
      texto: ['Cozinha industrial.'],
      dados: [],
      listas: [],
    },

    // ---------------------------------------------------------- 1º andar
    'club': {
      fotos: [],          // foto preparada: img/espacos/club.jpg
      texto: [],
      dados: [['Capacidade', '']],
      listas: [],
    },
    'hall-club': {
      fotos: [],          // foto preparada: img/espacos/hall-club.jpg
      texto: [],
      dados: [['Capacidade', '']],
      listas: [],
    },
    // as seis salas: uma foto preparada para todas, img/espacos/salas.jpg
    'sala-1': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },
    'sala-2': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },
    'sala-3': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },
    'sala-4': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },
    'sala-5': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },
    'sala-6': { fotos: [], texto: [], dados: [['Capacidade', '']], listas: [] },

    // ------------------------------------------------------------ rooftop
    'rooftop': {
      fotos: [],          // foto preparada: img/espacos/rooftop.jpg
      texto: [],
      dados: [['Capacidade', '']],
      listas: [],
    },
  },
};
