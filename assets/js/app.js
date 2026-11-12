/* UrbanIQ Anmoldeep - page behaviour: scroll UI, calm music, enquiry form, explore mode */
(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ez = t => t * t * (3 - 2 * t);
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches, G = window.UIQ3D || { ok: false, P: {}, ready: Promise.resolve(false), pick() {}, explore() {}, night() {} };
if (/Chrome\//.test(navigator.userAgent)) document.documentElement.classList.add('cr');
$$('[data-bg]').forEach(e => e.style.backgroundImage = 'url(' + e.dataset.bg + ')');
const toast = (m, ms = 4200) => { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => t.style.display = 'none', ms); };

/* ---------- loader ---------- */
const ld = $('#ld'), hideLd = () => ld && ld.classList.add('off');
G.ready.then(ok => { hideLd(); if (!ok) { const xs = $('#xs'); if (xs) xs.style.display = 'none'; toast('The live 3D view is unavailable on this device, so you are seeing the photo version.'); } });
setTimeout(hideLd, 7000);

/* ---------- sound: soft generative ambient music + gentle UI sounds ---------- */
const A = { c: null, m: null, on: true, bus: null };
try { if (localStorage.getItem('uiq_snd') === '0') A.on = false; } catch (e) {}
function paintSnd() { ['#snd', '#snd2'].forEach(s => { const b = $(s); if (b) b.style.opacity = A.on ? 1 : .45; }); } paintSnd();
function impulse(c, sec, decay) { const n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
function startMusic() {
  const c = A.c, out = c.createGain(); out.gain.value = 0; out.connect(A.m); out.gain.linearRampToValueAtTime(.9, c.currentTime + 6);
  const rev = c.createConvolver(); rev.buffer = impulse(c, 4.5, 2.6); const rg = c.createGain(); rg.gain.value = .75; rev.connect(rg); rg.connect(out);
  const dl = c.createDelay(1.5); dl.delayTime.value = .62; const fb = c.createGain(); fb.gain.value = .32; const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1800; dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(rev);
  const dry = c.createGain(); dry.gain.value = .55; dry.connect(out); const send = c.createGain(); send.gain.value = .7; send.connect(rev); send.connect(dl);
  const f = n => 440 * Math.pow(2, (n - 69) / 12);
  const chords = [[48, 55, 59, 62, 64], [45, 52, 55, 60, 64], [41, 48, 55, 60, 64], [43, 50, 55, 59, 64]];   /* Cmaj9 · Am9 · Fmaj9 · G6/9 */
  const pent = [72, 74, 76, 79, 81, 84, 86];
  function pad(notes, t0, dur) { notes.forEach((n, i) => [-4, 4].forEach(dt => { const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f(n); o.detune.value = dt + (Math.random() * 3 - 1.5); lp.type = 'lowpass'; lp.frequency.value = 700 + i * 120; lp.Q.value = .3;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.034 / (1 + i * .12), t0 + dur * .4); g.gain.linearRampToValueAtTime(0, t0 + dur + 2.5); o.connect(lp); lp.connect(g); g.connect(dry); g.connect(send); o.start(t0); o.stop(t0 + dur + 3); })); }
  function bell(n, t0, v) { const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f(n); o2.frequency.value = f(n) * 2.01; const g2 = c.createGain(); g2.gain.value = .12; o2.connect(g2);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + 3.2); o.connect(g); g2.connect(g); g.connect(dry); g.connect(send); o.start(t0); o2.start(t0); o.stop(t0 + 3.4); o2.stop(t0 + 3.4); }
  let ci = 0, next = c.currentTime + .2;
  (function tick() { if (!A.c) return; const now = c.currentTime; while (next < now + 8) { const ch = chords[ci % 4]; pad(ch, next, 11); let t = next + 1.5 + Math.random(); for (let k = 0; k < 4; k++) { if (Math.random() < .8) bell(pent[Math.floor(Math.random() * pent.length)], t, .03 + Math.random() * .02); t += 1.6 + Math.random() * 1.9; } ci++; next += 11; } setTimeout(tick, 2500); })();
}
function ai() { if (A.c) { if (A.c.state === 'suspended') A.c.resume(); return; } try { const c = A.c = new (window.AudioContext || window.webkitAudioContext)(); A.m = c.createGain(); A.m.gain.value = A.on ? .8 : 0; const comp = c.createDynamicsCompressor(); A.m.connect(comp); comp.connect(c.destination); startMusic(); } catch (e) { console.warn('audio', e); } }
['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, ai, { once: true }));
function env(f, d, v, t, dl) { if (!A.c || !A.on) return; const c = A.c, o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dl || 0); o.type = t || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(v, n + .01); g.gain.exponentialRampToValueAtTime(.0001, n + d); o.connect(g); g.connect(A.m); o.start(n); o.stop(n + d + .05); }
const sfx = { tick: () => env(2300, .05, .015), click: () => { env(620, .2, .05, 'triangle'); env(1710, .25, .02, 'sine', .01); env(930, .3, .02, 'sine', .03); }, chime: () => [660, 880, 1320].forEach((f, i) => env(f, .9, .04, 'sine', i * .09)),
  whoosh: () => { if (!A.c || !A.on) return; const c = A.c, b = c.createBuffer(1, c.sampleRate * .7, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), n = c.currentTime; s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.1; f.frequency.setValueAtTime(250, n); f.frequency.exponentialRampToValueAtTime(2200, n + .6); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.06, n + .2); g.gain.linearRampToValueAtTime(0, n + .65); s.connect(f); f.connect(g); g.connect(A.m); s.start(); } };
