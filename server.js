import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5173', 10);
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data', 'shares');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // 1. Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // 2. POST /api/share - save share bundle
  if (pathname === '/api/share' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        let id = '';
        const chars = '23456789abcdefghjkmnpqrstuvwxyz';
        for (let i = 0; i < 6; i++) {
          id += chars[Math.floor(Math.random() * chars.length)];
        }

        const filePath = path.join(DATA_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(parsed), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. GET /api/share/:id - load share bundle
  if (pathname.startsWith('/api/share/') && req.method === 'GET') {
    const id = pathname.replace('/api/share/', '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (id && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
        return;
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read share' }));
        return;
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Share not found' }));
      return;
    }
  }

  // 4. POST /api/ai/solve - proxy AI solving with server key or user key
  if (pathname === '/api/ai/solve' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) req.destroy();
    });

    req.on('end', async () => {
      try {
        const { questions, userApiKey, model } = JSON.parse(body || '{}');
        const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'NO_API_KEY', message: 'Chưa cấu hình API Key trên server hoặc trình duyệt.' }));
          return;
        }

        if (!Array.isArray(questions) || questions.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, results: [] }));
          return;
        }

        const targetModel = model || 'gemini-3.5-flash-lite';
        const systemInstruction = `Bạn là chuyên gia khảo thí uy tín. Nhiệm vụ của bạn là giải các câu hỏi trắc nghiệm dưới đây và viết lời giải thích chi tiết.
Quy tắc:
1. Chọn đáp án đúng nhất (A, B, C, D...). Nếu đề có ghi "(Đáp án chọn sẵn: X)", hãy xác minh và giải thích vì sao X đúng.
2. Viết lời giải thích chuyên môn ngắn gọn, súc tích (1-3 câu), giải thích rõ cơ chế hoặc lý do tại sao đúng.
3. Trả về đúng định dạng JSON array: [{"id": "...", "correctKey": "A", "explanation": "..."}]`;

        const questionsPrompt = questions.map((q, idx) => {
          const opts = (q.options || []).map((o) => `${o.key}. ${o.text}`).join('\n');
          const knownKey = q.correctOptionId ? q.options?.find((o) => o.id === q.correctOptionId)?.key : undefined;
          const knownHint = knownKey ? ` (Đáp án chọn sẵn: ${knownKey})` : '';
          return `[Câu ${q.number || idx + 1}] (ID: ${q.id})${knownHint}\nĐề: ${q.text}\n${opts}`;
        }).join('\n\n---\n\n');

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstruction}\n\nDanh sách câu hỏi cần giải:\n\n${questionsPrompt}` }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          res.writeHead(aiRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'GEMINI_ERROR', details: errText }));
          return;
        }

        const aiData = await aiRes.json();
        const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleaned = text ? text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim() : '[]';
        const parsed = JSON.parse(cleaned);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, results: parsed }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Static file serving from DIST_DIR
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(DIST_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA Fallback: serve index.html for all frontend routes
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple Exam server running on port ${PORT}`);
});
