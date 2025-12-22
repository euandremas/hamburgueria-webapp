@'

# Cenários de Teste – Hamburgueria WebApp

## Cenário 1 – Acesso ao sistema

**Objetivo:** Verificar se a aplicação carrega corretamente no navegador.

**Passos:**

1. Abrir o navegador.
2. Acessar o endereço do sistema (http://localhost:8080).

**Resultado esperado:**

- A página inicial é exibida corretamente, sem erros visuais ou de carregamento.

## Cenário 2 – Cadastro de Produto

**Objetivo:** Validar se o sistema permite cadastrar um novo produto.

**Passos:**

1. Acessar a área de produtos.
2. Preencher os campos nome, preço e descrição.
3. Clicar no botão de cadastro.

**Resultado esperado:**

- O produto é exibido na lista de produtos cadastrados.

## Cenário 3 – Cadastro de Usuário

**Objetivo:** Verificar o cadastro de um novo usuário/cliente.

**Passos:**

1. Acessar a área de usuários.
2. Preencher nome, e-mail e senha.
3. Confirmar o cadastro.

**Resultado esperado:**

- O usuário é registrado e exibido corretamente no sistema.

## Cenário 4 – Criação de Pedido

**Objetivo:** Validar a criação de um pedido no sistema.

**Passos:**

1. Acessar a área de pedidos.
2. Selecionar um cliente.
3. Selecionar um ou mais produtos.
4. Confirmar o pedido.

**Resultado esperado:**

- O pedido é criado e exibido na lista de pedidos.

## Cenário 5 – Alteração de Status do Pedido

**Objetivo:** Verificar se é possível alterar o status de um pedido.

**Passos:**

1. Acessar a lista de pedidos.
2. Selecionar um pedido existente.
3. Clicar na opção de alterar status.

**Resultado esperado:**

- O status do pedido é atualizado corretamente no sistema.
  '@ | Set-Content -Encoding UTF8 "docs\cenarios-de-teste.md"
