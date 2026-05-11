const http = require('node:http');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');

const PORT = 9900;
const SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = '/www/wwwroot/MacBuddyTools/deploy.sh';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    // Verify GitHub signature if secret is set
    if (SECRET) {
      const sig = req.headers['x-hub-signature-256'] || '';
      const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        console.log(`${new Date().toISOString()} Signature mismatch, rejected`);
        res.writeHead(403);
        res.end('Invalid signature');
        return;
      }
    }

    // Only deploy on push to main
    try {
      const payload = JSON.parse(body.toString());
      if (payload.ref && payload.ref !== 'refs/heads/main') {
        res.writeHead(200);
        res.end('Ignored: not main branch');
        return;
      }
    } catch {}

    // Run deploy script
    execFile('bash', [DEPLOY_SCRIPT], (err, stdout, stderr) => {
      if (err) {
        console.error(`${new Date().toISOString()} Deploy failed:`, stderr);
        res.writeHead(500);
        res.end('Deploy failed');
        return;
      }
      console.log(`${new Date().toISOString()} Deploy success:`, stdout.trim());
      res.writeHead(200);
      res.end('Deployed');
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Webhook server listening on 127.0.0.1:${PORT}`);
});
