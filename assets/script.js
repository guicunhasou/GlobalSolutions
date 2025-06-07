document.addEventListener('DOMContentLoaded', () => {
  const mapaContainer = document.querySelector('.mapa-container');
  const mapaConteudo = document.querySelector('.mapa-conteudo');
  const mapaImagens = document.querySelectorAll('.mapa-imagem');
  const mais = document.querySelector('.mais');
  const opcoes = document.querySelectorAll('.mais .opcoes li');
  const nomeDesastre = document.querySelector('.nome-desastre');

  const busca = document.querySelector('.busca');
  const inputBusca = busca.querySelector('input');
  const cidadesBusca = busca.querySelector('.cidades');
  const itensBusca = cidadesBusca.querySelectorAll('li');

  let isDragging = false;
  let hasMoved = false;
  let startX = 0, startY = 0;
  let offsetX = 0, offsetY = 0;
  let scale = 1;
  let clickX = 0, clickY = 0;
  const minScale = 0.5, maxScale = 2;

  let mapaAtualId = 'mapa-sp';
  const marcadoresPorMapa = { 'mapa-sp': [] };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getMapaAtual() {
    return document.querySelector(`.${mapaAtualId}`);
  }

  function getBounds() {
    const mapaImagem = getMapaAtual();
    const contentWidth = mapaImagem.naturalWidth * scale;
    const contentHeight = mapaImagem.naturalHeight * scale;
    const containerWidth = mapaContainer.offsetWidth;
    const containerHeight = mapaContainer.offsetHeight;

    return {
      minX: containerWidth - contentWidth,
      minY: containerHeight - contentHeight,
      maxX: 0,
      maxY: 0
    };
  }

  function updateConteudoTransform() {
    const bounds = getBounds();
    offsetX = clamp(offsetX, bounds.minX, bounds.maxX);
    offsetY = clamp(offsetY, bounds.minY, bounds.maxY);
    mapaConteudo.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  function resetMapPosition(mapaElement) {
    scale = 1;
    const containerWidth = mapaContainer.offsetWidth;
    const containerHeight = mapaContainer.offsetHeight;
    const imageWidth = mapaElement.naturalWidth;
    const imageHeight = mapaElement.naturalHeight;

    offsetX = (containerWidth - imageWidth) / 2;
    offsetY = (containerHeight - imageHeight) / 2;
    updateConteudoTransform();
  }

  mapaContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasMoved = false;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx - offsetX) > 3 || Math.abs(dy - offsetY) > 3) hasMoved = true;

    offsetX = dx;
    offsetY = dy;
    updateConteudoTransform();
  });

  mapaContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = mapaContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const scaleAmount = 1 + zoomFactor * direction;
    const prevScale = scale;

    scale *= scaleAmount;
    scale = clamp(scale, minScale, maxScale);

    const xRel = (mouseX - offsetX) / prevScale;
    const yRel = (mouseY - offsetY) / prevScale;

    offsetX = mouseX - xRel * scale;
    offsetY = mouseY - yRel * scale;

    updateConteudoTransform();
  }, { passive: false });

  mapaContainer.addEventListener('click', (e) => {
    if (hasMoved || mais.contains(e.target)) return;

    const rect = mapaContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    clickX = (mouseX - offsetX) / scale;
    clickY = (mouseY - offsetY) / scale;

    mais.style.left = `${mouseX}px`;
    mais.style.top = `${mouseY}px`;
    mais.style.display = 'block';
    mais.classList.remove('expandido');
  });

  mais.addEventListener('click', (e) => {
    e.stopPropagation();
    mais.classList.add('expandido');
    distribuirEmCirculo();
  });

  document.addEventListener('click', (e) => {
    if (!mais.contains(e.target)) mais.classList.remove('expandido');
    if (!busca.contains(e.target)) busca.classList.remove('active');
  });

  opcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
      const marcador = document.createElement('img');
      marcador.classList.add('marcador');
      marcador.alt = marcador.title = opcao.getAttribute('data-label');
      marcador.src = opcao.querySelector('img').src;
      marcador.style.left = `${clickX}px`;
      marcador.style.top = `${clickY}px`;
      marcador.style.position = 'absolute';
      marcador.style.transform = 'translate(-50%, -50%)';
      marcador.style.zIndex = 5;
      marcador.style.pointerEvents = 'auto';
      marcador.style.cursor = 'pointer';

      marcador.addEventListener('click', (e) => {
        e.stopPropagation();
        marcador.remove();
        const lista = marcadoresPorMapa[mapaAtualId];
        const index = lista.indexOf(marcador);
        if (index !== -1) lista.splice(index, 1);
      });

      if (!marcadoresPorMapa[mapaAtualId]) marcadoresPorMapa[mapaAtualId] = [];
      marcadoresPorMapa[mapaAtualId].push(marcador);
      mapaConteudo.appendChild(marcador);

      mais.classList.remove('expandido');
      mais.style.display = 'none';
    });
  });

  inputBusca.addEventListener('focus', () => {
    busca.classList.add('active');
  });

  itensBusca.forEach(item => {
    item.addEventListener('click', () => {
      inputBusca.value = item.textContent;
      busca.classList.remove('active');
      const mapaId = item.getAttribute('data-mapa');
      mapaAtualId = mapaId;

      mapaImagens.forEach(img => {
        img.style.display = 'none';
        img.classList.add('d-none');
      });

      const mapaMostrar = document.querySelector(`.${mapaId}`);
      if (mapaMostrar) {
        mapaMostrar.style.display = 'block';
        mapaMostrar.classList.remove('d-none');

        if (mapaMostrar.complete) {
          resetMapPosition(mapaMostrar);
        } else {
          mapaMostrar.onload = () => resetMapPosition(mapaMostrar);
        }

        document.querySelectorAll('.marcador').forEach(el => el.remove());
        const marcadores = marcadoresPorMapa[mapaId] || [];
        marcadores.forEach(marcador => mapaConteudo.appendChild(marcador));
      }
    });
  });

  function distribuirEmCirculo() {
    const itens = document.querySelectorAll('.opcoes li');
    const raio = 40;
    const total = itens.length;

    itens.forEach((item, i) => {
      const angulo = (2 * Math.PI * i) / total;
      const x = 50 + raio * Math.cos(angulo);
      const y = 50 + raio * Math.sin(angulo);
      item.style.left = `${x}%`;
      item.style.top = `${y}%`;
    });
  }

  document.querySelectorAll('.opcoes li').forEach(li => {
    li.addEventListener('mouseenter', () => {
      nomeDesastre.textContent = li.getAttribute('data-label').toUpperCase();
      mais.classList.add('mostrar-nome');
    });
    li.addEventListener('mouseleave', () => {
      nomeDesastre.textContent = '';
      mais.classList.remove('mostrar-nome');
    });
  });

  // Centraliza o mapa inicial (SP)
  const mapaInicial = document.querySelector('.mapa-sp');
  if (mapaInicial.complete) {
    resetMapPosition(mapaInicial);
  } else {
    mapaInicial.onload = () => resetMapPosition(mapaInicial);
  }
  const textosAviso = [
    { msg: "⚠️ Chuva forte chegando em sua região.", tipo: "warning" },
    { msg: "🌬️ Atenção: rajadas de vento acima de 60km/h.", tipo: "danger" },
    { msg: "🔥 Tempo seco aumenta risco de incêndios.", tipo: "danger" },
    { msg: "🏚️ Novo abrigo aberto no bairro Esperança.", tipo: "info" },
    { msg: "🌪️ Possibilidade de ciclone à noite.", tipo: "warning" },
    { msg: "🏥 Atendimento médico emergencial disponível no centro.", tipo: "success" },
    { msg: "🌊 Alerta de enchente em áreas próximas a rios.", tipo: "danger" },
    { msg: "❄️ Frio intenso previsto: cuidados com a população vulnerável.", tipo: "info" },
    { msg: "🧭 Saiba quais abrigos têm perto de você.", tipo: "primary" },
    { msg: "🚨 Evite transitar em áreas de risco.", tipo: "danger" },
    { msg: "📱 Mantenha seu celular carregado para emergências.", tipo: "info" },
    { msg: "🧯 Kit de emergência: verifique se o seu está completo.", tipo: "info" },
    { msg: "🛰️ Monitoramento indica risco de deslizamento.", tipo: "warning" },
    { msg: "🛑 Alerta de tsunami em regiões costeiras.", tipo: "danger" },
    { msg: "🚧 Rotas de fuga atualizadas, veja no mapa.", tipo: "primary" },
    { msg: "🏫 Abrigo aberto na Escola Municipal Monte Azul.", tipo: "success" },
    { msg: "🌀 Formação de granizo detectada na zona oeste.", tipo: "warning" },
    { msg: "🌡️ Calor extremo: evite exposição ao sol.", tipo: "danger" },
    { msg: "📻 Sintonize a rádio local para instruções ao vivo.", tipo: "info" },
    { msg: "📍 Veja os pontos seguros mais próximos no mapa.", tipo: "primary" },
    { msg: "💧 Distribuição de água potável no abrigo da Vila Nova.", tipo: "success" },
    { msg: "📦 Ajuda humanitária chegando ao bairro Novo Horizonte.", tipo: "success" }
  ];

  function mostrarAviso() {
    const caixa = document.getElementById('avisosBox');
    const aviso = textosAviso[Math.floor(Math.random() * textosAviso.length)];
    const novoAviso = document.createElement('div');
    novoAviso.className = `aviso aviso-${aviso.tipo}`;
    novoAviso.innerHTML = `<span>${aviso.msg}</span><button class="fechar">&times;</button>`;

    novoAviso.querySelector('.fechar').addEventListener('click', () => {
      novoAviso.classList.add('hide');
      setTimeout(() => novoAviso.remove(), 500);
    });

    caixa.appendChild(novoAviso);
    setTimeout(() => {
      novoAviso.classList.add('hide');
      setTimeout(() => novoAviso.remove(), 500);
    }, 6000);
  }

  function iniciarAvisos() {
    mostrarAviso();
    setInterval(() => mostrarAviso(), Math.random() * 3000 + 3000);
  }

  iniciarAvisos();
});
