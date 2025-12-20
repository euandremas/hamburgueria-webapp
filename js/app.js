/* =======================
   Helpers
======================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function formatBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showAlert(msg, type = "ok") {
  const el = $("#alert");
  if (!el) return;
  el.classList.remove("is-hidden", "is-error");
  el.textContent = msg;
  if (type === "error") el.classList.add("is-error");
  window.clearTimeout(showAlert._t);
  showAlert._t = window.setTimeout(() => el.classList.add("is-hidden"), 2600);
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =======================
   Keys / State
======================= */
const KEYS = {
  produtos: "bp_produtos",
  usuarios: "bp_usuarios",
  pedidos: "bp_pedidos",
  carrinho: "bp_carrinho",
  adminSession: "bp_admin_session",
  clienteSession: "bp_cliente_session",
  theme: "bp_theme",
};

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";
const ADMIN_REAUTH_MS = 60_000; // ajuste aqui (ex: 60s). Se voltar pra loja e demorar, pede senha de novo.

let produtos = storage.get(KEYS.produtos, []);
let usuarios = storage.get(KEYS.usuarios, []);
let pedidos = storage.get(KEYS.pedidos, []);
let carrinho = storage.get(KEYS.carrinho, []);

/* =======================
   DOM refs
======================= */
const menuGrid = $("#menu-grid");
const cartBtn = $(".cart");

const cartModal = $("#cart-modal");
const cartBody = $("#cart-body");
const cartTotal = $("#cart-total");
const btnFinalizar = $("#btn-finalizar");

const clienteModal = $("#cliente-modal");
const btnCliente = $("#btn-cliente");
const btnLogoutCliente = $("#btn-logout-cliente");
const clienteLabel = $("#cliente-label");

const adminEl = $("#admin");
const btnAdmin = $("#btn-admin");
const btnVoltarLoja = $("#btn-voltar-loja");
const btnSair = $("#btn-sair");
const btnAdminClose = $("#btn-admin-close");

const adminLogin = $("#admin-login");
const adminApp = $("#admin-app");

const formAdminLogin = $("#form-login");
const loginUser = $("#login-user");
const loginSenha = $("#login-senha");
const btnEntrar = $("#btn-entrar");

const adminTabs = $$(".admin-nav__item");
const adminPages = {
  dashboard: $("#admin-dashboard"),
  produtos: $("#admin-produtos"),
  usuarios: $("#admin-usuarios"),
  pedidos: $("#admin-pedidos"),
  config: $("#admin-config"),
};

const toggleDark = $("#toggle-dark");

/* Produtos */
const formProduto = $("#form-produto");
const produtoId = $("#produto-id");
const produtoNome = $("#produto-nome");
const produtoPreco = $("#produto-preco");
const produtoCategoria = $("#produto-categoria");
const produtoDescricao = $("#produto-descricao");
const btnProdutoCancelar = $("#btn-produto-cancelar");
const listaProdutos = $("#lista-produtos");
const filtroProduto = $("#filtro-produto");
const countProdutos = $("#count-produtos");
const produtoFoto = $("#produto-foto");
const dropzone = $("#dropzone");
const produtoPreview = $("#produto-preview");

/* Usuários */
const formUsuario = $("#form-usuario");
const usuarioId = $("#usuario-id");
const usuarioNome = $("#usuario-nome");
const usuarioEmail = $("#usuario-email");
const usuarioUser = $("#usuario-user");
const usuarioSenha = $("#usuario-senha");
const usuarioTipo = $("#usuario-tipo");
const btnUsuarioCancelar = $("#btn-usuario-cancelar");
const listaUsuarios = $("#lista-usuarios");
const filtroUsuario = $("#filtro-usuario");
const countUsuarios = $("#count-usuarios");

/* Pedidos */
const formPedido = $("#form-pedido");
const pedidoUsuario = $("#pedido-usuario");
const pedidoProduto = $("#pedido-produto");
const pedidoQtd = $("#pedido-qtd");
const pedidoStatus = $("#pedido-status");
const pedidoEta = $("#pedido-eta");
const btnPedidoCancelar = $("#btn-pedido-cancelar");
const listaPedidos = $("#lista-pedidos");
const filtroPedido = $("#filtro-pedido");
const countPedidos = $("#count-pedidos");

/* Dashboard */
const kpiTotal = $("#kpi-total-pedidos");
const kpiPreparo = $("#kpi-em-preparo");
const kpiEntregues = $("#kpi-entregues");
const kpiProdutos = $("#kpi-produtos");
const atividadeRecente = $("#atividade-recente");

