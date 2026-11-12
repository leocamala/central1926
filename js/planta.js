/* Central 1926 — planta interativa, andar por andar (planta.html).
 *
 * Desenha a planta, monta a lista de espaços e o painel, e cuida dos cliques.
 * Escolher um espaço, na planta ou na lista, abre a página dele (espaco.html).
 *
 * A geometria e os dados de cada espaço vêm de js/planta-dados.js, gerado por
 * _fontes/gerar_planta.py a partir das plantas originais do prédio. O que é comum
 * com as páginas dos espaços está em js/planta-base.js.
 */
(() => {
  'use strict';

  const B = window.PlantaBase;
  const { D, PISOS, NOME_PISO, FOLHA_PISO, ESPACOS, espacosDo, el, pts } = B;
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const telaEstreita = window.matchMedia('(max-width: 599px)');   // celular: planta em pé
  const [VX, VY, VW, VH] = D.viewBox;

  // raios finos: a estrela da marca, no espaço escolhido
  function raios(cx, cy, r, n, r0) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      d += `M${(cx + Math.cos(a) * r0).toFixed(1)} ${(cy + Math.sin(a) * r0).toFixed(1)}`
        + `L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    }
    return d;
  }

  // ------------------------------------------------------- montar a planta

  const papel = document.getElementById('desenho');
  const svg = el('svg', { viewBox: D.viewBox.join(' '), class: 'planta', role: 'img' });
  // tudo o que é desenho fica dentro de `giro`: no celular ele vira 90° e a planta fica em pé
  const giro = el('g', { class: 'giro' }, svg);

  const gruposEspaco = {};   // id -> <g> clicável
  const realces = {};        // id -> <g> que acende
  const rotulos = {};        // id -> <g> com nome e área
  const defEspaco = {};      // id -> { partes, rotulo, estrela }
  const dicas = {};          // id -> <title>, a dica que aparece com o mouse parado

  for (const piso of PISOS) {
    const def = D.pisos[piso];
    const g = el('g', { class: 'piso', 'data-piso': piso }, giro);
    // fundo dentro de cada andar: o realce (que inverte as cores) precisa dele por baixo
    // também durante a animação de troca de andar
    el('rect', { x: VX, y: VY, width: VW, height: VH, class: 'fundo' }, g);

    // 1. áreas clicáveis (invisíveis), por baixo do desenho.
    //    Não entram na ordem do teclado: a lista ao lado tem um link para cada espaço.
    const gAreas = el('g', { class: 'areas' }, g);
    for (const [id, e] of Object.entries(def.espacos)) {
      const grupo = el('g', { class: 'espaco', 'data-id': id }, gAreas);
      dicas[id] = el('title', {}, grupo);
      e.partes.forEach((p) => el('polygon', { points: pts(p), class: 'area' }, grupo));
      gruposEspaco[id] = grupo;
      defEspaco[id] = e;
    }

    // 2. o desenho
    B.desenharPiso(g, def);

    // 3. realce: inverte o espaço escolhido (fundo claro, traço escuro)
    const gReal = el('g', { class: 'realces' }, g);
    for (const [id, e] of Object.entries(def.espacos)) {
      const r = el('g', { class: 'realce', 'data-id': id }, gReal);
      e.partes.forEach((p) => el('polygon', { points: pts(p) }, r));
      realces[id] = r;
    }

    // 4. nomes (só aparecem ao passar o mouse, focar ou escolher)
    const gRot = el('g', { class: 'rotulos' }, g);
    for (const [id, e] of Object.entries(def.espacos)) {
      const info = ESPACOS[id];
      const [x, y] = e.rotulo;
      const classes = ['rotulo', e.fora ? 'fora' : '', e.pequeno ? 'pequeno' : ''].filter(Boolean).join(' ');
      const r = el('g', { class: classes, 'data-id': id }, gRot);
      el('text', { x, y, class: 'rotulo-nome' }, r).textContent = info.nome;
      if (info.area) el('text', { x, y, dy: '1.35em', class: 'rotulo-area' }, r).textContent = info.area;
      rotulos[id] = r;
    }
  }

  const estrela = el('g', { class: 'estrela' }, giro);
  el('path', { d: raios(0, 0, 24, 8, 8), class: 'raios' }, estrela);

  papel.appendChild(svg);

  // montagem: o traço do andar se desenha, ao abrir a página e a cada troca de andar
  const TEMPO_DO_TRACO = 1650;                                // o traço leva 1,6 s (animação "traca" no CSS)
  let fimDaMontagem = null;
  let tracoProntoEm = 0;                                      // quando o traço do andar atual termina
  function montar() {
    if (reduzMovimento) return;
    clearTimeout(fimDaMontagem);
    svg.classList.remove('desenhando');
    void svg.getBoundingClientRect();                         // reinicia a animação
    svg.classList.add('desenhando');
    tracoProntoEm = performance.now() + TEMPO_DO_TRACO;
    fimDaMontagem = setTimeout(() => svg.classList.remove('desenhando'), 1900);
  }

  // ---------------------------------------------------------------- estado

  // id: o espaço escolhido (aceso). quente: o espaço sob o mouse ou com o foco.
  const estado = { piso: null, id: null, quente: null, retrato: false };

  const botoesAndar = [...document.querySelectorAll('.andar')];
  const andares = document.querySelector('.andares');
  const painel = document.getElementById('painel');
  const pNome = document.getElementById('p-nome');
  const pNota = document.getElementById('p-nota');
  const pDados = document.getElementById('p-dados');
  const consultar = document.getElementById('consultar');
  const ver = document.getElementById('ver');

  // lista de espaços, andar por andar: cada linha é um link para a página do espaço
  const { grupos, titulos, linhas } = B.montarIndice(document.getElementById('indice'), { aoEscolherAndar: mostrarPiso });

  // passar o mouse (ou o foco) num espaço, na planta ou na lista, acende os dois
  // e mostra os dados dele no painel
  function aquecer(id, sim) {
    gruposEspaco[id].classList.toggle('quente', sim);
    rotulos[id].classList.toggle('quente', sim);
    linhas[id].classList.toggle('quente', sim);
    if (sim) estado.quente = id; else if (estado.quente === id) estado.quente = null;
    atualizarPainel();
  }

  // mede quantas unidades do desenho cabem em 1 px: o traço usa isso para ter sempre a mesma espessura
  function medir() {
    B.medirTraco(svg, estado.retrato ? VH : VW, estado.retrato ? VW : VH);
    posicionarRotulos();
    if (estado.id) porEstrela(estado.id);
  }

  // celular: a planta gira 90° para caber inteira na largura; os nomes continuam em pé
  function orientar() {
    estado.retrato = telaEstreita.matches;
    svg.classList.toggle('retrato', estado.retrato);
    svg.setAttribute('viewBox', estado.retrato ? `${-(VY + VH)} ${VX} ${VH} ${VW}` : D.viewBox.join(' '));
    if (estado.retrato) giro.setAttribute('transform', 'rotate(90)'); else giro.removeAttribute('transform');
    medir();
  }

  const tamanho = (e) => (e ? parseFloat(getComputedStyle(e).fontSize) : 0);
  const raioEstrela = (def) => 24 * (def.pequeno ? 0.68 : 1);

  // caixa de cada espaço, em unidades do desenho
  const caixa = {};
  for (const [id, def] of Object.entries(defEspaco)) {
    const xs = def.partes.flat().map((p) => p[0]);
    const ys = def.partes.flat().map((p) => p[1]);
    caixa[id] = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  const desvio = {};         // id -> quanto o nome anda, com a planta em pé
  const semEstrela = {};     // id -> o espaço é baixo demais para a estrela

  // Com a planta deitada, o nome fica onde o gerador pôs. Em pé, os nomes giram de volta
  // e, nos espaços que ficam baixos na tela (salas, cozinha), o conjunto estrela + nome + área
  // é centrado de novo; se nem assim couber, a estrela sai.
  function posicionarRotulos() {
    for (const [id, r] of Object.entries(rotulos)) {
      const def = defEspaco[id];
      const [x, y] = def.rotulo;
      desvio[id] = [0, 0];
      semEstrela[id] = false;
      if (!estado.retrato) { r.removeAttribute('transform'); continue; }

      const c = caixa[id];
      const altura = c.x1 - c.x0;                       // em pé, a altura na tela é o comprimento em x
      if (altura < 300) {
        const n = tamanho(r.querySelector('.rotulo-nome'));
        const a = tamanho(r.querySelector('.rotulo-area'));
        const k = n / (def.pequeno ? 33 : 46);
        const ey = def.estrela ? def.estrela[1] : y - 66;
        const abaixo = a ? 1.55 * a : 0.1 * n;          // do pé do nome até o fim da área
        let acima = ((y - ey) + raioEstrela(def)) * k;  // do pé do nome até o topo da estrela
        if (altura < acima + abaixo + 12) { semEstrela[id] = true; acima = 0.75 * n; }
        desvio[id] = [(c.x0 + c.x1) / 2 + (acima - abaixo) / 2 - x, (c.y0 + c.y1) / 2 - y];
      }
      const [dx, dy] = desvio[id];
      r.setAttribute('transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(-90 ${x} ${y})`);
    }
  }

  // a estrela fica logo acima do nome, na tela: com a planta em pé, "acima" é outro lado do desenho
  function porEstrela(id) {
    const def = defEspaco[id];
    const [rx, ry] = def.rotulo;
    const [ex, ey] = def.estrela || [rx, ry - 66];
    const k = tamanho(rotulos[id].querySelector('.rotulo-nome')) / (def.pequeno ? 33 : 46) || 1;   // acompanha o nome
    const ox = (ex - rx) * k;
    const oy = (ey - ry) * k;
    const [dx, dy] = desvio[id];
    const [x, y] = estado.retrato ? [rx + dx + oy, ry + dy - ox] : [rx + ox, ry + oy];
    estrela.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${((def.pequeno ? 0.68 : 1) * k).toFixed(2)})`);
    estrela.classList.toggle('fora', Boolean(def.fora));
    estrela.classList.toggle('oculta', semEstrela[id]);
  }

  // O painel diz o que se está vendo: o espaço sob o mouse; sem mouse por cima, o espaço
  // escolhido; sem nenhum dos dois, o andar.
  function atualizarPainel() {
    const id = estado.quente || estado.id;
    const info = id ? ESPACOS[id] : null;
    const n = espacosDo[estado.piso].length;
    painel.classList.toggle('tem', Boolean(estado.id));       // há um espaço escolhido: aparece "Ver o espaço"

    pNome.textContent = info ? info.nome : NOME_PISO[estado.piso];
    pNota.textContent = info ? (info.nota || '') : 'Escolha um espaço na planta ou na lista.';

    pDados.replaceChildren();
    const dado = (rotulo, valor) => {
      const div = B.html('div', '', null, pDados);
      B.html('dt', '', rotulo, div);
      B.html('dd', '', valor, div);
    };
    if (info) {
      dado('Andar', NOME_PISO[info.piso]);
      if (info.area) dado('Área', info.area);
    } else {
      dado('Neste andar', n === 1 ? '1 espaço' : `${n} espaços`);
    }

    consultar.href = B.linkWhats(estado.id);
    // "Ver o espaço" só aparece com um espaço escolhido, e leva à página dele
    if (estado.id) ver.href = B.paginaDo(estado.id); else ver.removeAttribute('href');
  }

  function mostrarPiso(piso) {
    if (estado.piso === piso) return;
    const de = estado.piso;
    estado.piso = piso;

    // o andar novo entra vindo de cima (subindo) ou de baixo (descendo)
    if (de) {
      const d = PISOS.indexOf(piso) < PISOS.indexOf(de) ? -34 : 34;
      svg.style.setProperty('--dx', estado.retrato ? `${d}px` : '0px');
      svg.style.setProperty('--dy', estado.retrato ? '0px' : `${d}px`);
    }

    svg.querySelectorAll('.piso').forEach((g) => g.classList.toggle('ativo', g.dataset.piso === piso));
    montar();
    svg.setAttribute('aria-label', FOLHA_PISO[piso]);
    botoesAndar.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.piso === piso)));
    for (const p of PISOS) {
      grupos[p].classList.toggle('ativo', p === piso);
      titulos[p].setAttribute('aria-pressed', String(p === piso));
    }

    if (estado.id && ESPACOS[estado.id].piso !== piso) limpar(); else atualizarPainel();
  }

  // Saída animada: por um instante o elemento fica com a classe "saindo", e o CSS faz
  // a área apagar, o nome subir e sumir, a estrela girar e sumir.
  const fimDaSaida = new Map();
  function sair(elemento) {
    clearTimeout(fimDaSaida.get(elemento));
    elemento.classList.add('saindo');
    fimDaSaida.set(elemento, setTimeout(() => elemento.classList.remove('saindo'), 450));
  }
  function pararSaida(elemento) {
    clearTimeout(fimDaSaida.get(elemento));
    elemento.classList.remove('saindo');
  }

  // Marca o espaço `id` como escolhido na lista e apaga o que estava escolhido antes (id nulo:
  // só apaga). Na planta, quem acende o espaço novo é acenderNaPlanta, logo em seguida ou,
  // se o andar ainda está se desenhando, quando o desenho termina.
  function marcar(id) {
    for (const k of Object.keys(gruposEspaco)) {
      const estava = realces[k].classList.contains('ligado');
      if (k === id) {
        linhas[k].classList.add('escolhida');
        // no espaço escolhido, a dica do mouse avisa que outro clique abre a página
        dicas[k].textContent = 'Clique de novo para abrir a página';
      } else if (estava || linhas[k].classList.contains('escolhida')) {
        realces[k].classList.remove('ligado');
        rotulos[k].classList.remove('ligado');
        linhas[k].classList.remove('escolhida');
        dicas[k].textContent = '';
        // a saída só é animada se o espaço estava aceso e ainda está à vista (mesmo andar)
        if (estava && !reduzMovimento && ESPACOS[k].piso === estado.piso) { sair(realces[k]); sair(rotulos[k]); }
      }
    }
  }

  // acende o espaço na planta: a área inverte, o nome escurece e a estrela entra girando
  let esperaParaAcender = null;
  function acenderNaPlanta(id) {
    if (estado.id !== id) return;                             // nesse meio-tempo, outro foi escolhido
    for (const e of [realces[id], rotulos[id]]) { pararSaida(e); e.classList.add('ligado'); }
    porEstrela(id);
    pararSaida(estrela);
    estrela.classList.remove('visivel');
    void estrela.getBBox();                                   // reinicia a animação
    estrela.classList.add('visivel');
  }

  // se o espaço escolhido não está inteiro à vista (celular), rola até ele
  function trazerParaVista(id, instantaneo) {
    const r = gruposEspaco[id].getBoundingClientRect();
    const topo = estado.retrato ? andares.getBoundingClientRect().height : 0;
    const base = window.innerHeight - (estado.retrato ? painel.getBoundingClientRect().height : 0);
    if (r.top >= topo && r.bottom <= base) return;
    const alvo = window.scrollY + r.top + r.height / 2 - (topo + base) / 2;
    window.scrollTo({ top: Math.max(0, alvo), behavior: reduzMovimento || instantaneo ? 'auto' : 'smooth' });
  }

  // acende um espaço na planta (é o que se vê ao voltar da página dele, ou ao chegar por planta.html#venue)
  function selecionar(id, { instantaneo = false, rolar = true } = {}) {
    const info = ESPACOS[id];
    if (!info) return;
    if (info.piso !== estado.piso) mostrarPiso(info.piso);
    estado.id = id;
    marcar(id);
    atualizarPainel();

    // Se o andar ainda está se desenhando (acabou de trocar de andar, ou a página acabou de
    // abrir), o espaço só acende na planta quando o desenho termina.
    clearTimeout(esperaParaAcender);
    estrela.classList.remove('visivel');
    const espera = tracoProntoEm - performance.now();
    if (espera > 0) esperaParaAcender = setTimeout(() => acenderNaPlanta(id), espera);
    else acenderNaPlanta(id);

    if (rolar) trazerParaVista(id, instantaneo);
    history.replaceState(null, '', '#' + id);
  }

  // desfaz a escolha: a área apaga, o nome e a estrela saem
  function limpar() {
    const antes = estado.id;
    clearTimeout(esperaParaAcender);
    estado.id = null;
    marcar(null);
    estrela.classList.remove('visivel');
    if (antes && !reduzMovimento && ESPACOS[antes].piso === estado.piso) sair(estrela);
    atualizarPainel();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  // Um clique num espaço só o escolhe (acende). Outro clique no mesmo espaço abre a página
  // dele; o botão "Ver o espaço" do painel faz o mesmo. O endereço já está em
  // planta.html#id, então o "voltar" traz a planta com o espaço aceso.
  function abrir(id) {
    location.href = B.paginaDo(id);
  }

  // ---------------------------------------------------------------- eventos

  botoesAndar.forEach((b) => b.addEventListener('click', () => mostrarPiso(b.dataset.piso)));

  Object.entries(gruposEspaco).forEach(([id, g]) => {
    g.addEventListener('click', () => { if (estado.id === id) abrir(id); else selecionar(id); });
    // só o mouse "passa por cima": no toque isso deixaria o espaço aceso sem ninguém pedir
    g.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') aquecer(id, true); });
    g.addEventListener('pointerleave', () => aquecer(id, false));
  });

  Object.entries(linhas).forEach(([id, a]) => {
    // na lista vale a mesma regra: o primeiro clique escolhe; com o espaço já escolhido,
    // o link segue para a página. Ctrl/Shift + clique abre direto em outra aba.
    a.addEventListener('click', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || estado.id === id) return;
      ev.preventDefault();
      selecionar(id);
    });
    a.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') aquecer(id, true); });
    a.addEventListener('pointerleave', () => aquecer(id, false));
    a.addEventListener('focus', () => aquecer(id, true));
    a.addEventListener('blur', () => aquecer(id, false));
  });

  // Com um espaço escolhido, clicar fora desfaz a escolha — em qualquer ponto da página que
  // não seja um espaço da planta, uma linha da lista ou o painel (que tem os botões do espaço).
  document.addEventListener('click', (ev) => {
    if (estado.id && !ev.target.closest('.espaco, .linha, .painel')) limpar();
  });

  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && estado.id) limpar(); });

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (ESPACOS[id] && id !== estado.id) selecionar(id);
  });

  telaEstreita.addEventListener('change', orientar);
  new ResizeObserver(medir).observe(svg);

  // início: abre no espaço do endereço (planta.html#venue), no andar pedido
  // (planta.html?andar=primeiro) ou no térreo
  orientar();
  const inicial = location.hash.slice(1);
  const andarPedido = new URLSearchParams(location.search).get('andar');
  mostrarPiso(ESPACOS[inicial] ? ESPACOS[inicial].piso : (PISOS.includes(andarPedido) ? andarPedido : 'terreo'));
  if (ESPACOS[inicial]) selecionar(inicial, { instantaneo: true });
})();
