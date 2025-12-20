/* =======================
   Helpers
======================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

const uid = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
const nowISO = () => new Date().toISOString();

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

/* =======================
   Storage Keys / State
======================= */
const KEYS = {
  produtos: "bp_produtos",
  clientes: "bp_clientes",
  pedidos: "bp_pedidos",
  carrinho: "bp_carrinho",
  theme: "bp_theme",
  adminSession: "bp_admin_session",
  clienteSession: "bp_cliente_session",
};

let produtos = storage.get(KEYS.produtos, []);
let clientes = storage.get(KEYS.clientes, []);
let pedidos = storage.get(KEYS.pedidos, []);
let carrinho = storage.get(KEYS.carrinho, []); // [{produtoId,qtd}]

/* =======================
   Theme
======================= */
let theme = storage.get(KEYS.theme, "light");

function applyTheme(mode) {
  theme = mode === "dark" ? "dark" : "light";
  storage.set(KEYS.theme, theme);
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
}

function toggleTheme() {
  applyTheme(theme === "dark" ? "light" : "dark");
}

applyTheme(theme);

/* =======================
   Admin Session
======================= */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";
const ADMIN_IDLE_LIMIT = 3 * 60 * 1000; // 3 min

function getAdminSession() {
  return storage.get(KEYS.adminSession, null);
}

function setAdminSession(value) {
  if (value) storage.set(KEYS.adminSession, value);
  else storage.del(KEYS.adminSession);
}

function isAdminSessionValid() {
  const s = getAdminSession();
  return Boolean(s && s.lastAuthAt);
}

function touchAdminSession() {
  const s = getAdminSession();
  if (!s) return;
  setAdminSession({ ...s, lastSeenAt: Date.now() });
}

function adminNeedsReauth() {
  const s = getAdminSession();
  if (!s) return true;
  const last = Number(s.lastSeenAt || s.lastAuthAt || 0);
  return Date.now() - last > ADMIN_IDLE_LIMIT;
}

/* =======================
   Cliente Session
======================= */
function getClienteSession() {
  return storage.get(KEYS.clienteSession, null); // { clienteId }
}

function setClienteSession(value) {
  if (value) storage.set(KEYS.clienteSession, value);
  else storage.del(KEYS.clienteSession);
}

function getClienteAtual() {
  const s = getClienteSession();
  if (!s?.clienteId) return null;
  return clientes.find((c) => c.id === s.clienteId) || null;
}

function findClienteByUsuario(usuario) {
  const u = String(usuario || "").trim().toLowerCase();
  return clientes.find((c) => String(c.usuario || "").toLowerCase() === u) || null;
}

/* =======================
   Loja / Topbar
======================= */
const menuGrid = $("#menu-grid");
const cartBtn = $(".cart");
const btnAdmin = $("#btn-admin");

const btnCliente = $("#btn-cliente");
const clienteLabel = $("#cliente-label");
const btnLogoutClienteTop = $("#btn-logout-cliente");

/* =======================
   Carrinho (Modal)
======================= */
const cartModal = $("#cart-modal");
const cartBackdrop = $("[data-modal-close]");
const cartBody = $("#cart-body");
const cartTotalEl = $("#cart-total");
const btnFinalizar = $("#btn-finalizar");

let pendingCheckout = false;

/* =======================
   Cliente (Modal)
======================= */
const clienteModal = $("#cliente-modal");
const clienteBackdrop = $("[data-cliente-close]");
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
const clienteCadNome = $("#cliente-nome");
const clienteCadUser = $("#cliente-user");
const clienteCadEmail = $("#cliente-email");
const clienteCadPass = $("#cliente-pass");
const clienteCadNotif = $("#cliente-notif");

const meusPedidosList = $("#meus-pedidos");

/* =======================
   Admin (Overlay)
======================= */
const adminEl = $("#admin");
const adminBackdrop = $("[data-admin-close]");
const btnAdminClose = $("#btn-admin-close");

const adminLoginView = $("#admin-login");
const adminAppView = $("#admin-app");

const formAdminLogin = $("#form-login");
const adminUserInput = $("#login-user");
const adminPassInput = $("#login-senha");
const btnEntrar = $("#btn-entrar");

const btnVoltarLoja = $("#btn-voltar-loja");
const btnSair = $("#btn-sair");

const adminTabs = $$(".admin-nav__item");
const adminPages = {
  dashboard: $("#admin-dashboard"),
  produtos: $("#admin-produtos"),
  usuarios: $("#admin-usuarios"),
  pedidos: $("#admin-pedidos"),
  config: $("#admin-config"),
};

