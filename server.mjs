import { createServer } from 'node:http';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const send = (res, status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }); res.end(body); };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/orders') {
    if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'Метод не поддерживается.' }));
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 10000) return send(res, 413, JSON.stringify({ error: 'Слишком длинная заявка.' }));
    }
    try {
      const data = JSON.parse(raw);
      const name = String(data.name || '').trim().slice(0, 80);
      const phone = String(data.phone || '').trim().slice(0, 30);
      const cake = String(data.cake || '').trim().slice(0, 100);
      const date = String(data.date || '').trim().slice(0, 10);
      const message = String(data.message || '').trim().slice(0, 1000);
      if (!name || !/^[+\d\s()\-]{7,30}$/.test(phone)) return send(res, 400, JSON.stringify({ error: 'Проверьте имя и номер телефона.' }));
      const todayInLyubertsy = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayInLyubertsy)) return send(res, 400, JSON.stringify({ error: 'Проверьте дату заказа.' }));
      const id = randomUUID().slice(0, 8).toUpperCase();
      await mkdir(join(root, 'data'), { recursive: true });
      await appendFile(join(root, 'data', 'orders.jsonl'), JSON.stringify({ id, name, phone, cake, date, message, createdAt: new Date().toISOString() }) + '\n', { encoding: 'utf8', mode: 0o600 });
      return send(res, 201, JSON.stringify({ id }));
    } catch (error) {
      if (error instanceof SyntaxError) return send(res, 400, JSON.stringify({ error: 'Некорректная заявка.' }));
      console.error(error);
      return send(res, 500, JSON.stringify({ error: 'Не удалось сохранить заявку.' }));
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  let path;
  try { path = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return send(res, 400, 'Bad request', 'text/plain'); }
  if (!/^\/(?:index\.html|styles\.css|app\.js|favicon\.svg|image\/(?:[1-5]\.webp|6\.jpg))$/.test(path)) return send(res, 404, 'Not found', 'text/plain');
  const file = join(root, ...path.slice(1).split('/'));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { send(res, 404, 'Not found', 'text/plain'); }
}).listen(port, '127.0.0.1', () => console.log(`Local URL: http://127.0.0.1:${port}`));
