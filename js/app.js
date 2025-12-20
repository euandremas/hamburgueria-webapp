/* =========================================================
   BurgerPlace / BurgerAdmin
   Stack: HTML + CSS + JavaScript (sem framework)
   Persistência: localStorage
========================================================= */

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
  del(key) {
    localStorage.removeItem(key);
  },
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function formatBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

/* =======================
   Keys / State
======================= */
const KEYS = {
  produtos: "bp_produtos",
  usuarios: "bp_usuarios",
  pedidos: "bp_pedidos",
  carrinho: "bp_carrinho",
  clienteAtual: "bp_cliente_atual",
  adminSessionUntil: "bp_admin_until",
  themeDark: "bp_theme_dark",
};

let produtos = storage.get(KEYS.produtos, []);
let usuarios = storage.get(KEYS.usuarios, []);
let pedidos = storage.get(KEYS.pedidos, []);
let carrinho = storage.get(KEYS.carrinho, []); // [{produtoId,qtd}]

/* =======================
   DOM refs (Loja)
======================= */
const menuGrid = $("#menu-grid");
const cartBtn = $(".cart");
const btnFinalizar = $("#btn-finalizar");

const cartModal = $("#cart-modal");
const cartBody = $("#cart-body");
const cartTotal = $("#cart-total");

/* =======================
   DOM refs (Cliente)
======================= */
const btnCliente = $("#btn-cliente");
const btnLogoutCliente = $("#btn-logout-cliente");
const clienteLabel = $("#cliente-label");

const clienteModal = $("#cliente-modal");
const clienteTabs = $$("[data-ctab]");
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
   DOM refs (Admin)
======================= */
const btnAdmin = $("#btn-admin");
const adminEl = $("#admin");
const btnAdminClose = $("#btn-admin-close");
const btnVoltarLoja = $("#btn-voltar-loja");
const btnSair = $("#btn-sair");

const adminLogin = $("#admin-login");
const adminApp = $("#admin-app");
const adminTabs = $$(".admin-nav__item");

const formAdminLogin = $("#form-login");
const loginUser = $("#login-user");
const loginSenha = $("#login-senha");
const btnEntrar = $("#btn-entrar");

const adminPages = {
  dashboard: $("#admin-dashboard"),
  produtos: $("#admin-produtos"),
  usuarios: $("#admin-usuarios"),
  pedidos: $("#admin-pedidos"),
  config: $("#admin-config"),
};

// Admin Produtos
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
const produtoPreview = $("#produto-preview");
const dropzone = $("#dropzone");

// Admin Usuários
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

// Admin Pedidos
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

// Dashboard
const kpiTotalPedidos = $("#kpi-total-pedidos");
const kpiEmPreparo = $("#kpi-em-preparo");
const kpiEntregues = $("#kpi-entregues");
const kpiProdutos = $("#kpi-produtos");
const atividadeRecenteEl = $("#atividade-recente");

// Config
const toggleDark = $("#toggle-dark");

/* =======================
   Auth (Cliente/Admin)
======================= */
function getClienteAtual() {
  return storage.get(KEYS.clienteAtual, null);
}
function setClienteAtual(clienteOrNull) {
  storage.set(KEYS.clienteAtual, clienteOrNull);
}
function logoutCliente() {
  setClienteAtual(null);
  syncUserbox();
  syncClienteTabsVisibility();
  renderMeusPedidos();
  showAlert("Você saiu da área do cliente 👋");
}

function isAdminSessionValid() {
  const until = storage.get(KEYS.adminSessionUntil, 0);
  return Number(until) > Date.now();
}
function setAdminSession(ttlMs) {
  storage.set(KEYS.adminSessionUntil, Date.now() + ttlMs);
}
function clearAdminSession() {
  storage.set(KEYS.adminSessionUntil, 0);
}

/* =======================
   Theme (Dark Mode)
======================= */
function applyThemeFromStorage() {
  const isDark = !!storage.get(KEYS.themeDark, false);

  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("is-dark", isDark);

  if (toggleDark) toggleDark.checked = isDark;
}
function setTheme(isDark) {
  storage.set(KEYS.themeDark, !!isDark);
  applyThemeFromStorage();
}

