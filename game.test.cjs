const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { photos, parseChallenges, createBag, nextRotation } = require('./game.js');

test('all 15 photos exist and have individual captions', () => {
  assert.equal(photos.length, 15);
  assert.equal(new Set(photos.map(p => p.title)).size, 15);
  for (const photo of photos) assert.ok(fs.existsSync(`img/${photo.file}`));
  assert.deepEqual(photos.map(p => p.file).sort(), fs.readdirSync('img').sort());
});

test('original challenges preserved, with at least 60 additions', () => {
  const challenges = parseChallenges(fs.readFileSync('pruebas.txt', 'utf8'));
  assert.ok(challenges.length >= 65);
  assert.equal(challenges[0], 'Di un personaje de marvel y sigue por la derecha, quien se quede en blanco, bebe');
  assert.equal(challenges[4], 'Tararea el opening de unos dibujos animados, si lo adivinan, mandas beber');
  assert.deepEqual(parseChallenges(' uno \r\n\n dos\nuno '), ['uno', 'dos']);
});

test('bags have no repeats in a cycle or across cycle boundaries', () => {
  for (const random of [() => 0, () => 0.999, Math.random]) {
    const draw = createBag([1, 2, 3, 4], random);
    let last;
    for (let cycle = 0; cycle < 100; cycle++) {
      const values = Array.from({ length: 4 }, () => draw());
      assert.notEqual(values[0], last);
      assert.equal(new Set(values).size, 4);
      last = values[3];
    }
  }
  assert.equal(createBag(['only'])(), 'only');
  assert.throws(() => createBag([]));
});

test('wheel pointer lands at the center of the selected photo sector', () => {
  let rotation = 0;
  for (let cycle = 0; cycle < 5; cycle++) {
    for (let index = 0; index < photos.length; index++) {
      const next = nextRotation(rotation, index, photos.length);
      assert.ok(next - rotation >= 1800);
      const sector = Math.floor(((360 - next % 360) % 360) / (360 / photos.length));
      assert.equal(sector, index);
      rotation = next;
    }
  }
});

function setup({ fail = false, protocol = 'http:', reducedMotion = false } = {}) {
  const nodes = new Map();
  const timers = [];
  function node() {
    return { disabled: true, hidden: false, textContent: '', style: {}, attrs: {}, events: {}, children: [],
      classList: { add() {}, remove() {} },
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(k, fn) { this.events[k] = fn; }, append(...children) { this.children.push(...children); },
      focus() { this.focused = true; } };
  }
  const html = fs.readFileSync('index.html', 'utf8');
  for (const match of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)) {
    const element = node();
    element.hidden = /\bhidden\b/.test(match[0]);
    nodes.set(match[1], element);
  }
  const document = { getElementById(id) { assert.ok(nodes.has(id), `Missing HTML element: ${id}`); return nodes.get(id); }, createElement: node };
  const context = { document, location: { protocol }, AbortController, Image: function () {},
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
    fetch: async () => { if (fail) throw new Error('offline'); return { ok: true, text: async () => 'Prueba A\nPrueba B\nPrueba C' }; },
    EduGame: require('./game.js'), matchMedia: () => ({ matches: reducedMotion }), scrollTo() {} };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('app.js', 'utf8'), context);
  return { nodes, timers };
}

test('two exclusive screens, spin lock, pass without spinning and next player', async () => {
  for (const reducedMotion of [false, true]) {
    const { nodes, timers } = setup({ reducedMotion });
    await new Promise(resolve => setImmediate(resolve));
    const get = id => nodes.get(id);
    assert.equal(get('spin').disabled, false);
    assert.equal(get('home-screen').hidden, false);
    assert.equal(get('roulette-screen').hidden, true);
    get('start').events.click();
    assert.equal(get('home-screen').hidden, true);
    assert.equal(get('roulette-screen').hidden, false);
    assert.equal(get('result-screen').hidden, true);
    get('spin').events.click();
    assert.equal(get('spin').disabled, true);
    const count = timers.length;
    get('spin').events.click();
    get('pass').events.click();
    assert.equal(timers.length, count);
    assert.equal(get('result-screen').hidden, true);
    timers.at(-1)();
    assert.equal(get('roulette-screen').hidden, true);
    assert.equal(get('result-screen').hidden, false);
    assert.equal(get('result-heading').focused, true);
    assert.ok(fs.existsSync(get('edu-photo').src));
    assert.equal(get('photo-caption').textContent,
      get('edu-photo').src.slice(4).replace(/\.[^.]+$/, '').replace(/_/g, ' '));
    const challenge = get('challenge-text').textContent;
    const photo = get('edu-photo').src;
    get('spin').events.click();
    assert.equal(timers.length, count);
    get('pass').events.click();
    assert.equal(get('roulette-screen').hidden, false);
    assert.equal(get('result-screen').hidden, true);
    assert.equal(get('spin').disabled, false);
    assert.equal(get('spin').focused, true);
    assert.equal(timers.length, count, 'Passing must not start another spin');
    get('spin').events.click();
    timers.at(-1)();
    assert.equal(get('roulette-screen').hidden, true);
    assert.equal(get('result-screen').hidden, false);
    assert.notEqual(get('edu-photo').src, photo);
    assert.notEqual(get('challenge-text').textContent, challenge);
  }
});

