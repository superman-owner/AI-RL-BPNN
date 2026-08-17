import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let pythonProc: any = null;
const eventClients = new Set<any>();

function pythonTrainingPlugin() {
  return {
    name: 'python-training-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // 1. SSE Stream for Real-time Progress & Logs
        if (url === '/api/train/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write('data: {"type":"connected"}\n\n');
          eventClients.add(res);

          req.on('close', () => {
            eventClients.delete(res);
          });
          return;
        }

        // 2. Start Real Python PyTorch Training
        if (url === '/api/train/start' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const config = JSON.parse(body || '{}');
              const configPath = path.join(process.cwd(), 'pipeline_config.json');
              fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

              if (pythonProc) {
                try {
                  pythonProc.kill();
                } catch (e) {}
                pythonProc = null;
              }

              const scriptPath = path.join(process.cwd(), 'train_fxforge_rl.py');
              pythonProc = spawn('python', [scriptPath, '--config', configPath], {
                cwd: process.cwd(),
                env: process.env,
              });

              pythonProc.stdout.on('data', (data: any) => {
                const text = data.toString();
                const payload = JSON.stringify({ type: 'stdout', text });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              pythonProc.stderr.on('data', (data: any) => {
                const text = data.toString();
                const payload = JSON.stringify({ type: 'stderr', text });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              pythonProc.on('close', (code: any) => {
                pythonProc = null;
                const payload = JSON.stringify({ type: 'finished', code });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'PyTorch RL Training process launched' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 3. Stop Real Training
        if (url === '/api/train/stop' && req.method === 'POST') {
          if (pythonProc) {
            try {
              pythonProc.kill();
            } catch (e) {}
            pythonProc = null;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Training process stopped' }));
          return;
        }

        // 4. Status Check
        if (url === '/api/train/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ running: Boolean(pythonProc) }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    pythonTrainingPlugin(),
  ],
});