const atividadeRecenteEl = $("#atividade-recente");
const kpiTotalPedidos = $("#kpi-total-pedidos");
const kpiEmPreparo = $("#kpi-em-preparo");
const kpiEntregues = $("#kpi-entregues");
const kpiProdutos = $("#kpi-produtos");

/* =======================
   Produtos (Admin)
======================= */
const formProduto = $("#form-produto");
const produtoId = $("#produto-id");
const produtoNome = $("#produto-nome");
const produtoPreco = $("#produto-preco");
const produtoCategoria = $("#produto-categoria");
const produtoDescricao = $("#produto-descricao");
const btnProdutoCancelar = $("#btn-produto-cancelar");
const filtroProduto = $("#filtro-produto");
const listaProdutos = $("#lista-produtos");
const countProdutos = $("#count-produtos");

const produtoFoto = $("#produto-foto");
const produtoPreview = $("#produto-preview");
const dropzone = $("#dropzone");

/* =======================
   Usuários (Admin)
======================= */
const formUsuario = $("#form-usuario");
const usuarioId = $("#usuario-id");
const usuarioNome = $("#usuario-nome");
const usuarioEmail = $("#usuario-email");
const usuarioUser = $("#usuario-user");
const usuarioSenha = $("#usuario-senha");
const usuarioTipo = $("#usuario-tipo");
const btnUsuarioCancelar = $("#btn-usuario-cancelar");
const filtroUsuario = $("#filtro-usuario");
const listaUsuarios = $("#lista-usuarios");
const countUsuarios = $("#count-usuarios");

/* =======================
   Pedidos (Admin)
======================= */
const formPedido = $("#form-pedido");
const pedidoUsuario = $("#pedido-usuario");
const pedidoProduto = $("#pedido-produto");
const pedidoQtd = $("#pedido-qtd");
const pedidoStatus = $("#pedido-status");
const pedidoEta = $("#pedido-eta");
const btnPedidoCancelar = $("#btn-pedido-cancelar");
const filtroPedido = $("#filtro-pedido");
const listaPedidos = $("#lista-pedidos");
const countPedidos = $("#count-pedidos");

/* =======================
   Config (Admin)
======================= */
const toggleDark = $("#toggle-dark");

/* =======================
   Persist
======================= */
function saveProdutos() {
  storage.set(KEYS.produtos, produtos);
}
function saveClientes() {
  storage.set(KEYS.clientes, clientes);
}
function savePedidos() {
  storage.set(KEYS.pedidos, pedidos);
}
function saveCarrinho() {
  storage.set(KEYS.carrinho, carrinho);
}

/* =======================
   Status helpers
======================= */
function normalizeStatus(s) {
  const x = String(s || "").toLowerCase();
  if (x.includes("entreg")) return "Entregue";
  if (x.includes("caminho")) return "A caminho";
  return "Em preparo";
}

function statusUI(status) {
  const s = normalizeStatus(status);
  if (s === "Entregue") return { cls: "order--ok", label: "Entregue", icon: "✅" };
  if (s === "A caminho") return { cls: "order--warn", label: "A caminho", icon: "🛵" };
  return { cls: "order--prep", label: "Em preparo", icon: "🕒" };
}

