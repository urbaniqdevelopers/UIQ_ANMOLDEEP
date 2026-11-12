/* UrbanIQ Anmoldeep - zero-dependency Node server (Node 18+).
   Serves the website, public enquiry API and the password-protected admin API.
   Run:  node server/server.js          Env: see server/.env.example */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });
try { for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch (e) {}
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || '0.0.0.0';

/* ---------- storage (JSON file, atomic writes) ---------- */
const DB_FILE = path.join(DATA, 'db.json'), ADM_FILE = path.join(DATA, 'admin.json'), SEC_FILE = path.join(DATA, 'secret.key');
const defaults = () => ({ enquiries: [], config: { phone: '99966 61797', plots: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, { status: 'available', note: '' }])) } });
let db; try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = defaults(); }
db.enquiries = db.enquiries || []; db.config = Object.assign(defaults().config, db.config || {});
let saving = null; const save = () => { clearTimeout(saving); saving = setTimeout(() => { const tmp = DB_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db, null, 2)); fs.renameSync(tmp, DB_FILE); }, 80); };
save();
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
let adm; try { adm = JSON.parse(fs.readFileSync(ADM_FILE, 'utf8')); } catch (e) {
  const user = process.env.ADMIN_USER || 'admin', pw = process.env.ADMIN_PASS || crypto.randomBytes(9).toString('base64url'), salt = crypto.randomBytes(16).toString('hex');
  adm = { user, salt, hash: hashPw(pw, salt) }; fs.writeFileSync(ADM_FILE, JSON.stringify(adm));
  console.log('\n  First run. Admin login created:\n    user: ' + user + '\n    pass: ' + pw + (process.env.ADMIN_PASS ? '' : '\n    (shown once, change it in the admin panel > Settings)') + '\n');
}
let SECRET = process.env.SESSION_SECRET; if (!SECRET) { try { SECRET = fs.readFileSync(SEC_FILE, 'utf8'); } catch (e) { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SEC_FILE, SECRET); } }

