import 'dotenv/config';

console.log('index: process.env.MODE=', process.env.MODE, 'process.env.PORT=', process.env.PORT);

import { fastify } from './app';

const PORT = Number(process.env.PORT) || 4000;

fastify.listen({ port: PORT, host: '0.0.0.0' })
    .then(() => {
        console.log(`Worker running on ${PORT}`);
    });