G.whoosh = sfx.whoosh;
function toggleSnd() { ai(); A.on = !A.on; if (A.m) A.m.gain.setTargetAtTime(A.on ? .8 : 0, A.c.currentTime, .15); try { localStorage.setItem('uiq_snd', A.on ? '1' : '0'); } catch (e) {} paintSnd(); }
['#snd', '#snd2'].forEach(s => { const b = $(s); if (b) b.onclick = toggleSnd; });
document.addEventListener('pointerover', e => { const b = e.target.closest && e.target.closest('.lg'); if (b && !b.contains(e.relatedTarget)) sfx.tick(); });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.lg')) sfx.click(); });
document.addEventListener('pointermove', e => { const b = e.target.closest && e.target.closest('.lg'); if (!b) return; const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; b.style.setProperty('--mx', x + 'px'); b.style.setProperty('--my', y + 'px'); if (!RM) b.style.translate = ((x - r.width / 2) * .1) + 'px ' + ((y - r.height / 2) * .18) + 'px'; });
document.addEventListener('pointerout', e => { const b = e.target.closest && e.target.closest('.lg'); if (b) b.style.translate = ''; });

/* ---------- explore mode ---------- */
$('#xbtn').onclick = () => { ai(); sfx.whoosh(); G.explore(true); };
$('#xback').onclick = () => { sfx.whoosh(); G.explore(false); };
$('#xnight').onclick = e => { e.currentTarget.textContent = G.night(); };
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('xp')) { G.explore(false); } });

/* ---------- site config from the backend (plot status, phone) ---------- */
const STL = { available: ['Available', 'st-av'], booked: ['Booked', 'st-bk'], sold: ['Sold', 'st-sd'] };
fetch('api/config').then(r => r.ok ? r.json() : Promise.reject()).then(cfg => {
  if (cfg.phone) { const t = cfg.phone.replace(/\D/g, ''); $$('a[href^="tel:"]').forEach(a => a.href = 'tel:' + t); const big = $('a.tel'); if (big) big.textContent = cfg.phone; const h = $$('a.lg[href^="tel:"]')[0]; if (h && h !== big) h.textContent = 'Call ' + cfg.phone; }
  Object.entries(cfg.plots || {}).forEach(([n, v]) => { if (G.P[n]) { G.P[n].status = v.status || 'available'; if (v.note) G.P[n].note = v.note; } });
}).catch(() => {});

/* ---------- masterplan chips ---------- */
const ch = $('#chips'), info = $('#info'), dflt = info.innerHTML; let sel = 0;
function pick(n) { sel = n; ch.querySelectorAll('.lg').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); G.pick(n); if (!n) { info.innerHTML = dflt; return; }
  const p = G.P[n], st = STL[p.status] || STL.available; info.innerHTML = '<b>Plot ' + n + '</b><span>' + p.s + ' sq.ft · ' + p.d + '</span><span>' + p.t + '</span><span class="' + st[1] + '">' + st[0] + '</span>' + (p.note ? '<span>' + p.note.replace(/[<>&]/g, '') + '</span>' : ''); sfx.chime(); }
for (let n = 1; n <= 12; n++) { const b = document.createElement('button'); b.className = 'lg sm'; b.dataset.n = n; b.textContent = n; b.onclick = () => pick(sel === n ? 0 : n); ch.appendChild(b);
  const o = document.createElement('option'); o.textContent = 'Plot ' + n + ' (' + G.P[n].s + ' sq.ft)'; o.value = n; $('select').appendChild(o); }

