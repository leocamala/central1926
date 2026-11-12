/* Central 1926 — página de um espaço (espaco.html?e=venue).
 *
 * Uma página só serve a todos os espaços: o endereço diz qual é, e este arquivo
 * preenche o título, as fotos, as informações e a planta de localização.
 *
 *   nome, andar, área, linha de descrição   js/planta-dados.js (gerado)
 *   fotos, textos, dados e listas           js/espacos.js (editado à mão)
 */
(() => {
  'use strict';

  const B = window.PlantaBase;
  const { D, CENTRAL, NOME_PISO, ESPACOS, el, html, pts } = B;
  const GALERIA = 10;                                  // fotos que cabem na galeria, além da principal

  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('e');
  const info = ESPACOS[id];

  // a lista de todos os espaços fica no pé de qualquer página, com o atual marcado
  const { grupos, titulos } = B.montarIndice($('indice'), { atual: info ? id : null });

  if (!info) {
    document.body.classList.add('sem-espaco');
    document.title = 'Espaço não encontrado — Central 1926';
    $('e-nome').textContent = 'Espaço não encontrado';
    $('e-nota').textContent = 'Este endereço não corresponde a nenhum espaço da casa. Escolha um na lista abaixo ou volte à planta.';
    return;
  }

  const cont = (CENTRAL.espacos && CENTRAL.espacos[id]) || {};
  const andar = NOME_PISO[info.piso];

  grupos[info.piso].classList.add('ativo');
  titulos[info.piso].classList.add('atual');

  // ---------------------------------------------------------- título e textos

  document.title = `${info.nome} — Central 1926`;

  // O nome, com a estrela de raios da marca logo depois, do tamanho das letras; ela se
  // desenha girando quando a página abre (a mesma do título da planta). A última palavra
  // e a estrela andam juntas: se o nome quebrar de linha, a estrela nunca fica sozinha.
  const palavras = info.nome.split(' ');
  const ultima = palavras.pop();
  $('e-nome').textContent = palavras.length ? palavras.join(' ') + ' ' : '';
  const fimDoNome = html('span', 'fim-do-nome', ultima, $('e-nome'));
  // (se a estrela faltar por algum motivo, a página segue sem ela, em vez de parar aqui)
  if (typeof B.estrelaTitulo === 'function') fimDoNome.appendChild(B.estrelaTitulo());

  $('voltar').href = B.plantaDo(id);
  $('consultar').href = B.linkWhats(id);

  // na primeira tela, só a linha de descrição (os textos longos vão para "Sobre o espaço")
  $('e-nota').textContent = info.nota || '';
  if (!info.nota) {
    document.querySelector('.resumo').hidden = true;
    document.querySelector('.grade').classList.add('sem-resumo');
  }

  // Em tela larga o nome ocupa a largura da coluna, numa linha só. Para isso o CSS precisa
  // saber a largura do nome em "em" (--larg), já contando a estrela: VENUE é curto e sai
  // grande, HALL CLUB é comprido e sai menor. Mede de novo quando a letra carrega.
  const nome = $('e-nome');
  function medirNome() {
    const tela = document.createElement('canvas').getContext('2d');
    tela.font = '400 100px Anton';
    const texto = info.nome.toUpperCase();
    const letras = tela.measureText(texto).width / 100 + 0.005 * texto.length;   // + entreletra
    const estrela = 0.2 + tela.measureText('H').actualBoundingBoxAscent / 100;    // respiro + 1cap
    nome.style.setProperty('--larg', (letras + estrela + 0.03).toFixed(3));        // + uma folga
  }
  medirNome();
  if (document.fonts && document.fonts.load) document.fonts.load('400 100px Anton').then(medirNome);

  // ------------------------------------------------------------------ fotos

  // A primeira foto do arquivo de conteúdo é a principal: uma só, grande, ao lado dos dados.
  // As seguintes (até 10) vão para a galeria, abaixo do botão de consulta.
  // Onde ainda não há foto fica o quadro vazio (um X, como em planta) — a não ser que
  // CENTRAL.quadrosVazios seja false, que é como o site deve ir ao ar.
  const fotos = cont.fotos || [];
  const mostrarVazios = CENTRAL.quadrosVazios !== false;

  function preencher(quadro, caminho, descricao, legenda, primeira) {
    if (caminho) {
      const img = html('img', '', null, quadro);
      img.src = caminho;
      img.alt = descricao;
      img.loading = primeira ? 'eager' : 'lazy';
      img.decoding = 'async';
      return;
    }
    quadro.classList.add('vazia');
    const x = el('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, quadro);
    el('line', { x1: 0, y1: 0, x2: 100, y2: 100 }, x);
    el('line', { x1: 100, y1: 0, x2: 0, y2: 100 }, x);
    html('figcaption', '', legenda, quadro);
  }

  // A foto principal pode ser uma foto 360°, que se arrasta para olhar em volta. Ela fica
  // hospedada no Kuula e entra aqui pelo player deles: o código é o final do endereço da
  // publicação (kuula.co/post/CÓDIGO). Cada espaço pode ter o seu (campo foto360 do espaço);
  // quem não tem usa o da casa (CENTRAL.foto360). Para um espaço sem 360, foto360: ''.
  const codigo360 = cont.foto360 !== undefined ? cont.foto360 : CENTRAL.foto360;
  const principal = $('e-principal');
  let primeiraDaGaleria = 1;                           // fotos[0] é a principal; a galeria começa em fotos[1]

  if (codigo360) {
    principal.classList.add('giro360');
    if (CENTRAL.ocultarMarcaKuula) principal.classList.add('sem-marca');
    const quadro = html('iframe', '', null, principal);
    // Opções do player: sem a dica em inglês (inst=0; a legenda em português fica por nossa
    // conta), sem miniaturas, com tela cheia, e a roda do mouse rola a página (zoom=0).
    // logo=0 e info=0 pedem para esconder o logo e o botão INFO, mas o Kuula só atende
    // isso quando a conta dona da foto é paga.
    quadro.src = `https://kuula.co/share/${encodeURIComponent(codigo360)}?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=0&zoom=0&inst=0`;
    quadro.title = `Foto 360° do espaço ${info.nome}: arraste para olhar em volta`;
    quadro.allow = 'xr-spatial-tracking; gyroscope; accelerometer; fullscreen';
    quadro.allowFullscreen = true;
    html('figcaption', '', 'Foto 360°: arraste para olhar em volta', principal);
    primeiraDaGaleria = 0;                             // com 360 na principal, todas as fotos vão para a galeria
  } else if (fotos[0] || mostrarVazios) {
    preencher(principal, fotos[0], info.nome, 'Foto principal', true);
  } else {
    principal.hidden = true;
  }

  const galeria = $('e-fotos');
  for (let n = 1; n <= GALERIA; n++) {
    const caminho = fotos[primeiraDaGaleria + n - 1];
    if (!caminho && !mostrarVazios) continue;
    preencher(html('figure', 'foto', null, galeria), caminho, `${info.nome}, foto ${n}`, `Foto ${n}`, false);
  }
  if (!galeria.children.length) galeria.hidden = true;

  // ------------------------------------------------------------ informações

  const dados = $('e-dados');
  function linha(rotulo, valor) {
    const div = html('div', '', null, dados);
    html('dt', '', rotulo, div);
    const dd = html('dd', '', valor || 'a informar', div);
    if (!valor) dd.classList.add('falta');
  }
  // Na primeira tela ficam sempre as mesmas linhas — andar, área e capacidade —, para ela
  // ter a mesma altura em todos os espaços. Os outros dados vão para "Sobre o espaço".
  const naPrimeiraTela = (rotulo) => rotulo === 'Capacidade';
  linha('Andar', andar);
  if (info.area) linha('Área', info.area);
  const outrosDados = [];
  for (const [rotulo, valor] of cont.dados || []) {
    if (naPrimeiraTela(rotulo)) linha(rotulo, valor); else outrosDados.push([rotulo, valor]);
  }

  // Embaixo: "Sobre o espaço" (textos longos e dados a mais), as listas do espaço e, por
  // último, o que a casa oferece em qualquer evento.
  const blocoDeLista = (titulo) => {
    const bloco = html('section', 'lista', null, $('e-listas'));
    html('h2', '', titulo, bloco);
    return bloco;
  };
  if ((cont.texto || []).length || outrosDados.length) {
    const sobre = blocoDeLista('Sobre o espaço');
    sobre.classList.add('sobre');
    for (const paragrafo of cont.texto || []) html('p', '', paragrafo, sobre);
    if (outrosDados.length) {
      const ul = html('ul', '', null, sobre);
      for (const [rotulo, valor] of outrosDados) {
        const li = html('li', '', null, ul);
        html('span', 'rotulo', rotulo, li);
        html('span', '', valor || 'a informar', li);
      }
    }
  }
  const listas = [...(cont.listas || [])];
  if (CENTRAL.estrutura && CENTRAL.estrutura.length) listas.push({ titulo: 'Em toda a casa', itens: CENTRAL.estrutura });
  for (const lista of listas) {
    const ul = html('ul', '', null, blocoDeLista(lista.titulo));
    for (const item of lista.itens) html('li', '', item, ul);
  }

  // ---------------------------------------------- planta de localização

  // A planta pequena serve de mapa: o espaço desta página fica aceso, e clicar em qualquer
  // outro abre a página dele. Os botões em cima trocam o andar mostrado; a legenda embaixo
  // diz o espaço sob o mouse e, parada, leva à planta grande.
  const [VX, VY, VW, VH] = D.viewBox;
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = el('svg', { viewBox: D.viewBox.join(' '), class: 'planta', role: 'group' });
  const camadas = {};                                  // piso -> <g>

  const PISOS = ['rooftop', 'primeiro', 'terreo'];
  for (const piso of PISOS) {
    const def = D.pisos[piso];
    const g = el('g', { class: 'piso', 'data-piso': piso }, svg);
    el('rect', { x: VX, y: VY, width: VW, height: VH, class: 'fundo' }, g);

    // os outros espaços: cada um é um link para a página dele (por baixo do desenho)
    const gAreas = el('g', { class: 'areas' }, g);
    for (const [outro, e] of Object.entries(def.espacos)) {
      if (outro === id) continue;
      const nomeOutro = ESPACOS[outro].nome;
      const a = el('a', { href: B.paginaDo(outro), class: 'espaco', 'aria-label': `Abrir ${nomeOutro}` }, gAreas);
      e.partes.forEach((p) => el('polygon', { points: pts(p), class: 'area' }, a));
      const mostrar = () => legendaEspaco(outro);
      a.addEventListener('pointerenter', mostrar);
      a.addEventListener('focus', mostrar);
      a.addEventListener('pointerleave', legendaParada);
      a.addEventListener('blur', legendaParada);
    }

    B.desenharPiso(g, def);

    // o espaço desta página, aceso
    if (def.espacos[id]) {
      const realce = el('g', { class: 'realce ligado' }, el('g', { class: 'realces' }, g));
      def.espacos[id].partes.forEach((p) => el('polygon', { points: pts(p) }, realce));
    }
    camadas[piso] = g;
  }
  $('e-planta').appendChild(svg);

  const medir = () => B.medirTraco(svg, VW, VH);
  new ResizeObserver(medir).observe(svg);

  // legenda: parada, leva à planta grande (com este espaço aceso, se for o andar dele);
  // com o mouse sobre um espaço, mostra o nome e a área dele
  const legenda = $('e-legenda');
  const pisoDaPrep = { rooftop: 'do rooftop', primeiro: 'do 1º andar', terreo: 'do térreo' };
  let pisoMostrado = info.piso;

  function legendaParada() {
    legenda.classList.remove('sobre');
    legenda.textContent = `Ver na planta ${pisoDaPrep[pisoMostrado]}`;
    legenda.href = pisoMostrado === info.piso ? B.plantaDo(id) : B.plantaDoAndar(pisoMostrado);
  }

  function legendaEspaco(outro) {
    const o = ESPACOS[outro];
    legenda.classList.add('sobre');
    legenda.replaceChildren();
    html('strong', '', o.nome, legenda);
    if (o.area) html('span', '', o.area, legenda);
  }

  // trocar o andar mostrado na planta pequena (sem sair da página)
  const botoes = [...document.querySelectorAll('#e-chave .chave-andar')];
  let fimDaMontagem = null;
  function mostrarAndar(piso, { animar = true } = {}) {
    pisoMostrado = piso;
    for (const p of PISOS) camadas[p].classList.toggle('ativo', p === piso);
    botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.piso === piso)));
    svg.setAttribute('aria-label', `Planta ${pisoDaPrep[piso]}: clique num espaço para abrir a página dele`);
    legendaParada();
    medir();
    // o traço do andar se desenha, como na planta grande
    if (animar && !reduzMovimento) {
      clearTimeout(fimDaMontagem);
      svg.classList.remove('desenhando');
      void svg.getBoundingClientRect();
      svg.classList.add('desenhando');
      fimDaMontagem = setTimeout(() => svg.classList.remove('desenhando'), 1900);
    }
  }
  botoes.forEach((b) => b.addEventListener('click', () => mostrarAndar(b.dataset.piso)));

  mostrarAndar(info.piso, { animar: false });
})();
