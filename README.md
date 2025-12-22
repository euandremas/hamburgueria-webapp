# Burger Place Admin 🍔

Sistema web para gestão de uma hamburgueria, desenvolvido como parte da disciplina **Projetos e Práticas de Extensão II**, com foco na migração de uma solução NoCode para uma aplicação web moderna baseada em código.

---

## 🔧 Tecnologias Utilizadas

- HTML5
- CSS3 (layout responsivo e modo escuro)
- JavaScript (Vanilla JS)
- LocalStorage
- API pública (BrasilAPI)
- PWA (Progressive Web App)
- Cypress (testes automatizados end-to-end)
- GitHub Pages (deploy)

---

## 🌐 Deploy

Acesse o sistema em produção:
👉 [https://euandremas.github.io/hamburgueria-webapp/](https://euandremas.github.io/hamburgueria-webapp/)

> O sistema pode ser instalado como aplicativo no desktop ou no celular por meio de navegadores compatíveis com PWA.

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

O sistema possui **testes automatizados end-to-end** desenvolvidos com **Cypress**, cobrindo os principais fluxos da aplicação:

- Acesso ao sistema
- Cadastro de produtos
- Cadastro de usuários
- Criação de pedidos
- Alteração de status de pedidos

Os cenários de teste estão documentados no arquivo:

📄 `docs/cenarios-de-teste.md`

Os testes foram executados com sucesso tanto em ambiente local quanto em ambiente de produção (GitHub Pages), simulando o acesso real do usuário final.

---

## ▶️ Como executar o projeto localmente

Instale as dependências e inicie o servidor local:

```bash
npm install
npm run serve
```

Após a execução, o sistema ficará disponível localmente no navegador.

---

## ▶️ Como executar os testes automatizados

Abrir a interface gráfica do Cypress:

```bash
npm run cy:open
```

Executar os testes em modo headless (via terminal):

```bash
npm run cy:run
```

---

## 📌 Status do Projeto

✅ **Atividade 4 concluída — Qualidade e Testes de Software**
Sistema funcional, testado e documentado, pronto para a entrega final da disciplina.

---

## 👨‍💻 Autor

**André**
Projeto acadêmico desenvolvido para a disciplina _Projetos e Práticas de Extensão II_.
