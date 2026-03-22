import dotenv from 'dotenv';
import { fastify } from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const start = async () => {
    try {
        await fastify.listen({ port: PORT });
        console.log(`Server running on http://localhost:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();