test('missing image shows a fallback and does not prevent passing', async () => {
  const { nodes, timers } = setup();
  await new Promise(resolve => setImmediate(resolve));
  nodes.get('start').events.click();
  nodes.get('spin').events.click();
  timers.at(-1)();
  nodes.get('edu-photo').events.error();
  assert.equal(nodes.get('photo-error').hidden, false);
  assert.equal(nodes.get('edu-photo').hidden, true);
  nodes.get('pass').events.click();
  assert.equal(nodes.get('roulette-screen').hidden, false);
});

test('gallery stays hidden until ten center presses and contains all photos exactly once', async () => {
  const { nodes, timers } = setup();
  await new Promise(resolve => setImmediate(resolve));
  const get = id => nodes.get(id);
  get('start').events.click();
  get('gallery-open').events.click();
  assert.equal(get('gallery-screen').hidden, true);
  for (let i = 0; i < 9; i++) {
    get('wheel-center').events.click();
    assert.equal(get('gallery-open').hidden, true);
  }
  const timerCount = timers.length;
  get('wheel-center').events.click();
  assert.equal(timers.length, timerCount, 'Center presses must not spin');
  assert.equal(get('gallery-open').hidden, false);
  get('gallery-open').events.click();
  assert.equal(get('gallery-screen').hidden, false);
  assert.equal(get('roulette-screen').hidden, true);
  assert.equal(get('gallery').children.length, 15);
  get('gallery').children.forEach((figure, i) => {
    assert.equal(figure.children[0].src, `img/${photos[i].file}`);
    assert.equal(figure.children[0].alt, photos[i].name);
    assert.equal(figure.children[1].textContent, photos[i].file.replace(/\.[^.]+$/, '').replace(/_/g, ' '));
    assert.equal(figure.children[1].className, 'photo-caption');
    assert.equal(figure.children[2].textContent, photos[i].title);
  });
  get('gallery-back').events.click();
  assert.equal(get('roulette-screen').hidden, false);
  assert.equal(get('gallery-screen').hidden, true);
  get('gallery-open').events.click();
  assert.equal(get('gallery').children.length, 15);
  get('home').events.click();
  assert.equal(get('home-screen').hidden, false);
  assert.equal(get('gallery-screen').hidden, true);
  const fresh = setup();
  assert.equal(fresh.nodes.get('gallery-open').hidden, true);
});

test('home navigation cancels pending reveals and supports restarting', async () => {
  const { nodes, timers } = setup();
  await new Promise(resolve => setImmediate(resolve));
  const get = id => nodes.get(id);
  get('start').events.click();
  get('spin').events.click();
  const staleReveal = timers.at(-1);
  get('home').events.click();
  assert.equal(get('home-screen').hidden, false);
  assert.equal(get('home').hidden, true);
  get('start').events.click();
  get('spin').events.click();
  staleReveal();
  assert.equal(get('result-screen').hidden, true);
  timers.at(-1)();
  assert.equal(get('result-screen').hidden, false);
  get('home').events.click();
  assert.equal(get('home-screen').hidden, false);
  assert.equal(get('result-screen').hidden, true);
  assert.equal(get('home-heading').focused, true);
});

test('failed loading offers retry and explains file:// restriction', async () => {
  for (const protocol of ['file:', 'https:']) {
    const { nodes } = setup({ fail: true, protocol });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.get('spin').disabled, true);
    assert.equal(nodes.get('retry').hidden, false);
    assert.match(nodes.get('status').textContent, protocol === 'file:' ? /servidor web/ : /conexión/);
  }
});