/* ---------- helpers ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };
const send = (res, code, body, headers) => { const b = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); res.writeHead(code, Object.assign({ 'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json' : 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }, headers || {})); res.end(b); };
const readBody = req => new Promise((ok, no) => { let n = 0; const ch = []; req.on('data', c => { n += c.length; if (n > 30000) { no(new Error('too large')); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { ok(ch.length ? JSON.parse(Buffer.concat(ch).toString()) : {}); } catch (e) { no(new Error('bad json')); } }); });
const ip = req => (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || req.socket.remoteAddress || '';
const hits = new Map(); const limited = (k, max, ms) => { const now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms); a.push(now); hits.set(k, a); return a.length > max; };
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();
const sign = p => { const b = Buffer.from(JSON.stringify(p)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
const verify = t => { try { const [b, s] = String(t).split('.'), e = crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null; const p = JSON.parse(Buffer.from(b, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (e) { return null; } };
const cookie = req => Object.fromEntries(String(req.headers.cookie || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const authed = req => { const p = verify(cookie(req).uiq_s); return p && p.u === adm.user ? p : null; };
const secure = req => process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https';
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const STATUS = ['new', 'contacted', 'visit', 'closed'], PSTAT = ['available', 'booked', 'sold'];
const csvCell = v => { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };

/* ---------- API ---------- */
async function api(req, res, url) {
  const r = url.pathname.replace(/^\/api/, ''), m = req.method;
  if (r === '/config' && m === 'GET') return send(res, 200, { phone: db.config.phone, plots: db.config.plots }, { 'Cache-Control': 'no-store' });
  if (r === '/enquiry' && m === 'POST') {
    if (limited('enq' + ip(req), 6, 600e3)) return send(res, 429, { error: 'Too many requests. Please try later.' });
    const b = await readBody(req); if (b.website) return send(res, 200, { ok: true });           /* honeypot */
    const name = clean(b.name, 80), phone = clean(b.phone, 20), digits = phone.replace(/\D/g, ''), plot = clean(b.plot, 4);
    if (name.length < 2 || digits.length < 7 || digits.length > 15) return send(res, 400, { error: 'Please enter a valid name and phone number.' });
    db.enquiries.unshift({ id: crypto.randomBytes(6).toString('hex'), name, phone, plot, status: 'new', note: '', at: new Date().toISOString(), ip: ip(req) }); if (db.enquiries.length > 20000) db.enquiries.length = 20000; save();
    return send(res, 200, { ok: true });
  }
  if (r === '/admin/login' && m === 'POST') {
    if (limited('login' + ip(req), 8, 900e3)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const b = await readBody(req), ok = clean(b.user, 60) === adm.user && crypto.timingSafeEqual(Buffer.from(hashPw(String(b.pass || ''), adm.salt)), Buffer.from(adm.hash));
    if (!ok) return send(res, 401, { error: 'Wrong username or password.' });
    const t = sign({ u: adm.user, exp: Date.now() + 12 * 3600e3 });
    return send(res, 200, { ok: true }, { 'Set-Cookie': `uiq_s=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${12 * 3600}${secure(req) ? '; Secure' : ''}` });
  }
  if (r === '/admin/logout' && m === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': 'uiq_s=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  if (!r.startsWith('/admin/')) return send(res, 404, { error: 'Not found' });
  if (!authed(req)) return send(res, 401, { error: 'Login required' });
  if (m !== 'GET' && !/application\/json/.test(req.headers['content-type'] || '') && m !== 'DELETE') return send(res, 415, { error: 'JSON only' });
  if (r === '/admin/me') return send(res, 200, { user: adm.user });
  if (r === '/admin/data' && m === 'GET') return send(res, 200, { enquiries: db.enquiries, config: db.config }, { 'Cache-Control': 'no-store' });
  if (r === '/admin/export.csv' && m === 'GET') {
    const rows = [['Date', 'Name', 'Phone', 'Plot', 'Status', 'Note']].concat(db.enquiries.map(e => [e.at, e.name, e.phone, e.plot, e.status, e.note]));
    return send(res, 200, '\ufeff' + rows.map(x => x.map(csvCell).join(',')).join('\r\n'), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="enquiries.csv"' });
  }
  let mm = r.match(/^\/admin\/enquiries\/([a-f0-9]+)$/);
  if (mm) { const i = db.enquiries.findIndex(e => e.id === mm[1]); if (i < 0) return send(res, 404, { error: 'Not found' });
    if (m === 'DELETE') { db.enquiries.splice(i, 1); save(); return send(res, 200, { ok: true }); }
    if (m === 'PATCH') { const b = await readBody(req); if (b.status !== undefined) { if (!STATUS.includes(b.status)) return send(res, 400, { error: 'bad status' }); db.enquiries[i].status = b.status; } if (b.note !== undefined) db.enquiries[i].note = clean(b.note, 500); save(); return send(res, 200, db.enquiries[i]); } }
  if (r === '/admin/config' && m === 'PUT') {
    const b = await readBody(req); if (b.phone !== undefined) db.config.phone = clean(b.phone, 20) || db.config.phone;
    if (b.plots && typeof b.plots === 'object') for (let n = 1; n <= 12; n++) { const p = b.plots[n]; if (p) db.config.plots[n] = { status: PSTAT.includes(p.status) ? p.status : 'available', note: clean(p.note, 120) }; }
    save(); return send(res, 200, { ok: true, config: db.config });
  }
  if (r === '/admin/password' && m === 'POST') {
    const b = await readBody(req); if (!crypto.timingSafeEqual(Buffer.from(hashPw(String(b.current || ''), adm.salt)), Buffer.from(adm.hash))) return send(res, 400, { error: 'Current password is wrong.' });
    if (String(b.next || '').length < 8) return send(res, 400, { error: 'Use at least 8 characters.' });
    adm.salt = crypto.randomBytes(16).toString('hex'); adm.hash = hashPw(String(b.next), adm.salt); if (b.user) adm.user = clean(b.user, 40) || adm.user; fs.writeFileSync(ADM_FILE, JSON.stringify(adm)); return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Not found' });
}

/* ---------- static files ---------- */
function serve(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (p.endsWith('/')) p += 'index.html'; if (p === '/admin') { res.writeHead(301, { Location: '/admin/' }); return res.end(); }
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT + path.sep) || /(^|[\\/])(server|node_modules|\.[^\\/]*)([\\/]|$)/.test(path.relative(ROOT, f))) return send(res, 404, 'Not found');
  fs.stat(f, (e, st) => { if (e || !st.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(f).toLowerCase(), h = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': /\.(html)$/.test(ext) ? 'no-cache' : 'public, max-age=604800' };
    if (p.startsWith('/admin')) { h['X-Frame-Options'] = 'DENY'; h['Cache-Control'] = 'no-store'; }
    res.writeHead(200, h); if (req.method === 'HEAD') return res.end(); fs.createReadStream(f).pipe(res); });
}

http.createServer(async (req, res) => {
  try { const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    serve(req, res, url);
  } catch (e) { if (!res.headersSent) send(res, e.message === 'too large' ? 413 : 400, { error: e.message === 'too large' ? 'Too large' : 'Bad request' }); else res.end(); }
}).listen(PORT, HOST, () => console.log(`UrbanIQ Anmoldeep running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}   (admin: /admin/)`));
process.on('SIGTERM', () => { try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) {} process.exit(0); });
process.on('SIGINT', () => { try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) {} process.exit(0); });
