import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { validate as isUUID } from 'uuid';
import { products } from './db';

export const fastify = Fastify({ logger: true });

const productSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number().positive(),
    category: z.string(),
    inStock: z.boolean(),
});

const isMulti = () => process.env.MODE === 'multi';

function sendToMaster(type: string, data?: any) {
    return new Promise((resolve, reject) => {
        if (!process.send || process.env.MODE !== 'multi') {
            reject(new Error('IPC disabled (dev mode)'));
            return;
        }

        const requestId = randomUUID();

        const handler = (msg: any) => {
            if (msg.requestId === requestId) {
                process.off('message', handler);
                resolve(msg.result);
            }
        };

        process.on('message', handler);

        process.send({ type, data, requestId });

        setTimeout(() => {
            process.off('message', handler);
            reject(new Error('IPC timeout'));
        }, 3000);
    });
}

fastify.get('/api/products', async (_, reply) => {
    console.log(`Worker ${process.pid}: GET /api/products mode=${process.env.MODE} isMulti=${isMulti()}`);
    if (!isMulti()) {
        console.log(`Worker ${process.pid}: local products=${products.length}`);
        return reply.send(products);
    }

    const result = await sendToMaster('GET_ALL');
    console.log(`Worker ${process.pid}: GET_ALL got ${Array.isArray(result) ? result.length : '??'}`);
    return reply.send(result);
});

fastify.get('/api/products/:id', async (req, reply) => {
    const { id } = req.params as any;

    if (!isUUID(id)) {
        return reply.code(400).send({ message: 'Invalid id' });
    }

    if (!isMulti()) {
        const product = products.find(p => p.id === id);

        if (!product) {
            return reply.code(404).send({ message: 'Not found' });
        }

        return reply.send(product);
    }

    const product = await sendToMaster('GET_ONE', { id });

    if (!product) {
        return reply.code(404).send({ message: 'Not found' });
    }

    return reply.send(product);
});


fastify.post('/api/products', async (req, reply) => {
    const parsed = productSchema.parse(req.body);

    const product = {
        id: randomUUID(),
        ...parsed,
    };

    if (!isMulti()) {
        products.push(product);
        return reply.code(201).send(product);
    }

    const result = await sendToMaster('CREATE', product);
    return reply.code(201).send(result);
});

fastify.put('/api/products/:id', async (req, reply) => {
    const { id } = req.params as any;
    const parsed = productSchema.parse(req.body);

    if (!isUUID(id)) {
        return reply.code(400).send({ message: 'Invalid id' });
    }

    if (!isMulti()) {
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return reply.code(404).send({ message: 'Not found' });
        }

        products[index] = { id, ...parsed };

        return reply.send(products[index]);
    }

    const result = (await sendToMaster('UPDATE', { id, ...parsed })) as { found: boolean; data?: any };

    if (!result.found) {
        return reply.code(404).send({ message: 'Not found' });
    }

    return reply.send(result.data);
});

fastify.delete('/api/products/:id', async (req, reply) => {
    const { id } = req.params as any;

    if (!isUUID(id)) {
        return reply.code(400).send({ message: 'Invalid id' });
    }

    if (!isMulti()) {
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return reply.code(404).send({ message: 'Not found' });
        }

        products.splice(index, 1);

        return reply.code(204).send();
    }

    const result = (await sendToMaster('DELETE', { id })) as boolean;

    if (!result) {
        return reply.code(404).send({ message: 'Not found' });
    }

    return reply.code(204).send();
});