/* Cliente */
const clienteTabs = $$(".tab");
const clientePages = {
  login: $("#cliente-login"),
  cadastro: $("#cliente-cadastro"),
  meuspedidos: $("#cliente-meuspedidos"),
};
const formClienteLogin = $("#form-cliente-login");
const clienteLoginUser = $("#cliente-login-user");
const clienteLoginPass = $("#cliente-login-pass");

const formClienteCadastro = $("#form-cliente-cadastro");
const clienteNome = $("#cliente-nome");
const clienteUser = $("#cliente-user");
const clienteEmail = $("#cliente-email");
const clientePass = $("#cliente-pass");
const clienteNotif = $("#cliente-notif");

const meusPedidosEl = $("#meus-pedidos");

/* =======================
   Theme
======================= */
function applyTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("dark", t === "dark");
  storage.set(KEYS.theme, t);
  if (toggleDark) toggleDark.checked = t === "dark";
}

toggleDark?.addEventListener("change", () => {
  applyTheme(toggleDark.checked ? "dark" : "light");
});

/* =======================
   Admin Session
======================= */
function getAdminSession() {
  return storage.get(KEYS.adminSession, { authed: false, lastAuthAt: 0 });
}
function setAdminSession(authed) {
  storage.set(KEYS.adminSession, { authed, lastAuthAt: authed ? Date.now() : 0 });
}
function isAdminReauthNeeded() {
  const s = getAdminSession();
  if (!s.authed) return true;
  return Date.now() - (s.lastAuthAt || 0) > ADMIN_REAUTH_MS;
}

/* =======================
   Cliente Session
======================= */
function getClienteSession() {
  return storage.get(KEYS.clienteSession, { authed: false, userId: null });
}
function setClienteSession(userId) {
  storage.set(KEYS.clienteSession, { authed: !!userId, userId: userId || null });
}
function getClienteAtual() {
  const s = getClienteSession();
  if (!s.authed || !s.userId) return null;
  return usuarios.find((u) => u.id === s.userId && u.tipo === "Cliente") || null;
}

/* =======================
   UI Helpers (Admin)
======================= */
function openAdmin() {
  adminEl.classList.remove("is-hidden");
  adminEl.setAttribute("aria-hidden", "false");

  if (isAdminReauthNeeded()) {
    showAdminLoginOnly();
  } else {
    showAdminAppOnly();
  }
}

function closeAdminOverlay() {
  adminEl.classList.add("is-hidden");
  adminEl.setAttribute("aria-hidden", "true");
}

function showAdminLoginOnly() {
  adminLogin.classList.remove("is-hidden");
  adminApp.classList.add("is-hidden");
}

function showAdminAppOnly() {
  adminLogin.classList.add("is-hidden");
  adminApp.classList.remove("is-hidden");
  setAdminTab("dashboard");
  refreshAll();
}

function adminLogout() {
  setAdminSession(false);
  showAdminLoginOnly();
  if (formAdminLogin) formAdminLogin.reset();
}

function setAdminTab(tab) {
  adminTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.admin === tab));
  Object.entries(adminPages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("is-visible", k === tab);
  });
}

btnAdmin?.addEventListener("click", openAdmin);

btnVoltarLoja?.addEventListener("click", () => {
  closeAdminOverlay();
});

btnAdminClose?.addEventListener("click", () => {
  closeAdminOverlay();
});

btnSair?.addEventListener("click", () => {
  adminLogout();
});

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;

  if (t.matches("[data-admin-close]")) {
    closeAdminOverlay();
  }
  if (t.matches("[data-modal-close]")) {
    closeCart();
  }
  if (t.matches("[data-cliente-close]")) {
    closeCliente();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (adminEl && !adminEl.classList.contains("is-hidden")) closeAdminOverlay();
    if (cartModal && !cartModal.classList.contains("is-hidden")) closeCart();
    if (clienteModal && !clienteModal.classList.contains("is-hidden")) closeCliente();
  }
});

adminTabs.forEach((b) => b.addEventListener("click", () => setAdminTab(b.dataset.admin)));

/* =======================
   Admin Login
======================= */
formAdminLogin?.addEventListener("submit", (e) => {
  e.preventDefault();

  btnEntrar?.classList.add("is-loading");
  btnEntrar?.setAttribute("disabled", "true");

  const user = (loginUser?.value || "").trim();
  const pass = (loginSenha?.value || "").trim();

  window.setTimeout(() => {
    btnEntrar?.classList.remove("is-loading");
    btnEntrar?.removeAttribute("disabled");

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAdminSession(true);
      showAlert("Login admin ok ✅");
      showAdminAppOnly();
      return;
    }

    showAlert("Acesso negado ❌", "error");
  }, 1500);
});

