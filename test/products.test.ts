import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { fastify } from '../src/app';

let productId: string;
let initialized = false;

const init = async () => {
    if (!initialized) {
        await fastify.ready();
        initialized = true;
    }
};

test('GET /api/products → empty array', async () => {
    await init();
    const res = await request(fastify.server).get('/api/products');

    assert.equal(res.status, 200);
    assert.deepStrictEqual(res.body, []);
});

test('POST /api/products → create product', async () => {
    await init();
    const res = await request(fastify.server)
        .post('/api/products')
        .send({
            name: 'Phone',
            description: 'Smart phone',
            price: 1000,
            category: 'tech',
            inStock: true
        });

    assert.equal(res.status, 201);
    assert.ok(res.body.id);

    productId = res.body.id;
});

test('GET /api/products/:id → returns product', async () => {
    await init();
    const res = await request(fastify.server)
        .get(`/api/products/${productId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.id, productId);
});

test('PUT /api/products/:id → update product', async () => {
    await init();
    const res = await request(fastify.server)
        .put(`/api/products/${productId}`)
        .send({
            name: 'Updated phone',
            description: 'Updated',
            price: 1200,
            category: 'tech',
            inStock: false
        });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Updated phone');
});

test('DELETE /api/products/:id → delete product', async () => {
    await init();
    const res = await request(fastify.server)
        .delete(`/api/products/${productId}`);

    assert.equal(res.status, 204);
});

test('GET deleted product → 404', async () => {
    await init();
    const res = await request(fastify.server)
        .get(`/api/products/${productId}`);

    assert.equal(res.status, 404);
});