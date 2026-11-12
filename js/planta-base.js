/* Central 1926 — o que a planta (planta.html) e as páginas dos espaços (espaco.html)
 * têm em comum: nomes dos andares, endereços das páginas, o desenho de um andar e a
 * lista de espaços por andar.
 *
 * Precisa de js/planta-dados.js (gerado) e js/espacos.js (conteúdo), carregados antes.
 */
window.PlantaBase = (() => {
  'use strict';

  const D = window.PLANTA_DADOS;
  const CENTRAL = window.CENTRAL || {};
  const NS = 'http://www.w3.org/2000/svg';

  const PISOS = ['rooftop', 'primeiro', 'terreo'];                // de cima para baixo, como o prédio
  const NOME_PISO = { rooftop: 'Rooftop', primeiro: '1º andar', terreo: 'Térreo' };
  const FOLHA_PISO = { rooftop: 'Planta do rooftop', primeiro: 'Planta do 1º andar', terreo: 'Planta do térreo' };
  const ESPACOS = D.espacos;

  function el(tag, attrs, pai) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (pai) pai.appendChild(e);
    return e;
  }

  function html(tag, classe, texto, pai) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    if (pai) pai.appendChild(e);
    return e;
  }

  const pts = (lista) => lista.map((p) => p.join(',')).join(' ');

  // espaços de cada andar, do maior para o menor ("15 a 20 m²" conta como 15; sem área, por último)
  const metros = (area) => (area ? parseFloat(area) : -1);
  const espacosDo = {};
  for (const piso of PISOS) {
    espacosDo[piso] = Object.keys(D.pisos[piso].espacos)
      .sort((a, b) => metros(ESPACOS[b].area) - metros(ESPACOS[a].area));
  }

  // ------------------------------------------------------------ endereços

  const paginaDo = (id) => `espaco.html?e=${encodeURIComponent(id)}`;       // a página do espaço
  const plantaDo = (id) => `planta.html#${id}`;                             // a planta, com o espaço aceso
  const plantaDoAndar = (piso) => `planta.html?andar=${piso}`;              // a planta, naquele andar

  // WhatsApp de locação; a mensagem já sai dizendo de qual espaço se trata
  function linkWhats(id) {
    const info = id ? ESPACOS[id] : null;
    let msg = 'Olá! Quero saber sobre a locação da Central 1926.';
    if (info) {
      const andar = NOME_PISO[info.piso];
      msg += ` Espaço: ${info.nome}${info.nome === andar ? '' : ` (${andar.toLowerCase()})`}.`;
    }
    return `https://wa.me/${CENTRAL.whats}?text=${encodeURIComponent(msg)}`;
  }

  // ------------------------------------------------- o desenho de um andar

  // Tudo em traço fino. Paredes em duas passadas, para os encontros ficarem limpos:
  // primeiro o contorno de todas, depois o miolo de todas por cima, que apaga os
  // traços que sobrariam onde uma parede encosta na outra.
  function desenharPiso(g, def) {
    const gDes = el('g', { class: 'desenho' }, g);
    const paredes = def.formas.filter((f) => f.c === 'parede');
    paredes.forEach((f) => el('polygon', { points: pts(f.p), class: 'parede', pathLength: 1 }, gDes));
    paredes.forEach((f) => el('polygon', { points: pts(f.p), class: 'miolo' }, gDes));
    for (const f of def.formas) {
      if (f.c === 'parede' || f.t !== 'l') continue;
      const attrs = { points: pts(f.p), class: f.c };
      // para o traço se desenhar na abertura (as linhas tracejadas só aparecem: já têm o próprio traço)
      if (f.c !== 'tracejado') attrs.pathLength = 1;
      el(f.f ? 'polygon' : 'polyline', attrs, gDes);
    }
    return gDes;
  }

  // A estrela de raios da marca, para pôr logo depois de um título: oito raios finos.
  // O CSS (.estrela-titulo, em css/planta.css) dá o tamanho das letras e a anima ao abrir.
  function estrelaTitulo() {
    const svg = el('svg', { class: 'estrela-titulo', viewBox: '-25 -25 50 50', 'aria-hidden': 'true' });
    const g = el('g', {}, svg);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      el('line', {
        pathLength: 1,
        x1: (Math.cos(a) * 8).toFixed(2), y1: (Math.sin(a) * 8).toFixed(2),
        x2: (Math.cos(a) * 24).toFixed(2), y2: (Math.sin(a) * 24).toFixed(2),
      }, g);
    }
    return svg;
  }

  // --u: quantas unidades do desenho cabem em 1 px da tela. O CSS usa isso para o traço
  // ter sempre a mesma espessura, com a planta grande ou pequena. O desenho se ajusta
  // dentro da caixa do SVG (pela largura ou pela altura, a que apertar primeiro).
  function medirTraco(svg, larguraDoDesenho, alturaDoDesenho) {
    const caixa = svg.getBoundingClientRect();
    if (!caixa.width || !caixa.height) return;
    const escala = Math.min(caixa.width / larguraDoDesenho, caixa.height / alturaDoDesenho);
    svg.style.setProperty('--u', (1 / escala).toFixed(3));
  }

  // ------------------------------------------- lista de espaços, andar por andar

  // Uma pilha de três andares, como o prédio. Cada espaço é um link para a página dele.
  //   atual            id do espaço da página aberta (fica marcado)
  //   aoEscolherAndar  na planta, o título de cada andar é um botão que troca o andar;
  //                    fora dela, é um link para a planta naquele andar
  function montarIndice(nav, { atual = null, aoEscolherAndar = null } = {}) {
    const grupos = {};
    const titulos = {};
    const linhas = {};
    for (const piso of PISOS) {
      const ids = espacosDo[piso];
      const sec = html('section', 'grupo', null, nav);
      const h = html('h2', 'grupo-titulo', null, sec);
      let t;
      if (aoEscolherAndar) {
        t = html('button', 'grupo-andar', null, h);
        t.type = 'button';
        t.addEventListener('click', () => aoEscolherAndar(piso));
      } else {
        t = html('a', 'grupo-andar', null, h);
        t.href = plantaDoAndar(piso);
      }
      html('span', '', NOME_PISO[piso], t);
      html('span', 'grupo-conta', ids.length === 1 ? '1 espaço' : `${ids.length} espaços`, t);

      const ul = html('ul', 'linhas', null, sec);
      for (const id of ids) {
        const a = html('a', 'linha', null, html('li', '', null, ul));
        a.href = paginaDo(id);
        html('span', 'linha-nome', ESPACOS[id].nome, a);
        if (ESPACOS[id].area) html('span', 'linha-area', ESPACOS[id].area, a);
        if (id === atual) {
          a.classList.add('escolhida');
          a.setAttribute('aria-current', 'page');
        }
        linhas[id] = a;
      }
      grupos[piso] = sec;
      titulos[piso] = t;
    }
    return { grupos, titulos, linhas };
  }

  return {
    D, CENTRAL, PISOS, NOME_PISO, FOLHA_PISO, ESPACOS, espacosDo,
    el, html, pts,
    paginaDo, plantaDo, plantaDoAndar, linkWhats,
    desenharPiso, medirTraco, montarIndice, estrelaTitulo,
  };
})();
