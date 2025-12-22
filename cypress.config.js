const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://euandremas.github.io/hamburgueria-webapp",
    setupNodeEvents(on, config) {
      // eventos do Cypress (não utilizados neste projeto)
    },
  },
});