/* =======================
   Modal Cart
======================= */
function openCart() {
  cartModal.classList.remove("is-hidden");
  cartModal.setAttribute("aria-hidden", "false");
  renderCart();
}

function closeCart() {
  cartModal.classList.add("is-hidden");
  cartModal.setAttribute("aria-hidden", "true");
}

cartBtn?.addEventListener("click", openCart);

/* =======================
   Cliente Modal
======================= */
function openCliente(tab = "login") {
  clienteModal.classList.remove("is-hidden");
  clienteModal.setAttribute("aria-hidden", "false");
  setClienteTab(tab);
  renderMeusPedidos();
}

function closeCliente() {
  clienteModal.classList.add("is-hidden");
  clienteModal.setAttribute("aria-hidden", "true");
}

function setClienteTab(tab) {
  clienteTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.ctab === tab));
  Object.entries(clientePages).forEach(([k, el]) => el.classList.toggle("is-visible", k === tab));
}

btnCliente?.addEventListener("click", () => {
  const c = getClienteAtual();
  openCliente(c ? "meuspedidos" : "login");
});

clienteTabs.forEach((b) => b.addEventListener("click", () => setClienteTab(b.dataset.ctab)));

btnLogoutCliente?.addEventListener("click", () => {
  setClienteSession(null);
  updateClienteTopbar();
  showAlert("Logout realizado ✅");
});

/* =======================
   Cliente Auth
======================= */
function saveUsuarios() {
  storage.set(KEYS.usuarios, usuarios);
}

formClienteCadastro?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = clienteNome.value.trim();
  const user = clienteUser.value.trim();
  const email = clienteEmail.value.trim();
  const pass = clientePass.value.trim();
  const notif = clienteNotif.value;

  if (!nome || !user || !email || pass.length < 4) {
    return showAlert("Preencha nome, usuário, e-mail e senha (mín. 4).", "error");
  }

  const exists = usuarios.some((u) => (u.usuario || "").toLowerCase() === user.toLowerCase());
  if (exists) return showAlert("Esse usuário já existe. Escolha outro.", "error");

  const novo = {
    id: uid(),
    nome,
    email,
    usuario: user,
    senha: pass,
    tipo: "Cliente",
    notificacao: notif,
  };

  usuarios.push(novo);
  saveUsuarios();

  setClienteSession(novo.id);
  updateClienteTopbar();
  showAlert("Cadastro ok ✅");
  setClienteTab("meuspedidos");
  renderMeusPedidos();
});

formClienteLogin?.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = (clienteLoginUser.value || "").trim().toLowerCase();
  const pass = (clienteLoginPass.value || "").trim();

  const u = usuarios.find(
    (x) => (x.usuario || "").toLowerCase() === user && x.senha === pass && x.tipo === "Cliente"
  );

  if (!u) return showAlert("Usuário ou senha inválidos.", "error");

  setClienteSession(u.id);
  updateClienteTopbar();
  showAlert("Bem-vindo ✅");
  setClienteTab("meuspedidos");
  renderMeusPedidos();
});

function updateClienteTopbar() {
  const c = getClienteAtual();
  if (!c) {
    clienteLabel.textContent = "Área do Cliente";
    btnLogoutCliente.classList.add("is-hidden");
    return;
  }
  clienteLabel.textContent = c.nome;
  btnLogoutCliente.classList.remove("is-hidden");
}

/* =======================
   Produtos / Menu
======================= */
function saveProdutos() {
  storage.set(KEYS.produtos, produtos);
}

function getProdutoById(id) {
  return produtos.find((p) => p.id === id);
}

