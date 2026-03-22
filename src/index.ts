import Fastify from 'fastify';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { z } from 'zod';

dotenv.config();

const fastify = Fastify({ logger: true });

const PORT = Number(process.env.PORT) || 4000;

const products: any[] = [];

const productSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number().positive(),
    category: z.string(),
    inStock: z.boolean(),
});

// GET /api/products
fastify.get('/api/products', async (request, reply) => {
    return reply.status(200).send(products);
});

// POST create
fastify.post('/api/products', async (request, reply) => {
    try {
        const parsed = productSchema.parse(request.body);

        const newProduct = {
            id: randomUUID(),
            ...parsed,
        };

        products.push(newProduct);

        return reply.status(201).send(newProduct);
    } catch (error) {
        return reply.status(400).send({
            message: 'Invalid request body',
        });
    }
});


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