/* =======================
   Modals (genéricos)
======================= */
function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("is-hidden");
  modalEl.setAttribute("aria-hidden", "false");
}
function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("is-hidden");
  modalEl.setAttribute("aria-hidden", "true");
}

function wireModalCloseByDataset(rootEl, datasetKey, handlerClose) {
  if (!rootEl) return;

  rootEl.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.matches(`[${datasetKey}]`) || t.closest(`[${datasetKey}]`)) {
      handlerClose();
    }
  });
}

/* =======================
   Loja: Produtos / Menu
======================= */
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
      const imgHTML = p.foto
        ? `<img class="card__photo" src="${p.foto}" alt="${title}" />`
        : `<div class="card__img">🍔</div>`;

      return `
        <article class="card">
          ${imgHTML}
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

/* =======================
   Carrinho
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
  const p = getProdutoById(produtoId);
  if (!p) return showAlert("Produto não encontrado.", "error");

  const found = carrinho.find((i) => i.produtoId === produtoId);
  if (found) found.qtd += 1;
  else carrinho.push({ produtoId, qtd: 1 });

  saveCarrinho();
  updateCartBadge();
  showAlert("Adicionado ao carrinho ✅");
}

function removeFromCart(produtoId) {
  carrinho = carrinho.filter((i) => i.produtoId !== produtoId);
  saveCarrinho();
  renderCart();
  updateCartBadge();
}

function setCartQty(produtoId, qtd) {
  const it = carrinho.find((i) => i.produtoId === produtoId);
  if (!it) return;
  it.qtd = Math.max(1, Number(qtd) || 1);
  saveCarrinho();
  renderCart();
  updateCartBadge();
}

function calcCartTotal() {
  return carrinho.reduce((acc, i) => {
    const p = getProdutoById(i.produtoId);
    const price = Number(p?.preco || 0);
    return acc + price * (Number(i.qtd) || 1);
  }, 0);
}

function renderCart() {
  if (!cartBody || !cartTotal) return;

  if (!carrinho.length) {
    cartBody.innerHTML = `<p class="muted">Carrinho vazio por enquanto 😄</p>`;
    cartTotal.textContent = formatBRL(0);
    return;
  }

  cartBody.innerHTML = carrinho
    .map((i) => {
      const p = getProdutoById(i.produtoId);
      const nome = escapeHTML(p?.nome || "Produto removido");
      const price = formatBRL(p?.preco || 0);
      return `
        <div class="cart-item">
          <div class="cart-item__main">
            <strong>${nome}</strong>
            <div class="muted">${price}</div>
          </div>

          <div class="cart-item__actions">
            <input class="qty" type="number" min="1" value="${i.qtd}" data-qty="${i.produtoId}" />
            <button class="btn btn--ghost" type="button" data-remove="${i.produtoId}">Remover</button>
          </div>
        </div>
      `;
    })
    .join("");

  cartTotal.textContent = formatBRL(calcCartTotal());

  $$("[data-remove]").forEach((b) => {
    b.addEventListener("click", () => removeFromCart(b.dataset.remove));
  });
  $$("[data-qty]").forEach((inp) => {
    inp.addEventListener("change", () => setCartQty(inp.dataset.qty, inp.value));
  });
}

function openCart() {
  renderCart();
  openModal(cartModal);
}

function closeCart() {
  closeModal(cartModal);
}

/* =======================
   Cliente UI
======================= */
function setClienteTab(tab) {
  clienteTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.ctab === tab));
  Object.entries(clientePages).forEach(([k, el]) => el?.classList.toggle("is-visible", k === tab));
}

function syncUserbox() {
  const c = getClienteAtual();
  if (!clienteLabel || !btnLogoutCliente) return;

  if (c) {
    clienteLabel.textContent = c.nome || c.user || "Cliente";
    btnLogoutCliente.classList.remove("is-hidden");
  } else {
    clienteLabel.textContent = "Área do Cliente";
    btnLogoutCliente.classList.add("is-hidden");
  }
}

function syncClienteTabsVisibility() {
  const c = getClienteAtual();

  const tabLogin = document.querySelector('[data-ctab="login"]');
  const tabCadastro = document.querySelector('[data-ctab="cadastro"]');
  const tabMeus = document.querySelector('[data-ctab="meuspedidos"]');

  if (!tabLogin || !tabCadastro || !tabMeus) return;

  if (c) {
    tabLogin.classList.add("is-hidden");

    if (clientePages.login?.classList.contains("is-visible")) {
      setClienteTab("meuspedidos");
    }
  } else {
    tabLogin.classList.remove("is-hidden");
  }
}

function openCliente(tab = "login") {
  openModal(clienteModal);
  syncClienteTabsVisibility();
  setClienteTab(tab);
  renderMeusPedidos();
}

function closeCliente() {
  closeModal(clienteModal);
}

/* =======================
   Usuários (Admin) + Clientes
======================= */
function saveUsuarios() {
  storage.set(KEYS.usuarios, usuarios);
}

function findUserByLogin(user, senha, tipo) {
  const u = String(user || "").trim().toLowerCase();
  const s = String(senha || "");
  return usuarios.find(
    (x) =>
      String(x.user || "").toLowerCase() === u &&
      String(x.senha || "") === s &&
      (tipo ? x.tipo === tipo : true)
  );
}

function ensureAdminSeed() {
  const exists = usuarios.some((u) => u.tipo === "Administrador" && String(u.user).toLowerCase() === "admin");
  if (exists) return;

  usuarios.push({
    id: uid(),
    nome: "Administrador",
    email: "admin@local",
    user: "admin",
    senha: "admin",
    tipo: "Administrador",
  });
  saveUsuarios();
}

/* =======================
   Pedidos (Cliente/Admin)
======================= */
function savePedidos() {
  storage.set(KEYS.pedidos, pedidos);
}

function humanStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("entregue")) return "Entregue";
  if (v.includes("caminho")) return "A caminho";
  return "Em preparo";
}

function renderMeusPedidos() {
  if (!meusPedidosEl) return;

  const c = getClienteAtual();
  if (!c) {
    meusPedidosEl.innerHTML = `<p class="muted">Entre na sua conta para ver seus pedidos.</p>`;
    return;
  }

  const meus = pedidos
    .filter((p) => p.clienteId === c.id)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  if (!meus.length) {
    meusPedidosEl.innerHTML = `<p class="muted">Você ainda não fez pedidos.</p>`;
    return;
  }

  meusPedidosEl.innerHTML = meus
    .map((p) => {
      const itens = (p.itens || [])
        .map((it) => {
          const prod = getProdutoById(it.produtoId);
          return `${it.qtd}x ${escapeHTML(prod?.nome || "Item")}`;
        })
        .join(" • ");

      const st = humanStatus(p.status);
      const eta = Number(p.etaMin || 0) ? `~${p.etaMin} min` : "—";
      const notif = escapeHTML(p.notif || "webapp");

      return `
        <div class="order-client">
          <div class="order-client__top">
            <strong>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))}</strong>
            <span class="badge">${st}</span>
          </div>
          <div class="muted">${new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
          <div class="order-client__items">${escapeHTML(itens)}</div>
          <div class="order-client__meta">
            <div><strong>Estimativa:</strong> ${escapeHTML(eta)}</div>
            <div class="muted">Notificação: <strong>${notif}</strong></div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Admin UI (overlay + tabs)
======================= */
function openAdmin() {
  openModal(adminEl);

  if (isAdminSessionValid()) {
    showAdminApp();
  } else {
    showAdminLogin();
  }
}

function closeAdmin() {
  closeModal(adminEl);
}

function showAdminLogin() {
  adminLogin?.classList.remove("is-hidden");
  adminApp?.classList.add("is-hidden");
  setAdminTab("dashboard");
}

function showAdminApp() {
  adminLogin?.classList.add("is-hidden");
  adminApp?.classList.remove("is-hidden");
  setAdminTab("dashboard");
  refreshAllAdmin();
}

function setAdminTab(tab) {
  adminTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.admin === tab));
  Object.entries(adminPages).forEach(([k, el]) => el?.classList.toggle("is-visible", k === tab));
}