/* =======================
   Loja: Menu
======================= */
function getProdutoById(id) {
  return produtos.find((p) => p.id === id);
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
  showAlert("Produto adicionado ao carrinho ✅");
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
      const desc = escapeHTML(p.descricao || "Sem descrição");
      const price = formatBRL(p.preco);
      const img = p.fotoDataUrl
        ? `<img class="card__photo" src="${p.fotoDataUrl}" alt="${title}">`
        : `<div class="card__img">🍔</div>`;

      return `
        <article class="card">
          ${img}
          <div class="card__body">
            <h3 class="card__title">${title}</h3>
            <p class="card__desc">${desc}</p>
            <div class="card__bottom">
              <span class="card__price">${price}</span>
              <button class="btn-add" type="button" data-add="${p.id}">adicionar</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  $$("[data-add]").forEach((btn) => btn.addEventListener("click", () => addToCart(btn.dataset.add)));
  updateCartBadge();
}

/* =======================
   Carrinho: Modal
======================= */
function openCart() {
  if (!cartModal) return;
  cartModal.classList.remove("is-hidden");
  cartModal.setAttribute("aria-hidden", "false");
  renderCart();
}

function closeCart() {
  if (!cartModal) return;
  cartModal.classList.add("is-hidden");
  cartModal.setAttribute("aria-hidden", "true");
}

function calcCartTotal() {
  return carrinho.reduce((acc, i) => {
    const p = getProdutoById(i.produtoId);
    return acc + (p?.preco || 0) * (i.qtd || 0);
  }, 0);
}

function renderCart() {
  if (!cartBody || !cartTotalEl) return;

  const items = carrinho
    .map((i) => {
      const p = getProdutoById(i.produtoId);
      return {
        produtoId: i.produtoId,
        nome: p?.nome || "Item",
        preco: p?.preco || 0,
        qtd: i.qtd || 0,
      };
    })
    .filter((x) => x.qtd > 0);

  if (!items.length) {
    cartBody.innerHTML = `<div class="muted">Carrinho vazio.</div>`;
    cartTotalEl.textContent = formatBRL(0);
    return;
  }

  cartBody.innerHTML = items
    .map(
      (it) => `
      <div class="cart-item">
        <div class="cart-item__left">
          <strong>${escapeHTML(it.nome)}</strong>
          <div class="muted">${formatBRL(it.preco)}</div>
        </div>
        <div class="cart-item__right">
          <button class="qty-btn" type="button" data-qty="${it.produtoId}" data-op="-">-</button>
          <span class="qty">${it.qtd}</span>
          <button class="qty-btn" type="button" data-qty="${it.produtoId}" data-op="+">+</button>
          <button class="icon-btn" type="button" data-remove="${it.produtoId}" aria-label="Remover">✕</button>
        </div>
      </div>
    `
    )
    .join("");

  cartTotalEl.textContent = formatBRL(calcCartTotal());

  $$("[data-qty]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.qty;
      const op = b.dataset.op;
      const row = carrinho.find((x) => x.produtoId === id);
      if (!row) return;

      if (op === "+") row.qtd += 1;
      if (op === "-") row.qtd = Math.max(0, (row.qtd || 0) - 1);
      carrinho = carrinho.filter((x) => (x.qtd || 0) > 0);

      saveCarrinho();
      updateCartBadge();
      renderCart();
    });
  });

  $$("[data-remove]").forEach((b) => {
    b.addEventListener("click", () => {
      carrinho = carrinho.filter((x) => x.produtoId !== b.dataset.remove);
      saveCarrinho();
      updateCartBadge();
      renderCart();
    });
  });
}

async function criarPedidoDoCarrinho() {
  const c = getClienteAtual();
  if (!c) return;

  const itens = carrinho
    .map((i) => ({ produtoId: i.produtoId, qtd: i.qtd || 0 }))
    .filter((x) => x.qtd > 0);

  if (!itens.length) return showAlert("Carrinho vazio.", "error");

  const pedido = {
    id: uid(),
    codigo: `#${Math.floor(1000 + Math.random() * 9000)}`,
    clienteId: c.id,
    itens,
    status: "Em preparo",
    etaMin: 25,
    notif: c.notif || "webapp",
    criadoEm: nowISO(),
  };

  pedidos.push(pedido);
  savePedidos();

  carrinho = [];
  saveCarrinho();
  updateCartBadge();
  closeCart();

  renderDashboard();
  renderPedidosList();
  renderMeusPedidos();

  showAlert("Pedido criado ✅");
}

/* =======================
   Cliente: Modal Tabs
======================= */
function setClienteTab(tab) {
  clienteTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.ctab === tab));
  Object.entries(clientePages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("is-visible", k === tab);
  });
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
  if (!clienteModal) return;

  clienteModal.classList.remove("is-hidden");
  clienteModal.setAttribute("aria-hidden", "false");

  syncClienteTabsVisibility();
  setClienteTab(tab);

  renderMeusPedidos();
}

function closeCliente() {
  if (!clienteModal) return;
  clienteModal.classList.add("is-hidden");
  clienteModal.setAttribute("aria-hidden", "true");
}

function updateClienteTopbar() {
  const c = getClienteAtual();

  if (!btnCliente || !clienteLabel || !btnLogoutClienteTop) return;

  if (c) {
    clienteLabel.textContent = c.nome;
    btnLogoutClienteTop.classList.remove("is-hidden");
  } else {
    clienteLabel.textContent = "Área do Cliente";
    btnLogoutClienteTop.classList.add("is-hidden");
  }
}

/* =======================
   Cliente: Meus Pedidos
======================= */
function calcPedidoTotal(pedido) {
  const itens = pedido.itens || [];
  return itens.reduce((acc, i) => {
    const p = getProdutoById(i.produtoId);
    return acc + (p?.preco || 0) * (i.qtd || 0);
  }, 0);
}

