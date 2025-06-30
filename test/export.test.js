const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { login } = require('./helpers/auth');

describe('Exportação de Vestígios', () => {
  let authToken;

  before(async function() {
    this.timeout(5000);
    authToken = await login('admin', 'admin123');
  });

  describe('Exportação em Excel', () => {
    it('Deve exportar vestígios em Excel com sucesso', async function() {
      const response = await request(app)
        .get('/api/export/vestigios/excel')
        .set('Authorization', Bearer )
        .expect(200);

      expect(response.headers['content-type']).to.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).to.match(/attachment; filename=vestigios\.xlsx/);
      expect(response.body).to.be.instanceOf(Buffer);
    });

    it('Deve rejeitar exportação sem autenticação', async () => {
      await request(app)
        .get('/api/export/vestigios/excel')
        .expect(401);
    });
  });

  describe('Exportação em PDF', () => {
    it('Deve exportar vestígios em PDF com sucesso', async function() {
      const response = await request(app)
        .get('/api/export/vestigios/pdf')
        .set('Authorization', Bearer )
        .expect(200);

      expect(response.headers['content-type']).to.equal('application/pdf');
      expect(response.headers['content-disposition']).to.match(/attachment; filename=vestigios\.pdf/);
      expect(response.body).to.be.instanceOf(Buffer);
    });

    it('Deve rejeitar exportação sem autenticação', async () => {
      await request(app)
        .get('/api/export/vestigios/pdf')
        .expect(401);
    });
  });
});
