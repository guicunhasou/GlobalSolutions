document.addEventListener('DOMContentLoaded', () => {
  const mapaContainer = document.querySelector('.mapa-container');
  const mapaConteudo = document.querySelector('.mapa-conteudo');
  const mapaImagens = document.querySelectorAll('.mapa-imagem');
  const mais = document.querySelector('.mais');
  const opcoes = document.querySelectorAll('.mais .opcoes li');
  const nomeDesastre = document.querySelector('.nome-desastre'); // Adicionado

  const busca = document.querySelector('.busca');
  const inputBusca = busca.querySelector('input');
  const cidadesBusca = busca.querySelector('.cidades');
  const itensBusca = cidadesBusca.querySelectorAll('li');

  let isDragging = false;
  let hasMoved = false;
  let startX, startY;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let clickX = 0;
  let clickY = 0;

  const minScale = 0.5;
  const maxScale = 2;

  function getMapaAtual() {
    for (const img of mapaImagens) {
      if (img.style.display !== 'none') return img;
    }
    return mapaImagens[0];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getBounds() {
    const mapaImagem = getMapaAtual();
    const contentWidth = mapaImagem.naturalWidth * scale;
    const contentHeight = mapaImagem.naturalHeight * scale;
    const containerWidth = mapaContainer.offsetWidth;
    const containerHeight = mapaContainer.offsetHeight;

    const minX = containerWidth - contentWidth;
    const minY = containerHeight - contentHeight;
    const maxX = 0;
    const maxY = 0;

    return { minX, maxX, minY, maxY };
  }

  function updateConteudoTransform() {
    const bounds = getBounds();
    offsetX = clamp(offsetX, bounds.minX, bounds.maxX);
    offsetY = clamp(offsetY, bounds.minY, bounds.maxY);
    mapaConteudo.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
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

    if (Math.abs(dx - offsetX) > 3 || Math.abs(dy - offsetY) > 3) {
      hasMoved = true;
    }

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

  mapaContainer.addEventListener('click', (event) => {
    if (hasMoved || mais.contains(event.target)) return;

    const rect = mapaContainer.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    clickX = (mouseX - offsetX) / scale;
    clickY = (mouseY - offsetY) / scale;

    mais.style.left = `${mouseX}px`;
    mais.style.top = `${mouseY}px`;
    mais.style.display = 'block';
    mais.classList.remove('expandido');
  });

  mais.addEventListener('click', (event) => {
    event.stopPropagation();
    mais.classList.add('expandido');
    distribuirEmCirculo();
  });

  document.addEventListener('click', (event) => {
    if (!mais.contains(event.target)) {
      mais.classList.remove('expandido');
    }
    if (!busca.contains(event.target)) {
      busca.classList.remove('active');
    }
  });

  opcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
      const marcador = document.createElement('img');
      marcador.classList.add('marcador');
      marcador.alt = opcao.getAttribute('data-label');
      marcador.title = opcao.getAttribute('data-label');
      const iconeSrc = opcao.querySelector('img').getAttribute('src');
      marcador.setAttribute('src', iconeSrc);
      marcador.style.left = `${clickX}px`;
      marcador.style.top = `${clickY}px`;
      marcador.style.position = 'absolute';
      marcador.style.transform = 'translate(-50%, -50%)';
      mapaConteudo.appendChild(marcador);
      mais.classList.remove('expandido');
      mais.style.display = 'none';
    });
  });

  mapaImagens.forEach(img => {
    img.onload = () => {
      if (img.style.display !== 'none') {
        scale = 1;
        const containerWidth = mapaContainer.offsetWidth;
        const containerHeight = mapaContainer.offsetHeight;
        const imageWidth = img.naturalWidth * scale;
        const imageHeight = img.naturalHeight * scale;

        offsetX = (containerWidth - imageWidth) / 2;
        offsetY = (containerHeight - imageHeight) / 2;

        updateConteudoTransform();
      }
    };
  });

  inputBusca.addEventListener('focus', () => {
    busca.classList.add('active');
  });

  itensBusca.forEach(item => {
    item.addEventListener('click', () => {
      inputBusca.value = item.textContent;
      busca.classList.remove('active');
      const mapaId = item.getAttribute('data-mapa');

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
          mapaMostrar.onload = () => {
            resetMapPosition(mapaMostrar);
          };
        }
      }
    });
  });

  function resetMapPosition(mapaElement) {
    scale = 1;
    const containerWidth = mapaContainer.offsetWidth;
    const containerHeight = mapaContainer.offsetHeight;
    const imageWidth = mapaElement.naturalWidth * scale;
    const imageHeight = mapaElement.naturalHeight * scale;

    offsetX = (containerWidth - imageWidth) / 2;
    offsetY = (containerHeight - imageHeight) / 2;
    updateConteudoTransform();
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
    novoAviso.innerHTML = `
      <span>${aviso.msg}</span>
      <button class="fechar">&times;</button>
    `;

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
    setInterval(() => {
      mostrarAviso();
    }, Math.random() * 3000 + 3000);
  }

  iniciarAvisos();

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
      const nome = li.getAttribute('data-label');
      nomeDesastre.textContent = nome.toUpperCase();
      mais.classList.add('mostrar-nome');
    });

    li.addEventListener('mouseleave', () => {
      nomeDesastre.textContent = '';
      mais.classList.remove('mostrar-nome');
    });
  });
});