function renderMeusPedidos() {
  if (!meusPedidosList) return;

  const c = getClienteAtual();
  if (!c) {
    meusPedidosList.innerHTML = `<div class="muted">Faça login para ver seus pedidos.</div>`;
    return;
  }

  const list = pedidos
    .filter((p) => p.clienteId === c.id)
    .slice()
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  if (!list.length) {
    meusPedidosList.innerHTML = `<div class="muted">Nenhum pedido ainda. Bora pedir? 🍔</div>`;
    return;
  }

  meusPedidosList.innerHTML = list
    .map((p) => {
      const ui = statusUI(p.status);
      const when = new Date(p.criadoEm).toLocaleString("pt-BR");
      const estim = p.etaMin ? `~${p.etaMin} min` : "—";
      const total = calcPedidoTotal(p);

      const itensTxt = (p.itens || [])
        .map((i) => {
          const prod = getProdutoById(i.produtoId);
          return `${i.qtd || 1}x ${escapeHTML(prod?.nome || "Item")}`;
        })
        .join(" • ");

      return `
        <div class="cliente-order">
          <div class="cliente-order__top">
            <div>
              <strong>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))}</strong>
              <div class="muted">${when}</div>
              <div class="muted">${itensTxt}</div>
              <div class="muted">Notificação: <strong>${escapeHTML(p.notif || c.notif || "webapp")}</strong></div>
            </div>
            <div class="cliente-order__status">
              <span class="pill">${ui.icon} ${ui.label}</span>
              <div class="muted">Estimativa: <strong>${estim}</strong></div>
              <div class="muted"><strong>${formatBRL(total)}</strong></div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Admin: open/close + views
======================= */
function showAdminLogin() {
  adminLoginView?.classList.remove("is-hidden");
  adminAppView?.classList.add("is-hidden");

  if (adminUserInput) adminUserInput.value = ADMIN_USER;
  if (adminPassInput) adminPassInput.value = ADMIN_PASS;
}

function showAdminApp() {
  adminLoginView?.classList.add("is-hidden");
  adminAppView?.classList.remove("is-hidden");
  touchAdminSession();
  setAdminTab("dashboard");
  refreshAll();
}

function openAdmin(forceLogin = false) {
  if (!adminEl) return;

  adminEl.classList.remove("is-hidden");
  adminEl.setAttribute("aria-hidden", "false");

  const valid = isAdminSessionValid();
  const needsReauth = adminNeedsReauth();

  if (forceLogin || !valid || needsReauth) showAdminLogin();
  else showAdminApp();
}

function closeAdmin() {
  if (!adminEl) return;
  adminEl.classList.add("is-hidden");
  adminEl.setAttribute("aria-hidden", "true");
}

function setAdminTab(tab) {
  adminTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.admin === tab));
  Object.entries(adminPages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("is-visible", k === tab);
  });
}

/* =======================
   Admin: Dashboard
======================= */
function renderDashboard() {
  const total = pedidos.length;
  const emPreparo = pedidos.filter((p) => normalizeStatus(p.status) === "Em preparo").length;
  const entregues = pedidos.filter((p) => normalizeStatus(p.status) === "Entregue").length;

  kpiTotalPedidos && (kpiTotalPedidos.textContent = String(total));
  kpiEmPreparo && (kpiEmPreparo.textContent = String(emPreparo));
  kpiEntregues && (kpiEntregues.textContent = String(entregues));
  kpiProdutos && (kpiProdutos.textContent = String(produtos.length));

  if (!atividadeRecenteEl) return;

  const recent = pedidos
    .slice()
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 8);

  atividadeRecenteEl.innerHTML = recent
    .map((p) => {
      const u = clientes.find((x) => x.id === p.clienteId);
      const ui = statusUI(p.status);
      const when = new Date(p.criadoEm).toLocaleString("pt-BR");

      return `
        <div class="activity__item">
          <div class="activity__ico">${ui.icon}</div>
          <div class="activity__txt">
            <strong>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))} ${ui.label}</strong>
            <div class="muted">Cliente: ${escapeHTML(u?.nome || "Cliente")} • ${when}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =======================
   Admin: Produtos CRUD
======================= */
function resetProdutoForm() {
  produtoId && (produtoId.value = "");
  formProduto?.reset();

  if (produtoPreview) {
    produtoPreview.src = "";
    produtoPreview.classList.add("is-hidden");
  }
  if (produtoFoto) produtoFoto.value = "";
  if (formProduto) formProduto.dataset.foto = "";
}

