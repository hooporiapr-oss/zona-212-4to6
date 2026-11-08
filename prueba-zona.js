// ══════════════════════════════════════════════════════════════════
//  ZONA 2-1-2 · 4 a 6 años      node prueba-zona.js
//  Plays all three levels with misses on purpose. Checks: a miss
//  never ends anything, no words on the child's screen, nothing is
//  saved, and it opens in Spanish with a Spanish voice.
// ══════════════════════════════════════════════════════════════════
const path = require('path');
const { chromium } = require('playwright');
let malos = 0;
const ok = (c, m) => { if (!c) malos++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const U = f => 'file://' + path.join(__dirname, f);
const TODOS = ['leon', 'delfin', 'rana', 'zorro', 'panda'];

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue()
    : r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await p.addInitScript(() => {
    // a stand-in for the phone's voice, so the test hears what is said and in which voice
    const voces = [{ name: 'Samantha', lang: 'en-US' }, { name: 'Paulina', lang: 'es-MX' }, { name: 'Mónica PR', lang: 'es-PR' }];
    window.__dichos = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => voces, addEventListener() {}, cancel() {},
      speak: u => window.__dichos.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.name })
    } });
  });

  const Z = () => p.evaluate(() => ({ nivel: ZONA.nivel, round: ZONA.round, busy: ZONA.busy,
    want: ZONA.want && ZONA.want.id, chain: (ZONA.chain || []).map(g => g.id), results: ZONA.results }));
  const listo = () => p.waitForFunction(() => !ZONA.busy || document.getElementById('done').style.display === 'flex', null, { timeout: 15000 });
  const terminado = () => p.evaluate(() => document.getElementById('done').style.display === 'flex');
  // a tap on one friend, even while another one is sliding past it
  const guardia = id => p.evaluate(id => document.querySelector(`[data-guard="${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), id);
  const casa = id => p.locator(`[data-casa="${id}"]`).click({ force: true });

  console.log('\n1 · The teacher screen');
  await p.goto(U('index.html')); await p.waitForTimeout(400);
  ok(/Cuida tu casa/.test(await p.locator('#tRules').innerText()), '«Cuida tu casa. Muévete hacia la bola.»');
  ok(await p.locator('#pickLvl button').count() === 3, 'three levels to pick');
  ok(/conos de colores/.test(await p.locator('#tCoach').innerText()), 'the coach note: cones on the court in 2-1-2');
  console.log('\n2 · Level 1 · Encuentra tu casa');
  await p.locator('#pickLvl button[data-lvl="1"]').click();
  await p.locator('#pickVoz button[data-voz="0"]').click();
  await p.click('#goBtn');
  await p.waitForFunction(() => ZONA.want, null, { timeout: 5000 });
  let z = await Z();
  ok(z.nivel === 1 && !!z.want, 'a friend shows up at the top: ' + z.want);
  ok(!/[A-Za-zÁÉÍÓÚáéíóúñ]/.test(await p.locator('#play').innerText()), 'no words on the child\u2019s screen');
  await casa(TODOS.find(x => x !== z.want)); await p.waitForTimeout(200);
  ok((await Z()).round === 0, 'a wrong house: the right one glows, nothing ends');
  for (let i = 0; i < 8; i++){ await listo(); if (await terminado()) break; z = await Z(); await casa(z.want); await p.waitForTimeout(1500); }
  await p.waitForFunction(() => document.getElementById('done').style.display === 'flex', null, { timeout: 8000 });
  const st = await p.locator('#dStars').innerText();
  ok((st.match(/⭐/g) || []).length === 4 && (st.match(/✨/g) || []).length === 1, 'five rounds: four ⭐ and one ✨ (the round with the miss)');
  ok(await p.evaluate(() => Object.keys(localStorage).length) === 0, 'nothing about the child is saved on the tablet');

  console.log('\n3 · Level 2 · ¿Quién va?');
  await p.click('#dBack');
  await p.locator('#pickLvl button[data-lvl="2"]').click();
  await p.click('#goBtn'); await listo(); await p.waitForTimeout(700);
  z = await Z();
  ok(z.nivel === 2 && await p.locator('#face').innerText() === '👆', 'the ball appears, the face shows a hand');
  await guardia(TODOS.find(x => x !== z.want)); await p.waitForTimeout(300);
  ok((await Z()).round === 0, 'the wrong friend: the right one glows, same ball again');
  await listo(); await guardia(z.want); await p.waitForTimeout(700);
  const mov = await p.evaluate(() => [...document.querySelectorAll('.zn-guard')].map(n => getComputedStyle(n).transform));
  ok(mov.every(t => t !== 'none'), 'the right friend runs to the ball, the other four take a step');
  for (let i = 0; i < 8; i++){ await listo(); if (await terminado()) break; z = await Z(); await guardia(z.want); await p.waitForTimeout(1900); }
  ok(await terminado(), 'level 2 complete');

  console.log('\n4 · Level 3 · La bola viaja');
  await p.click('#dBack');
  await p.locator('#pickLvl button[data-lvl="3"]').click();
  await p.click('#goBtn'); await p.waitForTimeout(900);
  ok(await p.locator('#face').innerText() === '👀', 'eyes while the ball travels');
  await listo(); z = await Z();
  ok(z.chain.length === 2, 'two passes first');
  await guardia(TODOS.find(x => x !== z.chain[0])); await p.waitForTimeout(300);
  ok((await Z()).round === 0, 'a miss: the ball shows the way again — no game over');
  for (let r = 0; r < 14; r++){
    await listo(); if (await terminado()) break; z = await Z();
    for (const id of z.chain){ await guardia(id); await p.waitForTimeout(150); }
    await p.waitForTimeout(1900);
  }
  ok(await terminado(), 'level 3 complete');
  const largos = await p.evaluate(() => ZONA.chain.length);
  ok(largos === 3, 'three passes in the second half of the session');

  console.log('\n5 · English, phone');
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  await p.click('#langBtn');
  const en = await p.locator('#tRules').innerText();
  ok(/Guard your house/.test(en), 'EN: «Guard your house. Move toward the ball.»' + (/Guard/.test(en) ? '' : ' — got: ' + en.slice(0, 40)));
  await p.setViewportSize({ width: 360, height: 740 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 360), 'fits a small phone');

  console.log('\n6 · Spanish first, Spanish voice');
  await p.evaluate(() => localStorage.removeItem('cj-zona-lang'));
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  ok(/Cuida tu casa/.test(await p.locator('#tRules').innerText()) && await p.locator('#langBtn').innerText() === 'EN',
     'opens in Spanish with an EN button, even on a phone set to English');
  await p.locator('#pickLvl button[data-lvl="2"]').click();
  await p.click('#goBtn'); await p.waitForTimeout(1500);
  let d = await p.evaluate(() => window.__dichos);
  ok(d.length >= 2 && d[0].text === '¡A defender!', 'the voice starts right on «Empezar»: «¡A defender!»');
  ok(d.some(x => x.text === '¿Quién va a la bola?'), 'then says «¿Quién va a la bola?»');
  ok(d.every(x => x.lang === 'es-PR' && x.voice === 'Mónica PR'), 'in a Spanish voice — Puerto Rico first (' + (d[0] && d[0].voice) + ')');
  await p.evaluate(() => { document.querySelector('#quitBtn'); window.quitToSetup(); });
  await p.click('#langBtn');
  await p.evaluate(() => { window.__dichos = []; });
  await p.click('#goBtn'); await p.waitForTimeout(1500);
  d = await p.evaluate(() => window.__dichos);
  ok(d.some(x => x.text === 'Who goes to the ball?') && d.every(x => x.lang === 'en-US'), 'tap EN: English words in an English voice');
  await p.evaluate(() => window.quitToSetup());
  await p.click('#langBtn');
  ok(await p.locator('#langBtn').innerText() === 'EN', 'and ES brings Spanish back');

  console.log('\n7 · Reto: la bola viaja, until a miss');
  await p.evaluate(() => window.quitToSetup());
  ok(await p.locator('#pickLvl button').count() === 3, 'the levels stay three: the challenge is not one of them');
  const orden = await p.evaluate(() => {
    const y = id => document.getElementById(id).getBoundingClientRect().top;
    return y('retoBox') > y('goBtn') && y('goBtn') > y('lenBox');
  });
  ok(orden, 'the challenge is its own box, below Rondas and Empezar');
  ok(/hasta el primer fallo/.test(await p.locator('#tRetoP').innerText()), 'it says: no rounds, until the first miss');
  await p.locator('#pickVoz button[data-voz="0"]').click();
  await p.click('#retoBtn');
  const largos4 = [];
  for (let r = 0; r < 3; r++){            // three clean chains: 2, 3, 4 passes
    await p.waitForFunction(() => !ZONA.busy && ZONA.chain && ZONA.chain.length, null, { timeout: 20000 });
    z = await Z(); largos4.push(z.chain.length);
    for (const id of z.chain){ await guardia(id); await p.waitForTimeout(120); }
    await p.waitForTimeout(1900);
  }
  ok(largos4.join(',') === '2,3,4', 'it climbs one pass at a time: ' + largos4.join(', '));
  await p.waitForFunction(() => !ZONA.busy, null, { timeout: 20000 });
  z = await Z();
  ok(z.chain.length === 5, 'next up: 5 passes');
  await guardia(TODOS.find(x => x !== z.chain[0]));
  await p.waitForFunction(() => document.getElementById('done').style.display === 'flex', null, { timeout: 5000 });
  ok(true, 'one miss ends it');
  ok(await p.locator('#dWall').innerText() === '🔥 4', 'it shows how far they got: 🔥 4');
  ok(/🏆/.test(await p.locator('#dStars').innerText()), 'and a 🏆 for the new record');
  await p.click('.d-again');
  await p.waitForFunction(() => ZONA.round === 0 && !ZONA.busy && ZONA.chain && ZONA.chain.length < 5, null, { timeout: 20000 });
  ok((await Z()).chain.length === 2, '▶ starts over from 2');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));

  await b.close();
  console.log(malos ? `\n${malos} FAILED` : '\nALL PASS');
  process.exit(malos ? 1 : 0);
})();
