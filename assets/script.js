document.addEventListener('DOMContentLoaded', () => {
    const mapaContainer = document.querySelector('.mapa-container');
    const mapaConteudo = document.querySelector('.mapa-conteudo');
    const mapaImagens = document.querySelectorAll('.mapa-imagem'); 
    const mais = document.querySelector('.mais');
    const opcoes = document.querySelectorAll('.mais .opcoes li'); 
  
  
    const busca = document.querySelector('.busca');
    const inputBusca = busca.querySelector('input');
    const opcoesBusca = busca.querySelector('.opcoes');
    const itensBusca = opcoesBusca.querySelectorAll('li');
  
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
  
    // Drag
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
    });
  

    document.addEventListener('click', (event) => {
      if (!mais.contains(event.target)) {
        mais.classList.remove('expandido');
      }
    });
  
   
    opcoes.forEach(opcao => {
      opcao.addEventListener('click', () => {
        const marcador = document.createElement('div');
        marcador.classList.add('marcador');
        marcador.title = opcao.textContent;
  
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
        });
        
       
        const mapaMostrar = document.querySelector(`.${mapaId}`);
        if (mapaMostrar) {
          mapaMostrar.style.display = 'block';
  
         
          scale = 1;
          const containerWidth = mapaContainer.offsetWidth;
          const containerHeight = mapaContainer.offsetHeight;
          const imageWidth = mapaMostrar.naturalWidth * scale;
          const imageHeight = mapaMostrar.naturalHeight * scale;
  
          offsetX = (containerWidth - imageWidth) / 2;
          offsetY = (containerHeight - imageHeight) / 2;
          updateConteudoTransform();
        }
      });
    });
  
   
    document.addEventListener('click', (e) => {
      if (!busca.contains(e.target)) {
        busca.classList.remove('active');
      }
    });
  });
  