function renderProdutosList() {
  if (!listaProdutos) return;

  const q = (filtroProduto?.value || "").trim().toLowerCase();
  const list = produtos.filter((p) => p.nome.toLowerCase().includes(q));

  if (countProdutos) countProdutos.textContent = String(list.length);

  listaProdutos.innerHTML = list
    .map((p) => {
      const foto = p.fotoDataUrl
        ? `<img class="table-photo" src="${p.fotoDataUrl}" alt="${escapeHTML(p.nome)}">`
        : `<span class="table-photo table-photo--empty">🍔</span>`;

      return `
        <tr>
          <td>${foto}</td>
          <td><strong>${escapeHTML(p.nome)}</strong></td>
          <td class="muted">${escapeHTML(p.descricao || "")}</td>
          <td class="t-right price">${formatBRL(p.preco)}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-prod="${p.id}">Editar</button>
            <button class="btn btn--danger" type="button" data-del-prod="${p.id}">Excluir</button>
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

  produtoId && (produtoId.value = p.id);
  produtoNome && (produtoNome.value = p.nome);
  produtoPreco && (produtoPreco.value = p.preco);
  produtoCategoria && (produtoCategoria.value = p.categoria);
  produtoDescricao && (produtoDescricao.value = p.descricao || "");

  if (formProduto) formProduto.dataset.foto = p.fotoDataUrl || "";

  if (produtoPreview && p.fotoDataUrl) {
    produtoPreview.src = p.fotoDataUrl;
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

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("file_read_error"));
    fr.readAsDataURL(file);
  });
}

async function handleProdutoFoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return showAlert("Use um arquivo de imagem.", "error");

  try {
    const dataUrl = await readFileAsDataURL(file);
    if (formProduto) formProduto.dataset.foto = dataUrl;

    if (produtoPreview) {
      produtoPreview.src = dataUrl;
      produtoPreview.classList.remove("is-hidden");
    }
  } catch {
    showAlert("Falha ao ler a imagem.", "error");
  }
}

produtoFoto?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  await handleProdutoFoto(file);
});

dropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("is-drag");
});

dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-drag"));

dropzone?.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropzone.classList.remove("is-drag");
  const file = e.dataTransfer?.files?.[0];
  await handleProdutoFoto(file);
});

formProduto?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = (produtoNome?.value || "").trim();
  const preco = Number(produtoPreco?.value);
  const categoria = (produtoCategoria?.value || "").trim();
  const descricao = (produtoDescricao?.value || "").trim();
  const fotoDataUrl = String(formProduto?.dataset?.foto || "").trim();

  if (!nome || !categoria || Number.isNaN(preco) || preco < 0) {
    return showAlert("Preencha nome, categoria e preço corretamente.", "error");
  }

  const id = produtoId?.value || "";

  if (id) {
    const idx = produtos.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Produto não encontrado.", "error");
    produtos[idx] = { ...produtos[idx], nome, preco, categoria, descricao, fotoDataUrl: fotoDataUrl || produtos[idx].fotoDataUrl || "" };
    showAlert("Produto atualizado ✅");
  } else {
    produtos.push({ id: uid(), nome, preco, categoria, descricao, fotoDataUrl: fotoDataUrl || "" });
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
  usuarioId && (usuarioId.value = "");
  formUsuario?.reset();
}

function renderUsuariosList() {
  if (!listaUsuarios) return;

  const q = (filtroUsuario?.value || "").trim().toLowerCase();
  const list = clientes.filter((u) => {
    const nome = (u.nome || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const user = (u.usuario || "").toLowerCase();
    return nome.includes(q) || email.includes(q) || user.includes(q);
  });

  if (countUsuarios) countUsuarios.textContent = String(list.length);

  listaUsuarios.innerHTML = list
    .map((u) => {
      return `
        <tr>
          <td><strong>${escapeHTML(u.nome)}</strong></td>
          <td class="muted">${escapeHTML(u.email || "")}</td>
          <td>${escapeHTML(u.usuario || "")}</td>
          <td>${escapeHTML(u.tipo || "Cliente")}</td>
          <td class="t-center">
            <button class="btn btn--danger" type="button" data-del-user="${u.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("[data-del-user]").forEach((b) => b.addEventListener("click", () => deleteUsuario(b.dataset.delUser)));
}

function deleteUsuario(id) {
  const u = clientes.find((x) => x.id === id);
  if (!u) return;

  if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;

  clientes = clientes.filter((x) => x.id !== id);
  saveClientes();

  renderUsuariosList();
  refreshPedidoCombos();
  showAlert("Usuário excluído ✅");
}

formUsuario?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = (usuarioNome?.value || "").trim();
  const email = (usuarioEmail?.value || "").trim();
  const user = (usuarioUser?.value || "").trim();
  const senha = (usuarioSenha?.value || "").trim();
  const tipo = usuarioTipo?.value || "Cliente";

  if (!nome || !email || !user || !senha) return showAlert("Preencha todos os campos.", "error");
  if (tipo !== "Administrador" && findClienteByUsuario(user)) return showAlert("Usuário já existe.", "error");

  const id = usuarioId?.value || "";

  if (id) {
    const idx = clientes.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Usuário não encontrado.", "error");
    clientes[idx] = { ...clientes[idx], nome, email, usuario: user, senha, tipo };
    showAlert("Usuário atualizado ✅");
  } else {
    clientes.push({
      id: uid(),
      nome,
      email,
      usuario: user,
      senha,
      tipo,
      notif: "webapp",
      criadoEm: nowISO(),
    });
    showAlert("Usuário cadastrado ✅");
  }

  saveClientes();
  resetUsuarioForm();
  renderUsuariosList();
  refreshPedidoCombos();
});