/* =======================
   Admin: Produtos CRUD
======================= */
function saveProdutos() {
  storage.set(KEYS.produtos, produtos);
}

function resetProdutoForm() {
  produtoId.value = "";
  formProduto?.reset();

  if (produtoPreview) {
    produtoPreview.src = "";
    produtoPreview.classList.add("is-hidden");
  }
  if (produtoFoto) produtoFoto.value = "";
}

function renderProdutosList() {
  if (!listaProdutos) return;

  const q = (filtroProduto?.value || "").trim().toLowerCase();
  const list = produtos.filter((p) => String(p.nome || "").toLowerCase().includes(q));

  if (countProdutos) countProdutos.textContent = String(list.length);

  listaProdutos.innerHTML = list
    .map((p) => {
      const foto = p.foto
        ? `<img class="thumb" src="${p.foto}" alt="${escapeHTML(p.nome)}" />`
        : `<span class="thumb thumb--empty">🍔</span>`;

      return `
        <tr>
          <td>${foto}</td>
          <td><strong>${escapeHTML(p.nome)}</strong></td>
          <td class="muted">${escapeHTML(p.descricao || "")}</td>
          <td class="t-right"><strong style="color:#0aa84f;">${formatBRL(p.preco)}</strong></td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-prod="${p.id}">Editar</button>
            <button class="btn" type="button" style="background:#111;" data-del-prod="${p.id}">Excluir</button>
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
  produtoCategoria.value = p.categoria || "";
  produtoDescricao.value = p.descricao || "";

  if (produtoPreview) {
    if (p.foto) {
      produtoPreview.src = p.foto;
      produtoPreview.classList.remove("is-hidden");
    } else {
      produtoPreview.src = "";
      produtoPreview.classList.add("is-hidden");
    }
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

async function fileToDataURL(file) {
  const f = file instanceof File ? file : null;
  if (!f) return null;

  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

async function handleProdutoFotoFile(file) {
  if (!produtoPreview) return;

  if (!file) {
    produtoPreview.src = "";
    produtoPreview.classList.add("is-hidden");
    return;
  }

  if (!String(file.type || "").startsWith("image/")) {
    showAlert("Envie uma imagem válida.", "error");
    return;
  }

  const dataUrl = await fileToDataURL(file);
  produtoPreview.src = dataUrl;
  produtoPreview.classList.remove("is-hidden");
}

function wireDropzone() {
  if (!dropzone || !produtoFoto) return;

  produtoFoto.addEventListener("change", async () => {
    const file = produtoFoto.files?.[0];
    await handleProdutoFotoFile(file);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const dt = new DataTransfer();
    dt.items.add(file);
    produtoFoto.files = dt.files;

    await handleProdutoFotoFile(file);
  });
}

formProduto?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = produtoNome.value.trim();
  const preco = Number(produtoPreco.value);
  const categoria = produtoCategoria.value.trim();
  const descricao = produtoDescricao.value.trim();

  if (!nome || !categoria || Number.isNaN(preco) || preco < 0) {
    return showAlert("Preencha nome, categoria e preço corretamente.", "error");
  }

  const id = produtoId.value;
  const file = produtoFoto?.files?.[0] || null;
  const foto = file ? await fileToDataURL(file) : null;

  if (id) {
    const idx = produtos.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Produto não encontrado.", "error");

    produtos[idx] = {
      ...produtos[idx],
      nome,
      preco,
      categoria,
      descricao,
      foto: foto ?? produtos[idx].foto ?? null,
    };
    showAlert("Produto atualizado ✅");
  } else {
    produtos.push({ id: uid(), nome, preco, categoria, descricao, foto: foto ?? null });
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
   Admin: Usuários CRUD
======================= */
function resetUsuarioForm() {
  usuarioId.value = "";
  formUsuario?.reset();
}

function renderUsuariosList() {
  if (!listaUsuarios) return;

  const q = (filtroUsuario?.value || "").trim().toLowerCase();
  const list = usuarios.filter((u) => {
    const nome = String(u.nome || "").toLowerCase();
    const email = String(u.email || "").toLowerCase();
    const user = String(u.user || "").toLowerCase();
    return nome.includes(q) || email.includes(q) || user.includes(q);
  });

  if (countUsuarios) countUsuarios.textContent = String(list.length);

  listaUsuarios.innerHTML = list
    .map((u) => {
      return `
        <tr>
          <td><strong>${escapeHTML(u.nome)}</strong></td>
          <td class="muted">${escapeHTML(u.email)}</td>
          <td>${escapeHTML(u.user)}</td>
          <td>${escapeHTML(u.tipo)}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-user="${u.id}">Editar</button>
            <button class="btn" type="button" style="background:#111;" data-del-user="${u.id}">Excluir</button>
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
  usuarioUser.value = u.user || "";
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
}

formUsuario?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = usuarioNome.value.trim();
  const email = usuarioEmail.value.trim();
  const user = usuarioUser.value.trim();
  const senha = usuarioSenha.value;

  if (!nome || !email || !user || !senha || senha.length < 4) {
    return showAlert("Preencha os campos (senha mínimo 4).", "error");
  }

  const tipo = usuarioTipo.value;
  const id = usuarioId.value;

  const userLower = user.toLowerCase();
  const userConflict = usuarios.some((x) => x.id !== id && String(x.user || "").toLowerCase() === userLower);
  if (userConflict) return showAlert("Usuário (login) já existe.", "error");

  if (id) {
    const idx = usuarios.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Usuário não encontrado.", "error");

    usuarios[idx] = { ...usuarios[idx], nome, email, user, senha, tipo };
    showAlert("Usuário atualizado ✅");
  } else {
    usuarios.push({ id: uid(), nome, email, user, senha, tipo });
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
   Admin: Pedidos CRUD + Status
======================= */
function refreshPedidoCombos() {
  if (pedidoUsuario) {
    const clientes = usuarios.filter((u) => u.tipo === "Cliente");
    pedidoUsuario.innerHTML =
      `<option value="">Selecione um cliente</option>` +
      clientes.map((u) => `<option value="${u.id}">${escapeHTML(u.nome)}</option>`).join("");
  }

  if (pedidoProduto) {
    pedidoProduto.innerHTML =
      `<option value="">Selecione um produto</option>` +
      produtos.map((p) => `<option value="${p.id}">${escapeHTML(p.nome)} — ${formatBRL(p.preco)}</option>`).join("");
  }
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("entregue")) return `<span class="badge badge--ok">Entregue</span>`;
  if (s.includes("caminho")) return `<span class="badge badge--warn">A caminho</span>`;
  return `<span class="badge">Em preparo</span>`;
}

function renderPedidosList() {
  if (!listaPedidos) return;

  const q = (filtroPedido?.value || "").trim().toLowerCase();

  const list = pedidos
    .filter((p) => {
      const u = usuarios.find((x) => x.id === p.clienteId);
      const userName = String(u?.nome || "").toLowerCase();
      const st = String(p.status || "").toLowerCase();
      return userName.includes(q) || st.includes(q);
    })
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  if (countPedidos) countPedidos.textContent = String(list.length);

  listaPedidos.innerHTML = list
    .map((p) => {
      const u = usuarios.find((x) => x.id === p.clienteId);
      const userName = u?.nome || "Cliente removido";

      const itensTxt = (p.itens || [])
        .map((it) => {
          const prod = produtos.find((x) => x.id === it.produtoId);
          const prodName = prod?.nome || "Produto removido";
          return `${it.qtd}x ${escapeHTML(prodName)}`;
        })
        .join("<br/>");

      const total = Number(p.total || 0);
      const eta = Number(p.etaMin || 0) || 0;

      return `
        <div class="order">
          <div class="order__top">
            <div>
              <strong>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))}</strong>
              <div class="muted" style="margin-top:4px;">Cliente: ${escapeHTML(userName)}</div>
            </div>
            <div class="t-right">
              <div style="color:#0aa84f;font-weight:900;">${formatBRL(total)}</div>
              <div class="muted">${new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
            </div>
          </div>

          <div class="order__mid">
            <div class="muted">Produtos:</div>
            <div>${itensTxt || "<span class='muted'>—</span>"}</div>
          </div>

          <div class="order__bottom">
            <div class="order__meta">
              ${statusBadge(p.status)}
              <span class="muted">ETA: <strong>${eta ? `~${eta} min` : "—"}</strong></span>
              <span class="muted">Notif: <strong>${escapeHTML(p.notif || "webapp")}</strong></span>
            </div>

            <div class="order__actions">
              <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Em preparo">Em preparo</button>
              <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="A caminho">A caminho</button>
              <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Entregue">Entregue</button>

              <input class="eta" type="number" min="1" value="${eta || 25}" data-eta="${p.id}" title="Tempo estimado (min)" />

              <button class="btn" type="button" style="background:#111;" data-del-order="${p.id}">Excluir</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-st]").forEach((b) =>
    b.addEventListener("click", () => updatePedidoStatus(b.dataset.st, b.dataset.new))
  );
  $$("[data-del-order]").forEach((b) => b.addEventListener("click", () => deletePedido(b.dataset.delOrder)));
  $$("[data-eta]").forEach((inp) =>
    inp.addEventListener("change", () => updatePedidoEta(inp.dataset.eta, inp.value))
  );
}

function updatePedidoStatus(id, status) {
  const idx = pedidos.findIndex((x) => x.id === id);
  if (idx === -1) return;

  pedidos[idx].status = status;
  savePedidos();
  renderPedidosList();
  renderDashboard();
  renderMeusPedidos();

  showAlert("Status do pedido atualizado ✅");

  const p = pedidos[idx];
  if (String(status).toLowerCase().includes("entregue")) {
    if ((p.notif || "").toLowerCase() === "whatsapp") {
      showAlert("Notificação (WhatsApp) simulada ✅");
    }
  }
}

function updatePedidoEta(id, etaMin) {
  const idx = pedidos.findIndex((x) => x.id === id);
  if (idx === -1) return;

  const n = Math.max(1, Number(etaMin) || 25);
  pedidos[idx].etaMin = n;

  savePedidos();
  renderPedidosList();
  renderMeusPedidos();
  showAlert("ETA atualizado ✅");
}

function deletePedido(id) {
  if (!confirm("Excluir este pedido?")) return;
  pedidos = pedidos.filter((x) => x.id !== id);
  savePedidos();
  renderPedidosList();
  renderDashboard();
  renderMeusPedidos();
  showAlert("Pedido excluído ✅");
}

function resetPedidoForm() {
  formPedido?.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;
}

formPedido?.addEventListener("submit", (e) => {
  e.preventDefault();

  const clienteId = pedidoUsuario.value;
  const produtoId = pedidoProduto.value;
  const qtd = Math.max(1, Number(pedidoQtd.value) || 1);
  const status = pedidoStatus.value;
  const etaMin = Math.max(1, Number(pedidoEta.value) || 25);

  if (!clienteId || !produtoId) return showAlert("Selecione cliente e produto.", "error");

  const prod = produtos.find((x) => x.id === produtoId);
  const total = (Number(prod?.preco || 0) || 0) * qtd;

  const cliente = usuarios.find((x) => x.id === clienteId);
  const notif = cliente?.notif || "webapp";

  pedidos.push({
    id: uid(),
    codigo: uid().slice(-4),
    clienteId,
    itens: [{ produtoId, qtd }],
    total,
    status,
    etaMin,
    notif,
    criadoEm: new Date().toISOString(),
  });

  savePedidos();
  resetPedidoForm();
  renderPedidosList();
  renderDashboard();
  renderMeusPedidos();
  showAlert("Pedido criado ✅");
});

btnPedidoCancelar?.addEventListener("click", resetPedidoForm);
filtroPedido?.addEventListener("input", renderPedidosList);

/* =======================
   Dashboard
======================= */
function renderDashboard() {
  if (!kpiTotalPedidos || !kpiEmPreparo || !kpiEntregues || !kpiProdutos) return;

  const total = pedidos.length;
  const emPreparo = pedidos.filter((p) => String(p.status || "").toLowerCase().includes("preparo")).length;
  const entregues = pedidos.filter((p) => String(p.status || "").toLowerCase().includes("entregue")).length;

  kpiTotalPedidos.textContent = String(total);
  kpiEmPreparo.textContent = String(emPreparo);
  kpiEntregues.textContent = String(entregues);
  kpiProdutos.textContent = String(produtos.length);

  renderAtividadeRecente();
}

function activityIcon(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("entregue")) return "✅";
  if (s.includes("caminho")) return "🚚";
  return "🕒";
}

function renderAtividadeRecente() {
  if (!atividadeRecenteEl) return;

  const recent = [...pedidos].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 6);

  if (!recent.length) {
    atividadeRecenteEl.innerHTML = `<p class="muted">Sem atividade por enquanto.</p>`;
    return;
  }

  atividadeRecenteEl.innerHTML = recent
    .map((p) => {
      const cliente = usuarios.find((x) => x.id === p.clienteId);
      const nome = cliente?.nome || "Cliente";
      const st = humanStatus(p.status);
      const icon = activityIcon(p.status);
      return `
        <div class="activity-item">
          <div class="activity-item__ico">${icon}</div>
          <div>
            <strong>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))}</strong> <span class="muted">${st}</span>
            <div class="muted">Cliente: ${escapeHTML(nome)} • ${new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Checkout (Finalizar Pedido)
======================= */
function ensureClienteLoggedOrOpenCadastro() {
  const c = getClienteAtual();
  if (c) return true;
  openCliente("cadastro");
  showAlert("Para finalizar, faça cadastro/login na Área do Cliente.", "error");
  return false;
}

function createPedidoFromCarrinho() {
  const c = getClienteAtual();
  if (!c) return false;

  if (!carrinho.length) return showAlert("Carrinho vazio.", "error");

  const itens = carrinho
    .map((i) => ({ produtoId: i.produtoId, qtd: Math.max(1, Number(i.qtd) || 1) }))
    .filter((x) => !!getProdutoById(x.produtoId));

  if (!itens.length) return showAlert("Itens inválidos.", "error");

  const total = itens.reduce((acc, it) => {
    const p = getProdutoById(it.produtoId);
    return acc + (Number(p?.preco || 0) || 0) * it.qtd;
  }, 0);

  const novo = {
    id: uid(),
    codigo: uid().slice(-4),
    clienteId: c.id,
    itens,
    total,
    status: "Em preparo",
    etaMin: 25,
    notif: c.notif || "webapp",
    criadoEm: new Date().toISOString(),
  };

  pedidos.push(novo);
  savePedidos();

  carrinho = [];
  saveCarrinho();
  updateCartBadge();
  renderCart();
  renderDashboard();
  renderPedidosList();
  renderMeusPedidos();

  showAlert("Pedido realizado ✅");
  return true;
}

/* =======================
   Cliente: Login/Cadastro
======================= */
formClienteCadastro?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = clienteNome.value.trim();
  const user = clienteUser.value.trim();
  const email = clienteEmail.value.trim();
  const senha = clientePass.value;
  const notif = clienteNotif.value;

  if (!nome || !user || !email || !senha || senha.length < 4) {
    return showAlert("Preencha os campos (senha mínimo 4).", "error");
  }

  const userLower = user.toLowerCase();
  const conflict = usuarios.some((x) => String(x.user || "").toLowerCase() === userLower);
  if (conflict) return showAlert("Usuário já existe. Escolha outro.", "error");

  const novo = {
    id: uid(),
    nome,
    email,
    user,
    senha,
    tipo: "Cliente",
    notif,
  };

  usuarios.push(novo);
  saveUsuarios();

  setClienteAtual({ id: novo.id, nome: novo.nome, user: novo.user, notif: novo.notif });
  syncUserbox();
  syncClienteTabsVisibility();
  setClienteTab("meuspedidos");
  renderMeusPedidos();

  showAlert("Cadastro concluído ✅");
});

formClienteLogin?.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = clienteLoginUser.value.trim();
  const senha = clienteLoginPass.value;

  const u = findUserByLogin(user, senha, "Cliente");
  if (!u) return showAlert("Login inválido.", "error");

  setClienteAtual({ id: u.id, nome: u.nome, user: u.user, notif: u.notif || "webapp" });
  syncUserbox();
  syncClienteTabsVisibility();
  setClienteTab("meuspedidos");
  renderMeusPedidos();

  showAlert("Bem-vindo(a) ✅");
});

