describe('Hamburgueria WebApp - Testes em Produção', () => {

  const baseUrl = 'https://euandremas.github.io/hamburgueria-webapp';

  it('1) Deve carregar a página inicial (index.html)', () => {
    cy.visit(`${baseUrl}/index.html`);
    cy.get('body').should('be.visible');
  });

  it('2) Deve carregar a área administrativa (admin.html)', () => {
    cy.visit(`${baseUrl}/admin.html`);
    cy.get('body').should('be.visible');
  });

  it('3) Deve disponibilizar o manifest do PWA', () => {
    cy.request(`${baseUrl}/manifest.webmanifest`)
      .its('status')
      .should('eq', 200);
  });

  it('4) Deve disponibilizar o Service Worker', () => {
    cy.request(`${baseUrl}/sw.js`)
      .its('status')
      .should('eq', 200);
  });

  it('5) Deve responder à BrasilAPI (CEP válido)', () => {
    cy.request('https://brasilapi.com.br/api/cep/v1/01001000')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('cep');
      });
  });

});
