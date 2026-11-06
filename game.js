/* Shared, dependency-free game logic. Also importable by the Node tests. */
(function (root) {
  'use strict';
  const photos = [
    ['Edu_motero_a_3_metros_sobre_el_cielo.jpeg', 'Edu motero', 'A tres metros sobre el suelo. A dos del ibuprofeno.'],
    ['Edu_bacala.jpeg', 'Edu bacala', '32 años y todavía en plena edad del pavo.'],
    ['Edu_teeneager_seductor.jpeg', 'Edu teenager seductor', 'Teenager de espíritu. De rodillas, no tanto.'],
    ['Edu_pezon_caliente.jpeg', 'Edu pezón caliente', 'La calefacción central del grupo.'],
    ['Edu_sapo.jpeg', 'Edu sapo', 'Bésalo y se convierte en un señor de 32.'],
    ['Edu_trol_cavernas.jpeg', 'Edu trol de las cavernas', 'Sale de la cueva porque hay cumpleaños.'],
    ['Edu_yonki.jpeg', 'Edu yonki', 'Enganchado a la fiesta. Y al cargador al 2 %.'],
    ['Edu_traje.jpeg', 'Edu de traje', 'El CEO de «hoy me recojo pronto».'],
    ['Edu_enano_irlandes.jpeg', 'Edu enano irlandés', 'Al final del arcoíris había un Edu.'],
    ['Edu_pito_antiagresion.jpeg', 'Edu con pito antiagresión', 'El único que trae banda sonora de emergencia.'],
    ['Edu_profanado.jpeg', 'Edu profanado', 'La dignidad salió del chat. Edu se quedó.'],
    ['Edu_ligon_mazao.jpeg', 'Edu ligón mazao', 'Mucho bíceps. Cero cobertura para las indirectas.'],
    ['Edu_canallita.jpeg', 'Edu canallita', 'La cara oficial de «la última y nos vamos».'],
    ['Edu_Ozil.jpeg', 'Edu Özil', 'Visión de juego: localizar la tarta sin mirar.'],
    ['Edu_tinder.jpeg', 'Edu Tinder', '32 años. Un match. Demasiadas anécdotas.']
  ].map(([file, name, title]) => ({ file, name, title }));

  function parseChallenges(text) {
    return [...new Set(text.split(/\r?\n/).map(line => line.trim()).filter(Boolean))];
  }

  // Every item is drawn once per cycle; avoid an immediate repeat at the boundary.
  function createBag(items, random = Math.random) {
    if (!items.length) throw new Error('La bolsa no puede estar vacía');
    let remaining = [];
    let last;
    return function draw() {
      if (!remaining.length) {
        remaining = items.slice();
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        if (remaining.length > 1 && remaining[remaining.length - 1] === last) {
          [remaining[0], remaining[remaining.length - 1]] = [remaining[remaining.length - 1], remaining[0]];
        }
      }
      last = remaining.pop();
      return last;
    };
  }

  function nextRotation(current, index, count) {
    const target = (360 - (index + 0.5) * 360 / count) % 360;
    return current + 1800 + (target - current % 360 + 360) % 360;
  }

  const api = { photos, parseChallenges, createBag, nextRotation };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
