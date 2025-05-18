const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transaction');

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

let authToken;
let userId;
let walletId;

// Connect to test database before tests
beforeAll(async () => {
  // Use a separate test database
  const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-wallet-test';
  await mongoose.connect(testDbUri);
  
  // Clear test database
  await User.deleteMany({});
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
});

// Disconnect after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication API', () => {
  test('Should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.username).toBe(testUser.username);
    
    // Save user ID for later tests
    userId = response.body.user.id;
    authToken = response.body.token;
  });
  
  test('Should login a user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    
    // Update auth token
    authToken = response.body.token;
  });
  
  test('Should get user profile', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
  });
});

describe('Wallet API', () => {
  test('Should get user wallet', async () => {
    const response = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('wallet');
    expect(response.body.wallet).toHaveProperty('balance');
    expect(response.body.wallet.balance).toBe(0);
    
    // Save wallet ID for later tests
    walletId = response.body.wallet._id;
  });
  
  test('Should deposit funds to wallet', async () => {
    const response = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        walletId,
        amount: 100,
        description: 'Test deposit'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('transaction');
    expect(response.body).toHaveProperty('newBalance');
    expect(response.body.newBalance).toBe(100);
  });
  
  test('Should withdraw funds from wallet', async () => {
    const response = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        walletId,
        amount: 50,
        description: 'Test withdrawal'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('transaction');
    expect(response.body).toHaveProperty('newBalance');
    expect(response.body.newBalance).toBe(50);
  });
  
  test('Should get transaction history', async () => {
    const response = await request(app)
      .get('/api/wallet/history')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('transactions');
    expect(response.body.transactions.length).toBe(2); // Deposit and withdrawal
  });
});

describe('Fraud Detection', () => {
  test('Should flag large withdrawal', async () => {
    // First deposit more funds
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        walletId,
        amount: 1000,
        description: 'Large deposit'
      });
    
    // Then attempt a large withdrawal (>70% of balance)
    const response = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        walletId,
        amount: 800, // 800 out of 1050 is >70%
        description: 'Large withdrawal'
      });
    
    // Should be flagged
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('flagged');
  });
});