btnCliente?.addEventListener("click", () => {
  const c = getClienteAtual();
  openCliente(c ? "meuspedidos" : "login");
});

btnLogoutCliente?.addEventListener("click", logoutCliente);

/* =======================
   Admin: Login/Logout/Voltar
======================= */
btnAdmin?.addEventListener("click", openAdmin);

btnAdminClose?.addEventListener("click", () => {
  closeAdmin();
});

btnVoltarLoja?.addEventListener("click", () => {
  closeAdmin();
  setAdminSession(3 * 60 * 1000); // 3 min
  showAlert("Voltando para a loja 👈");
});

btnSair?.addEventListener("click", () => {
  clearAdminSession();
  showAdminLogin();
  showAlert("Sessão encerrada. Faça login novamente ✅");
});

wireModalCloseByDataset(adminEl, "data-admin-close", closeAdmin);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (adminEl && !adminEl.classList.contains("is-hidden")) closeAdmin();
    if (cartModal && !cartModal.classList.contains("is-hidden")) closeCart();
    if (clienteModal && !clienteModal.classList.contains("is-hidden")) closeCliente();
  }
});

formAdminLogin?.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = loginUser.value.trim();
  const senha = loginSenha.value;

  const originalText = btnEntrar?.querySelector(".btn__text")?.textContent || "Entrar";

  const startLoading = () => {
    if (!btnEntrar) return;
    btnEntrar.disabled = true;
    const t = btnEntrar.querySelector(".btn__text");
    if (t) t.textContent = "Entrando...";
    btnEntrar.classList.add("is-loading");
  };

  const stopLoading = () => {
    if (!btnEntrar) return;
    btnEntrar.disabled = false;
    const t = btnEntrar.querySelector(".btn__text");
    if (t) t.textContent = originalText;
    btnEntrar.classList.remove("is-loading");
  };

  startLoading();

  window.setTimeout(() => {
    const u = findUserByLogin(user, senha, "Administrador");
    if (!u) {
      stopLoading();
      return showAlert("Acesso negado.", "error");
    }

    setAdminSession(30 * 60 * 1000); // 30 min
    stopLoading();
    showAdminApp();
    showAlert("Admin liberado ✅");
  }, 1500); // <-- tempo do “Entrando...” (1.5s)
});