btnUsuarioCancelar?.addEventListener("click", resetUsuarioForm);
filtroUsuario?.addEventListener("input", renderUsuariosList);

/* =======================
   Admin: Pedidos
======================= */
function refreshPedidoCombos() {
  if (pedidoUsuario) {
    pedidoUsuario.innerHTML =
      `<option value="">Selecione um cliente</option>` +
      clientes
        .filter((u) => (u.tipo || "Cliente") !== "Administrador")
        .map((u) => `<option value="${u.id}">${escapeHTML(u.nome)}</option>`)
        .join("");
  }

  if (pedidoProduto) {
    pedidoProduto.innerHTML =
      `<option value="">Selecione um produto</option>` +
      produtos.map((p) => `<option value="${p.id}">${escapeHTML(p.nome)} — ${formatBRL(p.preco)}</option>`).join("");
  }
}

function renderPedidosList() {
  if (!listaPedidos) return;

  const q = (filtroPedido?.value || "").trim().toLowerCase();

  const list = pedidos
    .slice()
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .filter((p) => {
      const u = clientes.find((x) => x.id === p.clienteId);
      const nome = (u?.nome || "").toLowerCase();
      const st = normalizeStatus(p.status).toLowerCase();
      return nome.includes(q) || st.includes(q) || String(p.codigo || "").toLowerCase().includes(q);
    });

  if (countPedidos) countPedidos.textContent = String(list.length);

  listaPedidos.innerHTML = list
    .map((p) => {
      const u = clientes.find((x) => x.id === p.clienteId);
      const ui = statusUI(p.status);
      const total = calcPedidoTotal(p);
      const when = new Date(p.criadoEm).toLocaleString("pt-BR");
      const estim = p.etaMin ? `~${p.etaMin} min` : "—";
      const notif = p.notif || "webapp";

      const itensTxt = (p.itens || [])
        .map((i) => {
          const prod = getProdutoById(i.produtoId);
          return `${i.qtd || 1}x ${escapeHTML(prod?.nome || "Item")}`;
        })
        .join(" • ");

      return `
        <article class="order ${ui.cls}">
          <div class="order__top">
            <div class="order__left">
              <h4>Pedido ${escapeHTML(p.codigo || p.id.slice(-4))} <span class="pill">${ui.icon} ${ui.label}</span></h4>
              <div class="muted">Cliente: ${escapeHTML(u?.nome || "Cliente")}</div>
              <div class="muted">${when}</div>
            </div>
            <div class="order__right">
              <div class="price">${formatBRL(total)}</div>
              <div class="muted">ETA: <strong>${estim}</strong></div>
              <div class="muted">Notif: <strong>${escapeHTML(notif)}</strong></div>
            </div>
          </div>

          <div class="order__items">${itensTxt || "<span class='muted'>Sem itens</span>"}</div>

          <div class="order__actions">
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Em preparo">Em preparo</button>
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="A caminho">A caminho</button>
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Entregue">Entregue</button>

            <label class="eta">
              <span>ETA (min)</span>
              <input type="number" min="1" max="180" value="${p.etaMin || ""}" data-eta="${p.id}" placeholder="25">
            </label>
          </div>
        </article>
      `;
    })
    .join("");

  $$("[data-st]").forEach((b) => b.addEventListener("click", () => updatePedidoStatus(b.dataset.st, b.dataset.new)));
  $$("[data-eta]").forEach((inp) =>
    inp.addEventListener("change", () => updatePedidoEta(inp.dataset.eta, Number(inp.value)))
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
  showAlert("Status atualizado ✅");
}

function updatePedidoEta(id, etaMin) {
  const idx = pedidos.findIndex((x) => x.id === id);
  if (idx === -1) return;

  pedidos[idx].etaMin = Number.isFinite(etaMin) && etaMin > 0 ? Math.round(etaMin) : null;
  savePedidos();

  renderPedidosList();
  renderMeusPedidos();
  showAlert("ETA atualizado ✅");
}

formPedido?.addEventListener("submit", (e) => {
  e.preventDefault();

  const clienteId = pedidoUsuario?.value || "";
  const produtoId = pedidoProduto?.value || "";
  const qtd = Number(pedidoQtd?.value || 1);
  const status = pedidoStatus?.value || "Em preparo";
  const eta = Number(pedidoEta?.value || 25);

  if (!clienteId || !produtoId || Number.isNaN(qtd) || qtd < 1) {
    return showAlert("Selecione cliente, produto e quantidade válida.", "error");
  }

  pedidos.push({
    id: uid(),
    codigo: `#${Math.floor(1000 + Math.random() * 9000)}`,
    clienteId,
    itens: [{ produtoId, qtd }],
    status,
    etaMin: Number.isFinite(eta) && eta > 0 ? Math.round(eta) : 25,
    notif: "webapp",
    criadoEm: nowISO(),
  });

  savePedidos();
  formPedido.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;

  renderPedidosList();
  renderDashboard();
  renderMeusPedidos();
  showAlert("Pedido criado ✅");
});

btnPedidoCancelar?.addEventListener("click", () => {
  formPedido?.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;
});

filtroPedido?.addEventListener("input", renderPedidosList);

/* =======================
   Config: Dark Toggle
======================= */
function wireDarkToggle() {
  if (!toggleDark) return;
  toggleDark.checked = theme === "dark";
  toggleDark.addEventListener("change", () => toggleTheme());
}

/* =======================
   Seed
======================= */
function seed() {
  if (!produtos.length) {
    produtos = [
      { id: uid(), nome: "X-Bacon", preco: 25.9, categoria: "Lanches", descricao: "Hambúrguer, bacon crocante, cheddar, alface e tomate", fotoDataUrl: "" },
      { id: uid(), nome: "X-Burger Especial", preco: 32.9, categoria: "Lanches", descricao: "180g artesanal, queijo suíço, cebola caramelizada e molho especial", fotoDataUrl: "" },
      { id: uid(), nome: "X-Salada", preco: 22.9, categoria: "Lanches", descricao: "Hambúrguer, queijo, alface, tomate, cebola e maionese", fotoDataUrl: "" },
    ];
    saveProdutos();
  }

  if (!clientes.length) {
    clientes = [
      { id: uid(), nome: "Ana Silva", usuario: "ana", email: "ana@email.com", senha: "123456", tipo: "Cliente", notif: "webapp", criadoEm: nowISO() },
      { id: uid(), nome: "Pedro Santos", usuario: "pedro", email: "pedro@email.com", senha: "123456", tipo: "Cliente", notif: "whatsapp", criadoEm: nowISO() },
    ];
    saveClientes();
  }

  if (!pedidos.length) {
    pedidos = [
      {
        id: uid(),
        codigo: "#0738",
        clienteId: clientes[0].id,
        itens: [{ produtoId: produtos[0].id, qtd: 1 }],
        status: "Em preparo",
        etaMin: 25,
        notif: "webapp",
        criadoEm: nowISO(),
      },
    ];
    savePedidos();
  }

  showAlert("Dados de exemplo criados ✅");
}

/* =======================
   Boot / Refresh
======================= */
function refreshAll() {
  renderMenu();
  updateCartBadge();

  renderProdutosList();
  renderUsuariosList();
  refreshPedidoCombos();
  renderPedidosList();
  renderDashboard();
  renderMeusPedidos();

  updateClienteTopbar();
  syncClienteTabsVisibility();
  wireDarkToggle();
}

function initEvents() {
  /* Loja */
  cartBtn?.addEventListener("click", openCart);
  cartBackdrop?.addEventListener("click", closeCart);

  btnFinalizar?.addEventListener("click", async () => {
    if (!cartCount()) return showAlert("Carrinho vazio.", "error");

    const c = getClienteAtual();
    if (!c) {
      pendingCheckout = true;
      closeCart();
      openCliente("cadastro");
      showAlert("Para finalizar, faça cadastro/login ✅");
      return;
    }

    await criarPedidoDoCarrinho();
  });

  /* Cliente */
  btnCliente?.addEventListener("click", () => {
    const c = getClienteAtual();
    openCliente(c ? "meuspedidos" : "login");
  });

  btnLogoutClienteTop?.addEventListener("click", () => {
    setClienteSession(null);
    updateClienteTopbar();
    syncClienteTabsVisibility();
    renderMeusPedidos();
    showAlert("Logout realizado ✅");
  });

  clienteBackdrop?.addEventListener("click", closeCliente);
  $$("[data-ctab]").forEach((b) =>
    b.addEventListener("click", () => {
      const tab = b.dataset.ctab;
      if (!tab) return;
      if (tab === "login" && getClienteAtual()) return; // logado: não volta pro login
      setClienteTab(tab);
    })
  );

  formClienteCadastro?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = (clienteCadNome?.value || "").trim();
    const usuario = (clienteCadUser?.value || "").trim();
    const email = (clienteCadEmail?.value || "").trim();
    const senha = (clienteCadPass?.value || "").trim();
    const notif = (clienteCadNotif?.value || "webapp").trim();

    if (!nome || !usuario || !email || !senha) return showAlert("Preencha todos os campos.", "error");
    if (findClienteByUsuario(usuario)) return showAlert("Usuário já existe.", "error");

    const novo = {
      id: uid(),
      nome,
      usuario,
      email,
      senha,
      tipo: "Cliente",
      notif,
      criadoEm: nowISO(),
    };

    clientes.push(novo);
    saveClientes();

    setClienteSession({ clienteId: novo.id });
    updateClienteTopbar();
    syncClienteTabsVisibility();

    formClienteCadastro.reset();
    showAlert(`Bem-vindo, ${novo.nome} ✅`);

    setClienteTab("meuspedidos");
    renderMeusPedidos();

    if (pendingCheckout) {
      pendingCheckout = false;
      await criarPedidoDoCarrinho();
      openCliente("meuspedidos");
    }
  });

  formClienteLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = (clienteLoginUser?.value || "").trim();
    const senha = (clienteLoginPass?.value || "").trim();

    if (!usuario || !senha) return showAlert("Informe usuário e senha.", "error");

    const c = findClienteByUsuario(usuario);
    if (!c || c.senha !== senha) return showAlert("Login inválido.", "error");

    setClienteSession({ clienteId: c.id });
    updateClienteTopbar();
    syncClienteTabsVisibility();

    formClienteLogin.reset();
    showAlert(`Bem-vindo, ${c.nome} ✅`);

    setClienteTab("meuspedidos");
    renderMeusPedidos();

    if (pendingCheckout) {
      pendingCheckout = false;
      await criarPedidoDoCarrinho();
      openCliente("meuspedidos");
    }
  });

  /* Admin */
  btnAdmin?.addEventListener("click", () => openAdmin(false));
  adminBackdrop?.addEventListener("click", closeAdmin);
  btnAdminClose?.addEventListener("click", closeAdmin);

  adminTabs.forEach((b) => {
    b.addEventListener("click", () => {
      const tab = b.dataset.admin;
      if (!tab) return;

      if (adminNeedsReauth()) return showAdminLogin();

      setAdminTab(tab);
      touchAdminSession();
    });
  });

  btnVoltarLoja?.addEventListener("click", () => {
    touchAdminSession();
    closeAdmin();
  });

  btnSair?.addEventListener("click", () => {
    setAdminSession(null);
    showAdminLogin();
    closeAdmin();
  });

  formAdminLogin?.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = (adminUserInput?.value || "").trim();
    const pass = (adminPassInput?.value || "").trim();

    const spinner = $(".btn__spinner", btnEntrar || document);
    const txt = $(".btn__text", btnEntrar || document);

    btnEntrar && (btnEntrar.disabled = true);
    txt && (txt.textContent = "Entrando...");
    spinner && spinner.classList.add("is-on");

    window.setTimeout(() => {
      const ok = user === ADMIN_USER && pass === ADMIN_PASS;

      btnEntrar && (btnEntrar.disabled = false);
      txt && (txt.textContent = "Entrar");
      spinner && spinner.classList.remove("is-on");

      if (!ok) return showAlert("Acesso negado ❌ (use admin/admin)", "error");

      setAdminSession({ user, lastAuthAt: Date.now(), lastSeenAt: Date.now() });
      showAdminApp();
    }, 1500);
  });

  /* Global */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (cartModal && !cartModal.classList.contains("is-hidden")) closeCart();
    if (clienteModal && !clienteModal.classList.contains("is-hidden")) closeCliente();
    if (adminEl && !adminEl.classList.contains("is-hidden")) closeAdmin();
  });
}

function init() {
  seed();
  initEvents();

  refreshAll();

  if (adminEl) {
    showAdminLogin();
    closeAdmin();
  }

  syncClienteTabsVisibility();
  updateClienteTopbar();
}

init();
