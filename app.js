(() => {
  'use strict';
  const { photos, parseChallenges, createBag, nextRotation } = window.EduGame;
  const $ = id => document.getElementById(id);
  const spin = $('spin');
  const pass = $('pass');
  const status = $('status');
  const wheel = $('wheel');
  const image = $('edu-photo');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const drawPhoto = createBag(photos);
  let drawChallenge;
  let rotation = 0;
  let phase = 'home';
  let spinVersion = 0;
  let centerClicks = 0;
  let galleryBuilt = false;

  function photoCaption(photo) {
    return photo.file.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
  }

  function showScreen(name, focusId) {
    for (const screen of ['home', 'roulette', 'result', 'gallery']) {
      $(`${screen}-screen`).hidden = screen !== name;
    }
    phase = name;
    $('home').hidden = name === 'home';
    window.scrollTo({ top: 0, behavior: 'instant' });
    $(focusId).focus({ preventScroll: true });
  }

  function openRoulette() {
    $('gallery-open').disabled = false;
    spin.disabled = !drawChallenge;
    spin.textContent = drawChallenge ? 'Girar' : 'Faltan las pruebas';
    showScreen('roulette', drawChallenge ? 'spin' : 'wheel-center');
  }

  $('start').addEventListener('click', () => {
    if (phase === 'home') openRoulette();
  });
  $('home').addEventListener('click', () => {
    // Invalidate any pending reveal so it cannot interrupt the home screen.
    spinVersion++;
    if (drawChallenge) status.textContent = '';
    showScreen('home', 'home-heading');
  });
  $('wheel-center').addEventListener('click', () => {
    if (phase !== 'roulette' && phase !== 'spinning') return;
    centerClicks = Math.min(centerClicks + 1, 10);
    if (centerClicks === 10) $('gallery-open').hidden = false;
  });
  $('gallery-open').addEventListener('click', () => {
    if (centerClicks < 10 || phase !== 'roulette') return;
    if (!galleryBuilt) {
      photos.forEach(photo => {
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        const caption = document.createElement('figcaption');
        img.src = `img/${photo.file}`;
        img.alt = photo.name;
        img.loading = 'lazy';
        caption.className = 'photo-caption';
        caption.textContent = photoCaption(photo);
        const joke = document.createElement('p');
        joke.className = 'gallery-joke';
        joke.textContent = photo.title;
        figure.append(img, caption, joke);
        $('gallery').append(figure);
      });
      galleryBuilt = true;
    }
    showScreen('gallery', 'gallery-heading');
  });
  $('gallery-back').addEventListener('click', () => {
    if (phase === 'gallery') openRoulette();
  });

  photos.forEach((photo, index) => {
    const label = document.createElement('span');
    label.className = 'wheel-number';
    label.textContent = String(index + 1).padStart(2, '0');
    label.style.transform = `rotate(${(index + 0.5) * 360 / photos.length - 180}deg)`;
    $('wheel-labels').append(label);
  });

  async function loadChallenges() {
    $('retry').hidden = true;
    status.classList.add('sr-only');
    status.textContent = 'Cargando las pruebas…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('pruebas.txt', { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('No se pudo leer pruebas.txt');
      const challenges = parseChallenges(await response.text());
      if (!challenges.length) throw new Error('No hay pruebas');
      drawChallenge = createBag(challenges);
      spin.disabled = false;
      spin.textContent = 'Girar';
      status.textContent = '';
    } catch (error) {
      spin.disabled = true;
      spin.textContent = 'Faltan las pruebas';
      status.classList.remove('sr-only');
      status.textContent = location.protocol === 'file:'
        ? 'Abre el juego desde un servidor web, no con doble clic. Tienes los pasos en README.md.'
        : 'No se han podido cargar las pruebas. Comprueba la conexión y vuelve a intentarlo.';
      $('retry').hidden = false;
    } finally {
      clearTimeout(timeout);
    }
  }

  image.addEventListener('error', () => {
    image.hidden = true;
    $('photo-error').hidden = false;
  });
  image.addEventListener('load', () => {
    image.hidden = false;
    $('photo-error').hidden = true;
  });

  spin.addEventListener('click', () => {
    if (phase !== 'roulette' || !drawChallenge) return;
    phase = 'spinning';
    const version = ++spinVersion;
    $('gallery-open').disabled = true;
    spin.disabled = true;
    spin.textContent = 'Girando…';
    status.textContent = 'Girando…';
    const photo = drawPhoto();
    const challenge = drawChallenge();
    rotation = nextRotation(rotation, photos.indexOf(photo), photos.length);
    wheel.style.transform = `rotate(${rotation}deg)`;
    const preload = new Image();
    preload.src = `img/${photo.file}`;
    window.setTimeout(() => {
      if (version !== spinVersion) return;
      image.hidden = false;
      $('photo-error').hidden = true;
      image.alt = photo.name;
      image.src = `img/${photo.file}`;
      $('photo-caption').textContent = photoCaption(photo);
      $('result-heading').textContent = photo.title;
      $('challenge-text').textContent = challenge;
      status.textContent = '';
      showScreen('result', 'result-heading');
    }, reducedMotion.matches ? 80 : 4300);
  });

  pass.addEventListener('click', () => {
    if (phase !== 'result') return;
    openRoulette();
  });
  $('retry').addEventListener('click', loadChallenges);
  loadChallenges();
})();