function renderMenu() {
  if (!menuGrid) return;

  if (!produtos.length) {
    updateCartBadge();
    return;
  }

  menuGrid.innerHTML = produtos
    .map((p) => {
      const title = escapeHTML(p.nome);
      const desc = escapeHTML(p.descricao || "");
      const price = formatBRL(p.preco);
      const hasImg = !!p.foto;
      const img = hasImg
        ? `<img class="cardimg" src="${p.foto}" alt="${title}" />`
        : `<div class="card__img">🍔</div>`;

      return `
        <article class="card">
          ${img}
          <div class="card__body">
            <h3 class="card__title">${title}</h3>
            <p class="card__desc">${desc || "Sem descrição"}</p>
            <div class="card__bottom">
              <span class="card__price">${price}</span>
              <button class="btn-add" type="button" data-add="${p.id}">adicionar</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  $$("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });

  updateCartBadge();
}

function ensureCardImgStyleOnce() {
  if (document.getElementById("cardimg-style")) return;
  const st = document.createElement("style");
  st.id = "cardimg-style";
  st.textContent = `
    .cardimg{
      width:100%;
      height:140px;
      object-fit:cover;
      display:block;
    }
  `;
  document.head.appendChild(st);
}

/* =======================
   Carrinho / Checkout
======================= */
function saveCarrinho() {
  storage.set(KEYS.carrinho, carrinho);
}

function cartCount() {
  return carrinho.reduce((acc, i) => acc + (Number(i.qtd) || 0), 0);
}

function updateCartBadge() {
  if (!cartBtn) return;
  const n = cartCount();
  cartBtn.textContent = n > 0 ? `🛒 ${n}` : "🛒";
}

function addToCart(produtoId) {
  const found = carrinho.find((i) => i.produtoId === produtoId);
  if (found) found.qtd += 1;
  else carrinho.push({ produtoId, qtd: 1 });

  saveCarrinho();
  updateCartBadge();
  showAlert("Produto adicionado ✅");
}

function decFromCart(produtoId) {
  const idx = carrinho.findIndex((i) => i.produtoId === produtoId);
  if (idx === -1) return;
  carrinho[idx].qtd -= 1;
  if (carrinho[idx].qtd <= 0) carrinho.splice(idx, 1);
  saveCarrinho();
  updateCartBadge();
  renderCart();
}

function incFromCart(produtoId) {
  const found = carrinho.find((i) => i.produtoId === produtoId);
  if (!found) return;
  found.qtd += 1;
  saveCarrinho();
  updateCartBadge();
  renderCart();
}

function calcCartTotal() {
  return carrinho.reduce((sum, i) => {
    const p = getProdutoById(i.produtoId);
    return sum + (p?.preco || 0) * (i.qtd || 0);
  }, 0);
}

function renderCart() {
  if (!cartBody) return;

  if (!carrinho.length) {
    cartBody.innerHTML = `<div class="muted">Carrinho vazio por enquanto 😄</div>`;
    cartTotal.textContent = formatBRL(0);
    return;
  }

  cartBody.innerHTML = carrinho
    .map((i) => {
      const p = getProdutoById(i.produtoId);
      const nome = p ? p.nome : "Produto removido";
      const preco = p ? formatBRL(p.preco) : "-";
      return `
        <div class="cart-item">
          <div class="cart-item__left">
            <div class="cart-thumb">🍔</div>
            <div>
              <div class="cart-item__name">${escapeHTML(nome)}</div>
              <div class="cart-item__muted">${preco}</div>
            </div>
          </div>
          <div class="qty">
            <button type="button" data-dec="${i.produtoId}">-</button>
            <span>${i.qtd}</span>
            <button type="button" data-inc="${i.produtoId}">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-dec]").forEach((b) => b.addEventListener("click", () => decFromCart(b.dataset.dec)));
  $$("[data-inc]").forEach((b) => b.addEventListener("click", () => incFromCart(b.dataset.inc)));

  cartTotal.textContent = formatBRL(calcCartTotal());
}

function savePedidos() {
  storage.set(KEYS.pedidos, pedidos);
}

btnFinalizar?.addEventListener("click", () => {
  if (!carrinho.length) return showAlert("Carrinho vazio.", "error");

  const cliente = getClienteAtual();
  if (!cliente) {
    showAlert("Faça login/cadastro para finalizar 😉", "error");
    openCliente("login");
    return;
  }

  const etaMin = 25;
  const novo = {
    id: uid(),
    usuarioId: cliente.id,
    itens: carrinho.map((i) => ({ produtoId: i.produtoId, qtd: i.qtd })),
    status: "Em preparo",
    etaMin,
    criadoEm: new Date().toISOString(),
  };

  pedidos.unshift(novo);
  savePedidos();

  carrinho = [];
  saveCarrinho();
  updateCartBadge();
  renderCart();

  showAlert("Pedido enviado ✅");
  closeCart();
  openCliente("meuspedidos");
  renderMeusPedidos();
  refreshAll();
});

/* =======================
   Upload (Produtos)
======================= */
function resetProdutoForm() {
  produtoId.value = "";
  formProduto.reset();
  if (produtoPreview) {
    produtoPreview.src = "";
    produtoPreview.classList.add("is-hidden");
  }
  if (produtoFoto) produtoFoto.value = "";
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function handleProdutoFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return showAlert("Envie uma imagem válida.", "error");

  const dataUrl = await fileToDataURL(file);
  produtoPreview.src = dataUrl;
  produtoPreview.classList.remove("is-hidden");
  produtoPreview.dataset.dataurl = dataUrl;
}

produtoFoto?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  await handleProdutoFile(file);
});

dropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone?.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  await handleProdutoFile(file);
});

/* =======================
   Produtos CRUD
======================= */
function renderProdutosList() {
  if (!listaProdutos) return;

  const q = (filtroProduto?.value || "").trim().toLowerCase();
  const list = produtos.filter((p) => p.nome.toLowerCase().includes(q));

  if (countProdutos) countProdutos.textContent = String(list.length);

  listaProdutos.innerHTML = list
    .map((p) => {
      const foto = p.foto
        ? `<img class="thumb" src="${p.foto}" alt="${escapeHTML(p.nome)}" />`
        : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;">🍔</div>`;

      return `
        <tr>
          <td>${foto}</td>
          <td><strong>${escapeHTML(p.nome)}</strong></td>
          <td style="max-width:420px;color:#6b7280;">${escapeHTML(p.descricao || "")}</td>
          <td class="t-right" style="font-weight:1000;color:#0aa84f;">${formatBRL(p.preco)}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-prod="${p.id}">Editar</button>
            <button class="btn" type="button" style="background:#111;color:#fff;" data-del-prod="${p.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("[data-edit-prod]").forEach((b) => b.addEventListener("click", () => editProduto(b.dataset.editProd)));
  $$("[data-del-prod]").forEach((b) => b.addEventListener("click", () => deleteProduto(b.dataset.delProd)));
}

function editProduto(id) {
  const p = produtos.find((x) => x.id === id);
  if (!p) return;

  produtoId.value = p.id;
  produtoNome.value = p.nome;
  produtoPreco.value = p.preco;
  produtoCategoria.value = p.categoria;
  produtoDescricao.value = p.descricao || "";

  if (p.foto && produtoPreview) {
    produtoPreview.src = p.foto;
    produtoPreview.dataset.dataurl = p.foto;
    produtoPreview.classList.remove("is-hidden");
  }

  showAlert("Editando produto ✏️");
}

function deleteProduto(id) {
  const p = produtos.find((x) => x.id === id);
  if (!p) return;
  if (!confirm(`Excluir o produto "${p.nome}"?`)) return;

  produtos = produtos.filter((x) => x.id !== id);
  saveProdutos();
  renderProdutosList();
  refreshPedidoCombos();
  renderMenu();
  showAlert("Produto excluído ✅");
}

formProduto?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = produtoNome.value.trim();
  const preco = Number(produtoPreco.value);
  const categoria = produtoCategoria.value.trim();
  const descricao = produtoDescricao.value.trim();
  const foto = produtoPreview?.dataset?.dataurl || "";

  if (!nome || !categoria || Number.isNaN(preco) || preco < 0) {
    return showAlert("Preencha nome, categoria e preço corretamente.", "error");
  }

  const id = produtoId.value;

  if (id) {
    const idx = produtos.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Produto não encontrado.", "error");

    produtos[idx] = { ...produtos[idx], nome, preco, categoria, descricao, foto };
    showAlert("Produto atualizado ✅");
  } else {
    produtos.push({ id: uid(), nome, preco, categoria, descricao, foto });
    showAlert("Produto cadastrado ✅");
  }

  saveProdutos();
  resetProdutoForm();
  renderProdutosList();
  refreshPedidoCombos();
  renderMenu();
});

btnProdutoCancelar?.addEventListener("click", resetProdutoForm);
filtroProduto?.addEventListener("input", renderProdutosList);

/* =======================
   Usuários CRUD (Admin)
======================= */
function resetUsuarioForm() {
  usuarioId.value = "";
  formUsuario.reset();
}

function renderUsuariosList() {
  if (!listaUsuarios) return;

  const q = (filtroUsuario?.value || "").trim().toLowerCase();

  const list = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.usuario || "").toLowerCase().includes(q)
  );

  if (countUsuarios) countUsuarios.textContent = String(list.length);

  listaUsuarios.innerHTML = list
    .map((u) => {
      return `
        <tr>
          <td><strong>${escapeHTML(u.nome)}</strong></td>
          <td>${escapeHTML(u.email || "")}</td>
          <td>${escapeHTML(u.usuario || "")}</td>
          <td>${escapeHTML(u.tipo || "")}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-user="${u.id}">Editar</button>
            <button class="btn" type="button" style="background:#111;color:#fff;" data-del-user="${u.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("[data-edit-user]").forEach((b) => b.addEventListener("click", () => editUsuario(b.dataset.editUser)));
  $$("[data-del-user]").forEach((b) => b.addEventListener("click", () => deleteUsuario(b.dataset.delUser)));
}

function editUsuario(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;

  usuarioId.value = u.id;
  usuarioNome.value = u.nome;
  usuarioEmail.value = u.email;
  usuarioUser.value = u.usuario || "";
  usuarioSenha.value = u.senha || "";
  usuarioTipo.value = u.tipo;

  showAlert("Editando usuário ✏️");
}

function deleteUsuario(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;

  if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;

  usuarios = usuarios.filter((x) => x.id !== id);
  saveUsuarios();
  renderUsuariosList();
  refreshPedidoCombos();
  showAlert("Usuário excluído ✅");

  const sess = getClienteSession();
  if (sess.authed && sess.userId === id) {
    setClienteSession(null);
    updateClienteTopbar();
  }
}

formUsuario?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = usuarioNome.value.trim();
  const email = usuarioEmail.value.trim();
  const user = usuarioUser.value.trim();
  const pass = usuarioSenha.value.trim();
  const tipo = usuarioTipo.value;

  if (!nome || !email || !user || pass.length < 4) {
    return showAlert("Preencha nome, e-mail, usuário e senha (mín. 4).", "error");
  }

  const id = usuarioId.value;

  const conflict = usuarios.some(
    (u) => u.id !== id && (u.usuario || "").toLowerCase() === user.toLowerCase()
  );
  if (conflict) return showAlert("Usuário já existe.", "error");

  if (id) {
    const idx = usuarios.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Usuário não encontrado.", "error");

    usuarios[idx] = { ...usuarios[idx], nome, email, usuario: user, senha: pass, tipo };
    showAlert("Usuário atualizado ✅");
  } else {
    usuarios.push({ id: uid(), nome, email, usuario: user, senha: pass, tipo });
    showAlert("Usuário cadastrado ✅");
  }

  saveUsuarios();
  resetUsuarioForm();
  renderUsuariosList();
  refreshPedidoCombos();
});

