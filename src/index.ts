import Fastify from 'fastify';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { validate as isUUID } from 'uuid';

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
    return reply.code(200).send(products);
});

// PUT /api/products/:productId
fastify.put('/api/products/:productId', async (request, reply) => {
    try {
        const { productId } = request.params as { productId: string };

        if (!isUUID(productId)) {
            return reply.code(400).send({
                message: 'Invalid productId',
            });
        }

        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return reply.code(404).send({
                message: 'Product not found',
            });
        }

        const parsed = productSchema.parse(request.body);

        const updatedProduct = {
            id: productId,
            ...parsed,
        };

        products[productIndex] = updatedProduct;

        return reply.code(200).send(updatedProduct);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send({
                message: 'Validation error',
                errors: error.issues,
            });
        }

        return reply.code(500).send({
            message: 'Internal server error',
        });
    }
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
        if (error instanceof z.ZodError) {
            return reply.code(400).send({
                message: 'Validation error',
                errors: error.issues,
            });
        }

        return reply.code(500).send({
            message: 'Internal server error',
        });
    }
});

// DELETE /api/products/:productId
fastify.delete('/api/products/:productId', async (request, reply) => {
    try {
        const { productId } = request.params as { productId: string };

        if (!isUUID(productId)) {
            return reply.code(400).send({
                message: 'Invalid productId',
            });
        }

        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return reply.code(404).send({
                message: 'Product not found',
            });
        }

        products.splice(productIndex, 1);

        return reply.code(204).send();
    } catch (error) {
        return reply.code(500).send({
            message: 'Internal server error',
        });
    }
});

// GET /api/products/:productId
fastify.get('/api/products/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    if (!isUUID(productId)) {
        return reply.status(400).send({
            message: 'Invalid productId',
        });
    }

    const product = products.find(p => p.id === productId);

    if (!product) {
        return reply.status(404).send({
            message: 'Product not found',
        });
    }

    return reply.code(200).send(product);
});

fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
        message: `Route ${request.method} ${request.url} not found`,
    });
});

fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.code(500).send({
        message: 'Internal server error',
    });
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