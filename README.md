# Burger Place Admin 🍔

Sistema web para gestão de uma hamburgueria, desenvolvido como parte da disciplina
**Projetos e Práticas de Extensão II**, com foco na migração de uma solução NoCode para uma aplicação web moderna em código.

---

## 🔧 Tecnologias Utilizadas

- HTML5
- CSS3 (Layout responsivo e modo escuro)
- JavaScript (Vanilla JS)
- LocalStorage
- API pública (BrasilAPI)
- PWA (Progressive Web App)
- Cypress (Testes automatizados E2E)
- GitHub Pages (Deploy)

---

## 🌐 Deploy

Acesse o sistema em produção:  
👉 https://euandremas.github.io/hamburgueria-webapp/

> O sistema pode ser instalado como aplicativo no desktop ou no celular via navegador compatível (PWA).

---

## 📱 Funcionalidades

- Login administrativo
- Dashboard com indicadores
- Gestão de produtos
- Cadastro de clientes com preenchimento automático de endereço via CEP (BrasilAPI)
- Gerenciamento de pedidos
- Alteração de status dos pedidos
- Persistência de dados com LocalStorage
- Modo escuro
- Interface totalmente responsiva
- Suporte à instalação como aplicativo (PWA)

---

## 🧪 Testes de Software (Unidade 4)

O sistema possui **testes automatizados end-to-end** desenvolvidos com **Cypress**, cobrindo os principais fluxos da aplicação, como:

- Acesso ao sistema
- Cadastro de produtos
- Cadastro de usuários
- Criação de pedidos
- Alteração de status de pedidos

Os cenários de teste estão documentados em:

📄 `docs/cenarios-de-teste.md`

---

## ▶️ Como executar o projeto localmente

```bash
npm install
npm run serve

O sistema ficará disponível em:
👉 http://localhost:8080

▶️ Como executar os testes automatizados

Abrir interface do Cypress:

npm run cy:open


Executar testes em modo headless:

npm run cy:run

📌 Status do Projeto

✅ Atividade 4 concluída — Qualidade e Testes de Software
Sistema funcional, testado e documentado, pronto para a entrega final da disciplina.

👨‍💻 Autor

André
Projeto acadêmico desenvolvido para a disciplina Projetos e Práticas de Extensão II.
```