btnUsuarioCancelar?.addEventListener("click", resetUsuarioForm);
filtroUsuario?.addEventListener("input", renderUsuariosList);

/* =======================
   Pedidos CRUD / Status / ETA
======================= */
function refreshPedidoCombos() {
  if (pedidoUsuario) {
    pedidoUsuario.innerHTML =
      `<option value="">Selecione um cliente</option>` +
      usuarios
        .filter((u) => u.tipo === "Cliente")
        .map((u) => `<option value="${u.id}">${escapeHTML(u.nome)}</option>`)
        .join("");
  }

  if (pedidoProduto) {
    pedidoProduto.innerHTML =
      `<option value="">Selecione um produto</option>` +
      produtos
        .map((p) => `<option value="${p.id}">${escapeHTML(p.nome)} — ${formatBRL(p.preco)}</option>`)
        .join("");
  }
}

function badgeFor(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("entregue")) return { cls: "ok", text: "Entregue", ico: "✅" };
  if (s.includes("caminho")) return { cls: "warn", text: "A caminho", ico: "🕒" };
  return { cls: "info", text: "Em preparo", ico: "🕒" };
}

function renderPedidosList() {
  if (!listaPedidos) return;

  const q = (filtroPedido?.value || "").trim().toLowerCase();

  const list = pedidos.filter((p) => {
    const u = usuarios.find((x) => x.id === p.usuarioId);
    const userName = (u?.nome || "").toLowerCase();
    const st = (p.status || "").toLowerCase();
    return userName.includes(q) || st.includes(q);
  });

  if (countPedidos) countPedidos.textContent = String(list.length);

  listaPedidos.innerHTML = list
    .map((p) => {
      const u = usuarios.find((x) => x.id === p.usuarioId);
      const userName = u?.nome || "Usuário removido";

      const b = badgeFor(p.status);

      const itensTxt = (p.itens || [])
        .map((it) => {
          const prod = produtos.find((x) => x.id === it.produtoId);
          return `${it.qtd}x ${prod?.nome || "Produto removido"}`;
        })
        .join("<br/>");

      const criado = new Date(p.criadoEm).toLocaleString("pt-BR");
      const eta = Number(p.etaMin || 0);

      return `
        <div class="order">
          <div class="order__top">
            <div>
              <strong>Pedido ${escapeHTML(p.id.slice(-4))}</strong>
              <div class="order__meta">Cliente: ${escapeHTML(userName)} • ${criado}</div>
            </div>
            <span class="badge ${b.cls}">${b.ico} ${b.text}</span>
          </div>

          <div class="order__items">
            <div style="color:#6b7280;font-weight:900;margin-bottom:6px;">Produtos:</div>
            ${itensTxt || "<span class='muted'>Sem itens</span>"}
            <div style="margin-top:8px;color:#6b7280;">Tempo estimado: <strong>${eta} min</strong></div>
          </div>

          <div class="order__actions">
            <select data-st="${p.id}">
              <option ${p.status === "Em preparo" ? "selected" : ""}>Em preparo</option>
              <option ${p.status === "A caminho" ? "selected" : ""}>A caminho</option>
              <option ${p.status === "Entregue" ? "selected" : ""}>Entregue</option>
            </select>
            <input type="number" min="1" value="${eta || 25}" data-eta="${p.id}" />
            <button class="btn btn--primary" type="button" data-save-order="${p.id}">Salvar</button>
            <button class="btn" type="button" style="background:#111;color:#fff;" data-del-order="${p.id}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-save-order]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.saveOrder;
      const stEl = document.querySelector(`[data-st="${id}"]`);
      const etaEl = document.querySelector(`[data-eta="${id}"]`);
      const status = stEl?.value || "Em preparo";
      const eta = Number(etaEl?.value || 25);
      updatePedido(id, status, eta);
    })
  );

  $$("[data-del-order]").forEach((b) =>
    b.addEventListener("click", () => deletePedido(b.dataset.delOrder))
  );
}

function updatePedido(id, status, etaMin) {
  const idx = pedidos.findIndex((x) => x.id === id);
  if (idx === -1) return;

  pedidos[idx].status = status;
  pedidos[idx].etaMin = Number.isFinite(etaMin) && etaMin > 0 ? etaMin : 25;

  savePedidos();
  renderPedidosList();
  renderAtividadeRecente();
  renderMeusPedidos();

  if (String(status).toLowerCase().includes("entregue")) {
    const u = usuarios.find((x) => x.id === pedidos[idx].usuarioId);
    const pref = u?.notificacao || "webapp";
    showAlert(`Pedido atualizado ✅ (notificação: ${pref})`);
  } else {
    showAlert("Pedido atualizado ✅");
  }
}

function deletePedido(id) {
  if (!confirm("Excluir este pedido?")) return;
  pedidos = pedidos.filter((x) => x.id !== id);
  savePedidos();
  renderPedidosList();
  renderAtividadeRecente();
  renderMeusPedidos();
  showAlert("Pedido excluído ✅");
}

formPedido?.addEventListener("submit", (e) => {
  e.preventDefault();

  const usuarioId = pedidoUsuario.value;
  const produtoId = pedidoProduto.value;
  const qtd = Number(pedidoQtd.value);
  const status = pedidoStatus.value;
  const etaMin = Number(pedidoEta.value);

  if (!usuarioId || !produtoId || Number.isNaN(qtd) || qtd < 1) {
    return showAlert("Selecione cliente, produto e quantidade válida.", "error");
  }

  pedidos.unshift({
    id: uid(),
    usuarioId,
    itens: [{ produtoId, qtd }],
    status,
    etaMin: Number.isFinite(etaMin) && etaMin > 0 ? etaMin : 25,
    criadoEm: new Date().toISOString(),
  });

  savePedidos();
  formPedido.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;

  renderPedidosList();
  renderAtividadeRecente();
  showAlert("Pedido criado ✅");
});

btnPedidoCancelar?.addEventListener("click", () => {
  formPedido.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;
});

filtroPedido?.addEventListener("input", renderPedidosList);

/* =======================
   Dashboard
======================= */
function renderKPIs() {
  if (!kpiTotal) return;

  const total = pedidos.length;
  const em = pedidos.filter((p) => (p.status || "").toLowerCase().includes("preparo")).length;
  const ent = pedidos.filter((p) => (p.status || "").toLowerCase().includes("entregue")).length;

  kpiTotal.textContent = String(total);
  kpiPreparo.textContent = String(em);
  kpiEntregues.textContent = String(ent);
  kpiProdutos.textContent = String(produtos.length);
}

function renderAtividadeRecente() {
  if (!atividadeRecente) return;

  const recent = pedidos.slice(0, 6);

  atividadeRecente.innerHTML = recent
    .map((p) => {
      const u = usuarios.find((x) => x.id === p.usuarioId);
      const b = badgeFor(p.status);

      const title = `Pedido ${escapeHTML(p.id.slice(-4))} ${b.text}`;
      const sub = `Cliente: ${escapeHTML(u?.nome || "—")} • ${new Date(p.criadoEm).toLocaleString("pt-BR")}`;

      const icoCls = b.cls === "ok" ? "ok" : b.cls === "warn" ? "warn" : "info";
      const ico = b.cls === "ok" ? "✓" : b.cls === "warn" ? "⏱" : "🛒";

      return `
        <div class="activity-item">
          <div class="activity-ico ${icoCls}">${ico}</div>
          <div class="activity-text">
            <strong>${title}</strong>
            <small>${sub}</small>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Cliente - Meus Pedidos
======================= */
function renderMeusPedidos() {
  if (!meusPedidosEl) return;

  const cliente = getClienteAtual();
  if (!cliente) {
    meusPedidosEl.innerHTML = `<div class="muted">Faça login para ver seus pedidos.</div>`;
    return;
  }

  const meus = pedidos.filter((p) => p.usuarioId === cliente.id);

  if (!meus.length) {
    meusPedidosEl.innerHTML = `<div class="muted">Você ainda não tem pedidos 😄</div>`;
    return;
  }

  meusPedidosEl.innerHTML = meus
    .map((p) => {
      const b = badgeFor(p.status);
      const criado = new Date(p.criadoEm);
      const etaMin = Number(p.etaMin || 25);

      const prontoEm = new Date(criado.getTime() + etaMin * 60_000);
      const agora = new Date();
      const restMs = Math.max(0, prontoEm.getTime() - agora.getTime());
      const restMin = Math.ceil(restMs / 60_000);

      const etaText =
        b.text === "Entregue" ? "Pedido concluído ✅" : `Estimativa: ~${restMin} min`;

      const itensTxt = (p.itens || [])
        .map((it) => {
          const prod = produtos.find((x) => x.id === it.produtoId);
          return `${it.qtd}x ${prod?.nome || "Produto"}`;
        })
        .join(" • ");

      return `
        <div class="order">
          <div class="order__top">
            <div>
              <strong>Pedido ${escapeHTML(p.id.slice(-4))}</strong>
              <div class="order__meta">${criado.toLocaleString("pt-BR")}</div>
            </div>
            <span class="badge ${b.cls}">${b.ico} ${b.text}</span>
          </div>
          <div class="order__items">
            <div style="margin-top:6px;color:#6b7280;">${escapeHTML(itensTxt)}</div>
            <div style="margin-top:10px;font-weight:1000;">${etaText}</div>
            <div style="margin-top:8px;color:#6b7280;">Notificação: <strong>${escapeHTML(cliente.notificacao || "webapp")}</strong></div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Seed (para agilizar)
======================= */
function seedIfEmpty() {
  if (!produtos.length) {
    produtos = [
      { id: uid(), nome: "X-Bacon", preco: 25.9, categoria: "Lanches", descricao: "Hambúrguer, bacon crocante, cheddar, alface e tomate", foto: "" },
      { id: uid(), nome: "X-Burger Especial", preco: 32.9, categoria: "Lanches", descricao: "180g artesanal, queijo suíço, cebola caramelizada e molho especial", foto: "" },
      { id: uid(), nome: "X-Salada", preco: 22.9, categoria: "Lanches", descricao: "Hambúrguer, queijo, alface, tomate, cebola e maionese", foto: "" },
    ];
    saveProdutos();
  }

  if (!usuarios.length) {
    usuarios = [
      { id: uid(), nome: "Ana Silva", email: "ana@email.com", usuario: "ana", senha: "1234", tipo: "Cliente", notificacao: "webapp" },
      { id: uid(), nome: "Pedro Santos", email: "pedro@email.com", usuario: "pedro", senha: "1234", tipo: "Cliente", notificacao: "whatsapp" },
    ];
    saveUsuarios();
  }

  if (!pedidos.length) {
    pedidos = [
      {
        id: uid(),
        usuarioId: usuarios[0].id,
        itens: [{ produtoId: produtos[0].id, qtd: 1 }],
        status: "Entregue",
        etaMin: 25,
        criadoEm: new Date(Date.now() - 20 * 60_000).toISOString(),
      },
      {
        id: uid(),
        usuarioId: usuarios[1].id,
        itens: [{ produtoId: produtos[1].id, qtd: 1 }],
        status: "Em preparo",
        etaMin: 30,
        criadoEm: new Date().toISOString(),
      },
    ];
    savePedidos();
  }
}

/* =======================
   Boot
======================= */
function refreshAll() {
  renderProdutosList();
  renderUsuariosList();
  refreshPedidoCombos();
  renderPedidosList();
  renderKPIs();
  renderAtividadeRecente();
  renderMenu();
  renderMeusPedidos();
  updateCartBadge();
}

function init() {
  ensureCardImgStyleOnce();
  seedIfEmpty();

  const theme = storage.get(KEYS.theme, "light");
  applyTheme(theme);

  setAdminTab("dashboard");
  updateClienteTopbar();
  refreshAll();
}

init();
