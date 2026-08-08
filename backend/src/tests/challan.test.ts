import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

let token: string;
let customerId: string;
let productId: string;

beforeAll(async () => {
  // Login to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password123' });
  
  token = loginRes.body.token;

  // Create a customer for testing
  const customerRes = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Customer',
      mobile: '9999999999'
    });
  customerId = customerRes.body.id;
});

afterAll(async () => {
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.$disconnect();
});

describe('Challan Confirm and Cancel Service', () => {
  beforeEach(async () => {
    // Reset product before each test with 15 stock
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        sku: 'TEST-PROD-01',
        unitPrice: 100,
        currentStock: 15
      });
    productId = productRes.body.id;
  });

  it('1. Confirming with insufficient stock rejects cleanly with no partial changes', async () => {
    // Create Challan with quantity 20 (we only have 15 in stock)
    const challanRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        items: [{ productId, quantity: 20 }]
      });
    const challanId = challanRes.body.id;

    const confirmRes = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.message).toMatch(/Insufficient stock/);

    // Verify stock remains exactly 15
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(15);
    
    // Verify challan is still DRAFT
    const challan = await prisma.challan.findUnique({ where: { id: challanId } });
    expect(challan?.status).toBe('DRAFT');
  });

  it('2. Two concurrent confirms on the same product do not double-deduct stock', async () => {
    // We have 15 stock. 
    // Create Challan A (10 units)
    const challanARes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, items: [{ productId, quantity: 10 }] });
    
    // Create Challan B (10 units)
    const challanBRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, items: [{ productId, quantity: 10 }] });

    // Confirm them concurrently
    const [resA, resB] = await Promise.all([
      request(app).post(`/api/challans/${challanARes.body.id}/confirm`).set('Authorization', `Bearer ${token}`),
      request(app).post(`/api/challans/${challanBRes.body.id}/confirm`).set('Authorization', `Bearer ${token}`)
    ]);

    // One must succeed, one must fail
    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Stock should be 5, NOT -5
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(5);
  });

  it('3. Cancelling a confirmed challan correctly reverses stock', async () => {
    // Create Challan (10 units)
    const challanRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, items: [{ productId, quantity: 10 }] });
    const challanId = challanRes.body.id;

    // Confirm it
    await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    // Verify stock is 5
    let product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(5);

    // Cancel it
    const cancelRes = await request(app)
      .post(`/api/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(cancelRes.status).toBe(200);

    // Verify stock returned to 15
    product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(15);
    
    // Verify status is CANCELLED
    const challan = await prisma.challan.findUnique({ where: { id: challanId } });
    expect(challan?.status).toBe('CANCELLED');
  });
});
