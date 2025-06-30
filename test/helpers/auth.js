const request = require('supertest');
const app = require('../../app');

async function login(matricula, senha) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ matricula, senha });
  
  return response.body.token;
}

module.exports = { login };