/* =======================
   Admin: Navegação
======================= */
adminTabs.forEach((b) => {
  b.addEventListener("click", () => {
    const tab = b.dataset.admin;
    setAdminTab(tab);
    if (tab === "dashboard") renderDashboard();
  });
});

/* =======================
   Config: Dark Toggle
======================= */
toggleDark?.addEventListener("change", () => {
  setTheme(!!toggleDark.checked);
});

/* =======================
   Loja: Eventos do carrinho
======================= */
cartBtn?.addEventListener("click", openCart);

wireModalCloseByDataset(cartModal, "data-modal-close", closeCart);

btnFinalizar?.addEventListener("click", () => {
  if (!ensureClienteLoggedOrOpenCadastro()) return;

  const ok = createPedidoFromCarrinho();
  if (ok) closeCart();
});

/* =======================
   Cliente modal close
======================= */
wireModalCloseByDataset(clienteModal, "data-cliente-close", closeCliente);

/* =======================
   Seed inicial
======================= */
function seedIfEmpty() {
  ensureAdminSeed();

  if (!produtos.length) {
    produtos = [
      { id: uid(), nome: "X-Bacon", preco: 25.9, categoria: "Lanches", descricao: "Hambúrguer, bacon crocante, cheddar, alface e tomate", foto: null },
      { id: uid(), nome: "X-Burger Especial", preco: 32.9, categoria: "Lanches", descricao: "Artesanal 180g, queijo suíço, cebola caramelizada e molho especial", foto: null },
      { id: uid(), nome: "X-Salada", preco: 22.9, categoria: "Lanches", descricao: "Hambúrguer, queijo, alface, tomate, cebola e maionese", foto: null },
    ];
    saveProdutos();
  }

  if (!usuarios.some((u) => u.tipo === "Cliente")) {
    usuarios.push(
      { id: uid(), nome: "Ana Silva", email: "ana@email.com", user: "ana", senha: "1234", tipo: "Cliente", notif: "webapp" },
      { id: uid(), nome: "Pedro Santos", email: "pedro@email.com", user: "pedro", senha: "1234", tipo: "Cliente", notif: "whatsapp" }
    );
    saveUsuarios();
  }
}

/* =======================
   Refresh
======================= */
function refreshAllAdmin() {
  renderProdutosList();
  renderUsuariosList();
  refreshPedidoCombos();
  renderPedidosList();
  renderDashboard();
}

function refreshAllStore() {
  renderMenu();
  updateCartBadge();
  syncUserbox();
  syncClienteTabsVisibility();
  renderMeusPedidos();
}

/* =======================
   Init
======================= */
function init() {
  seedIfEmpty();

  applyThemeFromStorage();

  wireDropzone();

  setAdminTab("dashboard");

  refreshAllStore();
  refreshAllAdmin();
}

init();
