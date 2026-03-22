import 'dotenv/config';
import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';

const PORT = Number(process.env.PORT) || 4000;
const cpuCount = os.availableParallelism?.() || os.cpus().length;
const workersCount = cpuCount - 1;
const products: any[] = [];

let current = 0;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} started`);

    const workers: number[] = [];
    let readyWorkers = 0;

    for (let i = 0; i < workersCount; i++) {
        const port = PORT + i + 1;

        const worker = cluster.fork({
            ...process.env,
            PORT: String(port),
        });

        workers.push(port);

        worker.on('online', () => {
            readyWorkers++;
            console.log(`Worker ready on port ${port} (${readyWorkers}/${workersCount})`);
        });
    }

    cluster.on('message', (worker, message: any) => {
        const { type, data, requestId } = message;

        let result;

        switch (type) {
            case 'GET_ALL':
                console.log(`Master: GET_ALL products=${products.length}`);
                result = JSON.parse(JSON.stringify(products));
                break;

            case 'GET_ONE':
                console.log(`Master: GET_ONE id=${data.id} products=${products.length}`);
                result = products.find(p => p.id === data.id);
                break;

            case 'CREATE':
                products.push(data);
                console.log(`Master: CREATE id=${data.id} now products=${products.length}`);
                result = data;
                break;

            case 'UPDATE':
                const i = products.findIndex(p => p.id === data.id);
                if (i !== -1) {
                    products[i] = data;
                    result = { found: true, data };
                } else {
                    result = { found: false };
                }
                break;

            case 'DELETE':
                const idx = products.findIndex(p => p.id === data.id);
                if (idx !== -1) {
                    products.splice(idx, 1);
                    result = true;
                } else {
                    result = false;
                }
                break;
        }

        worker.send({ requestId, result });
    });

    const server = http.createServer((req, res) => {
        const targetPort = workers[current];

        current = (current + 1) % workers.length;

        const proxy = http.request(
            {
                hostname: 'localhost',
                port: targetPort,
                path: req.url,
                method: req.method,
                headers: req.headers,
            },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
                proxyRes.pipe(res);
            }
        );

        proxy.on('error', (err) => {
            console.error(`Proxy error for port ${targetPort}: ${err.message}`);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Internal Server Error' }));
            }
        });

        req.on('error', (err) => {
            console.error(`Request error: ${err.message}`);
            proxy.destroy();
        });

        req.pipe(proxy);
    });

    server.listen(PORT, () => {
        console.log(`Load balancer running on http://localhost:${PORT}`);
    });

} else {
    require('./index');
}