/* ---------- counters ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target, to = +el.dataset.to, p = +el.dataset.p || 0, s = el.dataset.s || '', t0 = performance.now(); (function f(now) { const k = cl((now - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = String(v).padStart(p, '0') + s; if (k < 1) requestAnimationFrame(f); })(t0); }), { threshold: .6 });
$$('.n').forEach(e => io.observe(e));

/* ---------- pinned card deck ---------- */
const feat = $('#feat'), fcs = $$('.fc'); let lc = -1;
function deck() { const r = feat.getBoundingClientRect(), p = cl(-r.top / (r.height - innerHeight)), t = p * (fcs.length - 1);
  fcs.forEach((c, i) => { const en = i ? cl(t - (i - 1)) : 1, lv = cl(t - i), e = ez(en); c.style.transform = 'translate3d(0,' + (1 - e) * 118 + '%,' + (-lv * 170) + 'px) rotateX(' + ((1 - e) * -24 + lv * 8) + 'deg) scale(' + (1 - lv * .07) + ')'; c.style.filter = 'brightness(' + (1 - lv * .55) + ')'; c.style.zIndex = i; c.firstChild.style.transform = 'scale(1.08) translateY(' + ((en - .5) * -26) + 'px)'; });
  const k = Math.round(t); if (k !== lc && r.top < innerHeight * .5 && r.bottom > innerHeight * .5) { if (lc >= 0) { env(520, .35, .04, 'triangle'); env(780, .4, .03, 'sine', .07); } lc = k; } }
addEventListener('scroll', deck, { passive: true }); deck();

/* ---------- connectivity ---------- */
const D = { Transport: [['Nelamangala bus stand', 3], ['Railway station', 4.3], ['Madavara Metro', 12.6], ['Nagasandra Metro', 16], ['Yeshwantpur Junction', 24], ['Majestic city centre', 28.6], ['Kempegowda Airport', 50]], 'Daily life': [['D-Mart', 2.5], ['Taluk General Hospital', 3], ['Reliance, Arishankunte', 7.4], ['BIEC Exhibition Centre', 12.8], ['Rockline Mall', 18], ['IKEA Bengaluru', 20]], Work: [['IndoSpace Nelamangala', 10.6], ['KSSIDC Industrial Estate', 10.7], ['IndoSpace / Ecobox Park', 14.1], ['BESCOM Institute', 18.5], ['Dobaspet 4th Phase', 19.7]], Lakes: [['Nelamangala Lake', 4], ['Sondekoppa Lake', 12], ['Hesaraghatta Lake', 20], ['Manchanabele Dam', 28], ['T.G. Halli Reservoir', 30]] };
const tb = $('#tabs'), rw = $('#rows');
function tab(k) { tb.querySelectorAll('.lg').forEach(b => b.classList.toggle('on', b.textContent === k)); const mx = Math.max(...D[k].map(a => a[1])); rw.innerHTML = D[k].map(a => '<div class="row"><span>' + a[0] + '</span><s><i data-w="' + a[1] / mx * 100 + '"></i></s><em>' + a[1] + ' km</em></div>').join(''); requestAnimationFrame(() => requestAnimationFrame(() => rw.querySelectorAll('i').forEach(i => i.style.width = i.dataset.w + '%'))); }
Object.keys(D).forEach(k => { const b = document.createElement('button'); b.className = 'lg sm'; b.textContent = k; b.onclick = () => tab(k); tb.appendChild(b); }); tab('Transport');
const mp = $('#map'); mp.addEventListener('pointermove', e => { if (RM) return; const r = mp.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; mp.style.transform = 'perspective(900px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg) scale(1.02)'; }); mp.addEventListener('pointerleave', () => mp.style.transform = '');

/* ---------- blueprint views ---------- */
const vs = $$('#vw .a'), vb = $$('[data-v]');
vb.forEach(b => b.onclick = () => { vb.forEach(x => x.classList.toggle('on', x === b)); vs.forEach((v, i) => { if (i == +b.dataset.v) { v.style.zIndex = 2; v.classList.remove('on'); void v.offsetWidth; v.classList.add('on'); } else { v.style.zIndex = 1; setTimeout(() => v.classList.remove('on'), 1100); } }); sfx.whoosh(); });

/* ---------- legals + enquiry form ---------- */
const lio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { lio.unobserve(e.target); const i = $$('.lc').indexOf(e.target); setTimeout(() => { e.target.classList.add('on'); sfx.chime(); }, i * 350); } }), { threshold: .5 });
$$('.lc').forEach(e => lio.observe(e));
$('#f').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, ok = $('#ok'), btn = f.querySelector('button'), sel = f.querySelector('select'); btn.disabled = true; ok.textContent = 'Sending…';
  try {
    const r = await fetch('api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.n.value, phone: f.t.value, plot: sel.value && sel.value !== 'Plot of interest' ? sel.value : '', website: '' }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'failed');
    ok.textContent = 'Thank you. The UrbanIQ team will call you to confirm your visit.'; sfx.chime(); f.reset();
  } catch (err) { ok.textContent = 'We could not send that just now. Please call us on the number below.'; }
  btn.disabled = false;
});
})();
