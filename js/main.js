
// Marca el link activo según la URL
(function(){
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here) a.classList.add('active');
  });
})();
// Menú responsive
const btn = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');
if(btn){
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });
}
// Home: buscador que redirige a Artistas (estático)
function goToSearch(e){
  e.preventDefault();
  const q = (document.getElementById('q')?.value || '').trim();
  if(q){
    location.href = 'artistas.html#q=' + encodeURIComponent(q);
  }else{
    location.href = 'artistas.html';
  }
  return false;
}
window.goToSearch = goToSearch;
// Contacto: fake submit (porque aún no hay backend)
function fakeSubmit(e){
  e.preventDefault();
  alert('¡Gracias! Tu mensaje ha sido enviado. Nos pondremos en contacto contigo enseguida');
  return false;
}
window.fakeSubmit = fakeSubmit;
// === Buscador del header (oculta nav y muestra input) ===
(function(){
  const header = document.querySelector('.site-header');
  const root   = header?.querySelector('.header-search[data-hs]');
  if (!root) return;
  const toggle = root.querySelector('.hs-toggle');
  const form   = root.querySelector('.hs-form');
  const input  = root.querySelector('.hs-input');
  const open = () => {
    header.classList.add('is-search-open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Cerrar buscador');
    setTimeout(()=> input && input.focus(), 80);
  };
  const close = () => {
    header.classList.remove('is-search-open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Abrir buscador');
  };
  const isOpen = () => header.classList.contains('is-search-open');
  // click en la lupa
  toggle.addEventListener('click', ()=> isOpen() ? close() : open());
  // click en cualquier lugar que NO sea el toggle ni el form => cerrar
document.addEventListener('click', (e)=>{
  if (!isOpen()) return;
  const t = e.target;
  if (!form.contains(t) && !toggle.contains(t)) {
    close();
  }
});
  // Esc cierra, Ctrl/⌘+K abre
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && isOpen()) close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      isOpen() ? input.focus() : open();
    }
  });
  // bloquear submit vacío
  form.addEventListener('submit', (e)=>{
    const q = (input.value || '').trim();
    if (!q){ e.preventDefault(); input.focus(); }
  });
})();
// === Ocultar header al scrollear, mostrar sólo al volver arriba ===
(function(){
  const header = document.querySelector('.site-header');
  const menu   = document.getElementById('menu'); // por si está abierto en mobile
  if (!header) return;
  const THRESHOLD = 12; // px desde arriba para considerar que ya scrolleó
  let ticking = false;
  function shouldHoldOpen(){
    // No ocultar si está el buscador abierto o el menú mobile desplegado
    return header.classList.contains('is-search-open') ||
           (menu && menu.classList.contains('open'));
  }
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > THRESHOLD && !shouldHoldOpen()){
        header.classList.add('header-hidden');
      } else {
        header.classList.remove('header-hidden');
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estado correcto al cargar
})();
/* ===== Carrusel home-2 (1 visible, infinito con animación) ===== */
(function(){
  const car = document.querySelector('[data-carousel]');
  if (!car) return;

  const viewport = car.querySelector('.car-viewport');
  const track    = car.querySelector('.car-track');
  let   items    = Array.from(track.children); // <li class="car-item">…

  const prevBtn  = car.querySelector('.car-arrow.prev');
  const nextBtn  = car.querySelector('.car-arrow.next');
  const TRANSITION = 'transform .35s ease';

  // 1) Clonar extremos para poder “wrapear” con animación
  const firstClone = items[0].cloneNode(true);
  const lastClone  = items[items.length - 1].cloneNode(true);
  firstClone.dataset.clone = 'first';
  lastClone.dataset.clone  = 'last';
  track.appendChild(firstClone);
  track.insertBefore(lastClone, items[0]);
  items = Array.from(track.children); // ahora incluye clones

  // Arrancamos en el primer slide REAL (índice 1)
  let index = 1;

  // Ancho de un paso = ancho del viewport (1 slide por vista)
  const stride = () => viewport.getBoundingClientRect().width;

  const setTransition = (on) => { track.style.transition = on ? TRANSITION : 'none'; };

  // Mover a índice (con o sin animación)
  const moveTo = (i, withAnim = true) => {
    index = i;
    setTransition(withAnim);
    track.style.transform = `translateX(${-index * stride()}px)`;
  };

  // Si caemos en un clon, saltamos al real SIN animación (no se ve el “salto”)
  const snapIfClone = () => {
    const el = items[index];
    if (!el) return;
    if (el.dataset.clone === 'first') {      // pasaste del último real al clon del 1°
      moveTo(1, false);                      // → volver al 1° real
    } else if (el.dataset.clone === 'last') { // pasaste del 1° real al clon del último
      moveTo(items.length - 2, false);       // → volver al último real
    }
  };

  // Carrusel automático
  let autoTimeout;
  let isUserInteracting = false;
  const AUTO_DELAY = 4000; // 4 segundos exactos
  
  const scheduleNext = () => {
    // Solo programar si no hay interacción del usuario
    if (!isUserInteracting) {
      stopAutoCarousel();
      autoTimeout = setTimeout(() => {
        if (!isUserInteracting) {
          moveTo(index + 1, true);
        }
      }, AUTO_DELAY);
    }
  };
  
  const stopAutoCarousel = () => {
    if (autoTimeout) {
      clearTimeout(autoTimeout);
      autoTimeout = null;
    }
  };
  
  const resetAutoCarousel = () => {
    stopAutoCarousel();
    isUserInteracting = false;
    scheduleNext();
  };

  // Controles
  prevBtn.addEventListener('click', () => {
    isUserInteracting = true;
    moveTo(index - 1, true);
    stopAutoCarousel();
  });
  nextBtn.addEventListener('click', () => {
    isUserInteracting = true;
    moveTo(index + 1, true);
    stopAutoCarousel();
  });
  
  track.addEventListener('transitionend', () => {
    snapIfClone();
    // Programar la siguiente imagen SOLO después de que termine la transición
    // y si no hay interacción del usuario
    if (!isUserInteracting) {
      scheduleNext();
    }
  });

  // Al redimensionar, recolocar sin animación
  window.addEventListener('resize', () => {
    moveTo(index, false);
    // Resetear el timer después de redimensionar
    resetAutoCarousel();
  });

  // Pausar cuando el usuario está sobre el carrusel
  car.addEventListener('mouseenter', () => {
    isUserInteracting = true;
    stopAutoCarousel();
  });
  car.addEventListener('mouseleave', () => {
    isUserInteracting = false;
    scheduleNext();
  });

  // Limpiar al salir de la página
  window.addEventListener('beforeunload', stopAutoCarousel);

  // Init
  moveTo(index, false);
  // Iniciar carrusel automático después de la inicialización
  scheduleNext();
})();
/* ===== Galería de imágenes modal ===== */
(function(){
  const modal = document.getElementById('image-gallery-modal');
  const galleryImage = document.getElementById('gallery-image');
  const galleryEpigraph = document.getElementById('gallery-epigraph');
  const galleryCaption = document.getElementById('gallery-caption');
  const galleryDate = document.getElementById('gallery-date');
  const galleryModalContent = document.querySelector('.gallery-modal-content');
  const closeBtn = document.querySelector('.gallery-close');
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');
  
  if (!modal) return;
  
  // Array de imágenes en orden cronológico
  const images = [
    { 
      src: '../img/1917 Ballet parade .jpg', 
      alt: '1917 Ballet parade', 
      year: '1917',
      epigraph: 'Apollinaire emplea por primera vez la palabra "surrealista". Lo hizo para describir el ballet "Parade" de Jean Cocteau y el texto "Les Mamelles" de Tirésias de su propia autoría.'
    },
    { 
      src: '../img/Grupo surrealista reunido 1.jpg', 
      alt: 'Grupo surrealista reunido 1', 
      year: '1919',
      epigraph: 'El surrealismo empieza a gestarse en torno al grupo de André Breton, Louis Aragon y Philippe Soupault en París, luego de la fundación de su revista "Littérature", transicionando del Dadaísmo hacia una nueva vanguardia.'
    },
    { 
      src: '../img/1924 Révolution Surréaliste.jpg', 
      alt: '1924 Révolution Surréaliste', 
      year: '1924',
      epigraph: 'Publicación del "Primer Manifiesto Surrealista" por André Breton en París y de la Revista "La Révolution Surréaliste".'
    },
    { 
      src: '../img/1925 Exposition Surréaliste.jpg', 
      alt: '1925 Exposition Surréaliste', 
      year: '1925',
      epigraph: 'Primera "Exposición Surrealista" en la Galerie Pierre, París, en la que participa el fotógrafo Man Ray.'
    },
    { src: '../img/1929 Un chien andalou.webp', alt: '1929', year: '1929', epigraph: 'André Breton publica el "Segundo Manifiesto Surrealista", Salvador Dalí y Luis Buñuel publican el film "Un chien andalou' },
    { src: '../img/1930 Le surréalisme au service de la révolution.jpg', alt: '1930', year: '1930', epigraph: 'Se estrena la revista "Le Surréalisme au service de la révolution", edición que duró hasta 1933, con fuerte tono político, debido a la adhesión de André Breton y otros artistas al Partido Comunista Francés. ' },
    { src: '../img/1932 Julien Levy gallery.jpg', alt: '1932', year: '1932', epigraph: 'Exposición “Surrealism: Paintings, Drawings and Photographs", en Nueva York, en la Julien Levy Galley: El Surrealismo empieza a expandirse internacionalmente. ' },
    { src: '../img/1936 Traje de buzo.avif', alt: '1936', year: '1936', epigraph: 'Exposición Internacional Surrealista en Londres. Salvador Dalí hizo una performance en esta exposición, presentándose en un traje de buzo mientras pronunciaba un discurso y, curiosamente, casi se asfixia. ' },

    { src: '../img/1938 Exposition Internationale du Surréalisme.jpg', alt: '1938', year: '1938', epigraph: 'Exposición Internacional del Surrealismo en la Galería Beaux-Arts de París, dirigida por Georges Wildenstein, organizada por Breton.' },
    { src: '../img/1939 - 1941 Segunda guerra mundial.webp', alt: '1939-1941', year: '1939-1941', epigraph: 'Inicio de la Segunda Guerra Mundial: varios surrealistas emigran a Estados Unidos, donde influyen en el arte moderno neoyorquino.' },
    { src: '../img/1947 Le surréalisme en 1947.jpg', alt: '1947', year: '1947', epigraph: 'Exposición "Le Surréalisme en 1947” en París, en la Galería Maeght organizada por Breton y Duchamp, en un intento de reafirmar y reorientar el movimiento surrealista en el contexto de la posguerra. ' },
    { src: '../img/1966 André Breton.jpg', alt: '1966', year: '1966', epigraph: 'Muere André Breton en París, considerado el cierre oficial del movimiento como grupo organizado.' }
  ];
  
  let currentIndex = 0;
  
  // Actualizar imagen y epígrafe
  function updateImage() {
    galleryImage.src = images[currentIndex].src;
    galleryImage.alt = images[currentIndex].alt;
    galleryEpigraph.textContent = images[currentIndex].epigraph;
    galleryDate.textContent = images[currentIndex].year;
    
    // Aplicar clase específica para 1919
    if (images[currentIndex].year === '1919') {
      galleryCaption.classList.add('year-1919');
    } else {
      galleryCaption.classList.remove('year-1919');
    }
    
    // Aplicar clase específica para 1924
    if (images[currentIndex].year === '1924') {
      galleryModalContent.classList.add('year-1924');
      galleryCaption.classList.add('year-1924');
    } else {
      galleryModalContent.classList.remove('year-1924');
      galleryCaption.classList.remove('year-1924');
    }
    
    // Aplicar clase específica para 1925
    if (images[currentIndex].year === '1925') {
      galleryCaption.classList.add('year-1925');
    } else {
      galleryCaption.classList.remove('year-1925');
    }
    
    // Aplicar clases específicas para epígrafes que necesitan estar más cerca
    if (images[currentIndex].year === '1929') {
      galleryCaption.classList.add('year-1929');
    } else {
      galleryCaption.classList.remove('year-1929');
    }
    
    if (images[currentIndex].year === '1932') {
      galleryCaption.classList.add('year-1932');
    } else {
      galleryCaption.classList.remove('year-1932');
    }
    
    if (images[currentIndex].year === '1938') {
      galleryCaption.classList.add('year-1938');
    } else {
      galleryCaption.classList.remove('year-1938');
    }
    
    if (images[currentIndex].year === '1939-1941') {
      galleryCaption.classList.add('year-1939-1941');
    } else {
      galleryCaption.classList.remove('year-1939-1941');
    }
    
    if (images[currentIndex].year === '1966') {
      galleryCaption.classList.add('year-1966');
    } else {
      galleryCaption.classList.remove('year-1966');
    }
    
    // Aplicar clases específicas para epígrafes que necesitan estar más abajo
    if (images[currentIndex].year === '1930') {
      galleryCaption.classList.add('year-1930');
    } else {
      galleryCaption.classList.remove('year-1930');
    }
    
    if (images[currentIndex].year === '1936') {
      galleryCaption.classList.add('year-1936');
    } else {
      galleryCaption.classList.remove('year-1936');
    }
  }
  
  // Abrir modal
  function openModal(index) {
    currentIndex = index;
    updateImage();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  // Cerrar modal
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Navegar a imagen anterior
  function prevImage() {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    updateImage();
  }
  
  // Navegar a imagen siguiente
  function nextImage() {
    currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    updateImage();
  }
  
  // Event listeners
  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', prevImage);
  nextBtn.addEventListener('click', nextImage);
  
  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
  
  // Cerrar al hacer clic fuera de la imagen
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    }
  });
  
  // Hacer clickeables todos los placeholders
  document.querySelectorAll('.tg-image-placeholder').forEach((placeholder, index) => {
    placeholder.style.cursor = 'pointer';
    placeholder.addEventListener('click', () => openModal(index));
  });
  
  // Hacer clickeable la imagen de 1917
  const image1917 = document.querySelector('.tg-image-placeholder img');
  if (image1917) {
    image1917.style.cursor = 'pointer';
    image1917.addEventListener('click', () => openModal(0));
  }
})();
