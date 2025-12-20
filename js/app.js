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

const KEYS = {
  produtos: "bp_produtos",
  usuarios: "bp_usuarios",
  pedidos: "bp_pedidos",
  carrinho: "bp_carrinho",
  sessao: "bp_sessao",
  settings: "bp_settings",
};

let produtos = storage.get(KEYS.produtos, []);
let usuarios = storage.get(KEYS.usuarios, []);
let pedidos = storage.get(KEYS.pedidos, []);
let carrinho = storage.get(KEYS.carrinho, []);
let sessao = storage.get(KEYS.sessao, null);
let settings = storage.get(KEYS.settings, { darkMode: false });

const AUTH = {
  adminReauthAfterMs: 5 * 60 * 1000,
  entrarDelayMs: 1500,
};

const adminEl = $("#admin");
const adminLoginEl = $("#admin-login");
const adminAppEl = $("#admin-app");

const btnAdmin = $("#btn-admin");
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

const formLoginAdmin = $("#form-login-admin");
const loginAdminUser = $("#login-admin-user");
const loginAdminPass = $("#login-admin-pass");
const btnEntrarAdmin = $("#btn-entrar-admin");

const menuGrid = $("#menu-grid");
const cartBtn = $(".cart");

const userChip = $("#user-chip");
const userChipName = $("#user-chip-name");
const btnLogout = $("#btn-logout");

const toggleDark = $("#toggle-dark");

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

let produtoFotoDataUrl = null;

const formUsuario = $("#form-usuario");
const usuarioId = $("#usuario-id");
const usuarioNome = $("#usuario-nome");
const usuarioUser = $("#usuario-user");
const usuarioEmail = $("#usuario-email");
const usuarioSenha = $("#usuario-senha");
const usuarioTipo = $("#usuario-tipo");
const usuarioNotif = $("#usuario-notif");
const usuarioWhats = $("#usuario-whats");
const btnUsuarioCancelar = $("#btn-usuario-cancelar");
const listaUsuarios = $("#lista-usuarios");
const filtroUsuario = $("#filtro-usuario");
const countUsuarios = $("#count-usuarios");

const formPedido = $("#form-pedido");
const pedidoUsuario = $("#pedido-usuario");
const pedidoProduto = $("#pedido-produto");
const pedidoQtd = $("#pedido-qtd");
const pedidoEta = $("#pedido-eta");
const pedidoStatus = $("#pedido-status");
const btnPedidoCancelar = $("#btn-pedido-cancelar");
const listaPedidos = $("#lista-pedidos");
const filtroPedido = $("#filtro-pedido");
const countPedidos = $("#count-pedidos");

const kpiTotalPedidos = $("#kpi-total-pedidos");
const kpiEmPreparo = $("#kpi-em-preparo");
const kpiEntregues = $("#kpi-entregues");
const kpiProdutos = $("#kpi-produtos");
const atividadeRecente = $("#atividade-recente");

function ensureDefaults() {
  const hasAdmin = usuarios.some((u) => u.tipo === "Administrador" && u.user === "admin");
  if (!hasAdmin) {
    usuarios.push({
      id: uid(),
      nome: "Administrador",
      user: "admin",
      email: "admin@burgerplace.com",
      senha: "admin",
      tipo: "Administrador",
      notif: "webapp",
      whatsapp: "",
    });
    storage.set(KEYS.usuarios, usuarios);
  }

  if (!produtos.length) {
    produtos = [
      { id: uid(), nome: "X-Bacon", preco: 25.9, categoria: "Lanches", descricao: "Hambúrguer, bacon crocante, cheddar, alface e tomate", foto: null },
      { id: uid(), nome: "X-Burger Especial", preco: 32.9, categoria: "Lanches", descricao: "180g artesanal, queijo suíço, cebola caramelizada e molho especial", foto: null },
      { id: uid(), nome: "X-Salada", preco: 22.9, categoria: "Lanches", descricao: "Hambúrguer, queijo, alface, tomate, cebola e maionese", foto: null },
    ];
    storage.set(KEYS.produtos, produtos);
  }
}

function applyTheme() {
  document.body.classList.toggle("dark", !!settings.darkMode);
  if (toggleDark) toggleDark.checked = !!settings.darkMode;
}

function setAdminTab(tab) {
  adminTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.admin === tab));
  Object.entries(adminPages).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("is-visible", k === tab);
  });
}

function openAdmin() {
  adminEl.classList.remove("is-hidden");
  adminEl.setAttribute("aria-hidden", "false");

  if (!sessao || sessao.role !== "admin") {
    showAdminLogin();
    return;
  }

  const age = Date.now() - (sessao.lastAuthAt || 0);
  if (age > AUTH.adminReauthAfterMs) {
    showAdminLogin();
    showAlert("Sessão expirada. Faça login novamente.", "error");
    return;
  }

  showAdminApp();
}

function closeAdmin() {
  adminEl.classList.add("is-hidden");
  adminEl.setAttribute("aria-hidden", "true");
}

function showAdminLogin() {
  adminLoginEl.classList.remove("is-hidden");
  adminAppEl.classList.add("is-hidden");
  loginAdminUser.value = "admin";
  loginAdminPass.value = "admin";
}

function showAdminApp() {
  adminLoginEl.classList.add("is-hidden");
  adminAppEl.classList.remove("is-hidden");
  setAdminTab("dashboard");
  refreshAll();
}

function adminLogout() {
  sessao = storage.get(KEYS.sessao, null);
  if (sessao?.role === "admin") {
    sessao = { ...sessao, role: "none" };
    storage.set(KEYS.sessao, sessao);
  } else {
    storage.del(KEYS.sessao);
    sessao = null;
  }
  showAdminLogin();
  showAlert("Saiu da área admin ✅");
}

function getUserById(id) {
  return usuarios.find((u) => u.id === id);
}
function getProdutoById(id) {
  return produtos.find((p) => p.id === id);
}

function setClientChip() {
  const s = storage.get(KEYS.sessao, null);
  if (!s || s.role !== "cliente") {
    userChip?.classList.add("is-hidden");
    return;
  }
  const u = getUserById(s.userId);
  if (!u) {
    userChip?.classList.add("is-hidden");
    return;
  }
  userChipName.textContent = u.nome;
  userChip.classList.remove("is-hidden");
}

function clientLogout() {
  const s = storage.get(KEYS.sessao, null);
  if (!s) return;
  if (s.role === "cliente") {
    storage.del(KEYS.sessao);
    sessao = null;
    setClientChip();
    showAlert("Logout efetuado ✅");
  }
}

function renderMenu() {
  if (!menuGrid) return;

  menuGrid.innerHTML = produtos
    .map((p) => {
      const title = escapeHTML(p.nome);
      const desc = escapeHTML(p.descricao || "");
      const price = formatBRL(p.preco);
      return `
        <article class="card">
          <div class="card__img">${p.foto ? `<img src="${p.foto}" alt="${title}" style="width:100%;height:100%;object-fit:cover;max-height:120px">` : "🍔"}</div>
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

function addToCart(produtoId) {
  const found = carrinho.find((i) => i.produtoId === produtoId);
  if (found) found.qtd += 1;
  else carrinho.push({ produtoId, qtd: 1 });

  storage.set(KEYS.carrinho, carrinho);
  updateCartBadge();
  showAlert("Produto adicionado ao carrinho ✅");
}

function cartCount() {
  return carrinho.reduce((acc, i) => acc + (Number(i.qtd) || 0), 0);
}

function updateCartBadge() {
  if (!cartBtn) return;
  const n = cartCount();
  cartBtn.textContent = n > 0 ? `🛒 ${n}` : "🛒";
}

cartBtn?.addEventListener("click", () => {
  const n = cartCount();
  if (!n) return showAlert("Carrinho vazio por enquanto 😄", "error");

  const itens = carrinho
    .map((i) => {
      const p = getProdutoById(i.produtoId);
      const nome = p ? p.nome : "Produto removido";
      return `• ${nome} (x${i.qtd})`;
    })
    .join("\n");

  alert(`Carrinho (${n} itens)\n\n${itens}\n\nPróximo passo: checkout com login/cadastro do cliente (vamos montar na sequência).`);
});

function saveProdutos() { storage.set(KEYS.produtos, produtos); }
function saveUsuarios() { storage.set(KEYS.usuarios, usuarios); }
function savePedidos() { storage.set(KEYS.pedidos, pedidos); }

function resetProdutoForm() {
  produtoId.value = "";
  produtoFotoDataUrl = null;
  produtoPreview?.classList.add("is-hidden");
  if (produtoPreview) produtoPreview.src = "";
  formProduto.reset();
}
function resetUsuarioForm() {
  usuarioId.value = "";
  formUsuario.reset();
}
function resetPedidoForm() {
  formPedido.reset();
  if (pedidoQtd) pedidoQtd.value = 1;
  if (pedidoEta) pedidoEta.value = 25;
}

function renderProdutosList() {
  if (!listaProdutos) return;
  const q = (filtroProduto?.value || "").trim().toLowerCase();
  const list = produtos.filter((p) => p.nome.toLowerCase().includes(q));

  if (countProdutos) countProdutos.textContent = String(produtos.length);

  listaProdutos.innerHTML = list
    .map((p) => {
      const price = formatBRL(p.preco);
      const desc = escapeHTML(p.descricao || "");
      const fotoCell = p.foto
        ? `<div class="photo-cell"><img src="${p.foto}" alt="${escapeHTML(p.nome)}"></div>`
        : `<div class="photo-cell"><span>—</span></div>`;

      return `
        <tr>
          <td>${fotoCell}</td>
          <td><b>${escapeHTML(p.nome)}</b></td>
          <td style="max-width:420px;color:var(--muted);font-weight:700">${desc}</td>
          <td class="t-right" style="font-weight:1000;color:var(--success)">${price}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-prod="${p.id}">Editar</button>
            <button class="btn" type="button" style="background:#0b1220" data-del-prod="${p.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("[data-edit-prod]").forEach((b) =>
    b.addEventListener("click", () => editProduto(b.dataset.editProd))
  );
  $$("[data-del-prod]").forEach((b) =>
    b.addEventListener("click", () => deleteProduto(b.dataset.delProd))
  );
}

function editProduto(id) {
  const p = produtos.find((x) => x.id === id);
  if (!p) return;

  produtoId.value = p.id;
  produtoNome.value = p.nome;
  produtoPreco.value = p.preco;
  produtoCategoria.value = p.categoria;
  produtoDescricao.value = p.descricao || "";

  produtoFotoDataUrl = p.foto || null;
  if (produtoFotoDataUrl && produtoPreview) {
    produtoPreview.src = produtoFotoDataUrl;
    produtoPreview.classList.remove("is-hidden");
  } else {
    produtoPreview?.classList.add("is-hidden");
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

  if (!nome || !categoria || Number.isNaN(preco) || preco < 0) {
    return showAlert("Preencha nome, categoria e preço corretamente.", "error");
  }

  const id = produtoId.value;

  if (id) {
    const idx = produtos.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Produto não encontrado.", "error");
    produtos[idx] = { ...produtos[idx], nome, preco, categoria, descricao, foto: produtoFotoDataUrl };
    showAlert("Produto atualizado ✅");
  } else {
    produtos.push({ id: uid(), nome, preco, categoria, descricao, foto: produtoFotoDataUrl });
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

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function handleProdutoFoto(file) {
  if (!file) return;
  if (!file.type?.startsWith("image/")) {
    showAlert("Arquivo inválido. Envie uma imagem.", "error");
    return;
  }
  produtoFotoDataUrl = await readFileAsDataURL(file);
  if (produtoPreview) {
    produtoPreview.src = produtoFotoDataUrl;
    produtoPreview.classList.remove("is-hidden");
  }
  showAlert("Foto carregada ✅");
}

produtoFoto?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  await handleProdutoFoto(file);
});

if (dropzone) {
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
    })
  );
  dropzone.addEventListener("drop", async (e) => {
    const file = e.dataTransfer?.files?.[0];
    await handleProdutoFoto(file);
  });
}

function renderUsuariosList() {
  if (!listaUsuarios) return;

  const q = (filtroUsuario?.value || "").trim().toLowerCase();

  const list = usuarios.filter((u) => {
    const nome = (u.nome || "").toLowerCase();
    const user = (u.user || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return nome.includes(q) || user.includes(q) || email.includes(q);
  });

  if (countUsuarios) countUsuarios.textContent = String(usuarios.length);

  listaUsuarios.innerHTML = list
    .map((u) => {
      return `
        <tr>
          <td><b>${escapeHTML(u.nome)}</b></td>
          <td>${escapeHTML(u.user)}</td>
          <td>${escapeHTML(u.email)}</td>
          <td>${escapeHTML(u.tipo)}</td>
          <td class="t-center">
            <button class="btn btn--ghost" type="button" data-edit-user="${u.id}">Editar</button>
            <button class="btn" type="button" style="background:#0b1220" data-del-user="${u.id}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("[data-edit-user]").forEach((b) =>
    b.addEventListener("click", () => editUsuario(b.dataset.editUser))
  );
  $$("[data-del-user]").forEach((b) =>
    b.addEventListener("click", () => deleteUsuario(b.dataset.delUser))
  );
}

function editUsuario(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;

  usuarioId.value = u.id;
  usuarioNome.value = u.nome;
  usuarioUser.value = u.user;
  usuarioEmail.value = u.email;
  usuarioSenha.value = u.senha || "";
  usuarioTipo.value = u.tipo || "Cliente";
  usuarioNotif.value = u.notif || "webapp";
  usuarioWhats.value = u.whatsapp || "";

  showAlert("Editando usuário ✏️");
}

function deleteUsuario(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;

  if (u.user === "admin" && u.tipo === "Administrador") {
    return showAlert("O admin padrão não pode ser removido.", "error");
  }

  if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;

  usuarios = usuarios.filter((x) => x.id !== id);
  saveUsuarios();
  renderUsuariosList();
  refreshPedidoCombos();
  showAlert("Usuário excluído ✅");
}

function isUserTaken(user, ignoreId = null) {
  const u = String(user || "").trim().toLowerCase();
  return usuarios.some((x) => x.id !== ignoreId && String(x.user || "").toLowerCase() === u);
}

formUsuario?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = usuarioNome.value.trim();
  const user = usuarioUser.value.trim();
  const email = usuarioEmail.value.trim();
  const senha = usuarioSenha.value;
  const tipo = usuarioTipo.value;
  const notif = usuarioNotif.value;
  const whatsapp = usuarioWhats.value.trim();

  if (!nome || !user || !email || !senha || senha.length < 6) {
    return showAlert("Preencha nome, usuário, e-mail e senha (mínimo 6).", "error");
  }

  const id = usuarioId.value;

  if (isUserTaken(user, id || null)) {
    return showAlert("Esse usuário já existe. Escolha outro.", "error");
  }

  if (id) {
    const idx = usuarios.findIndex((x) => x.id === id);
    if (idx === -1) return showAlert("Usuário não encontrado.", "error");

    usuarios[idx] = { ...usuarios[idx], nome, user, email, senha, tipo, notif, whatsapp };
    showAlert("Usuário atualizado ✅");
  } else {
    usuarios.push({ id: uid(), nome, user, email, senha, tipo, notif, whatsapp });
    showAlert("Usuário cadastrado ✅");
  }

  saveUsuarios();
  resetUsuarioForm();
  renderUsuariosList();
  refreshPedidoCombos();
});

btnUsuarioCancelar?.addEventListener("click", resetUsuarioForm);
filtroUsuario?.addEventListener("input", renderUsuariosList);

function refreshPedidoCombos() {
  if (pedidoUsuario) {
    pedidoUsuario.innerHTML =
      `<option value="">Selecione um cliente</option>` +
      usuarios
        .filter((u) => u.tipo === "Cliente")
        .map((u) => `<option value="${u.id}">${escapeHTML(u.nome)} (@${escapeHTML(u.user)})</option>`)
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

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("entregue")) return { cls: "order--ok", badge: "badge--ok", ico: "✅" };
  if (s.includes("caminho")) return { cls: "order--mid", badge: "badge--mid", ico: "🛵" };
  return { cls: "order--warn", badge: "badge--warn", ico: "🕒" };
}

function notifyUserPedido(pedido) {
  const u = getUserById(pedido.usuarioId);
  if (!u) return;

  const msg = `Pedido atualizado: ${pedido.status} • ETA: ${pedido.etaMin} min`;

  if (u.notif === "whatsapp") {
    showAlert(`(Simulado) WhatsApp para ${u.whatsapp || "sem número"}: ${msg}`);
    return;
  }

  const s = storage.get(KEYS.sessao, null);
  if (s?.role === "cliente" && s.userId === u.id) {
    showAlert(msg);
  }
}

function renderPedidosList() {
  if (!listaPedidos) return;

  const q = (filtroPedido?.value || "").trim().toLowerCase();

  const list = pedidos.filter((p) => {
    const u = getUserById(p.usuarioId);
    const userName = (u?.nome || "").toLowerCase();
    const st = (p.status || "").toLowerCase();
    return userName.includes(q) || st.includes(q);
  });

  if (countPedidos) countPedidos.textContent = String(pedidos.length);

  listaPedidos.innerHTML = list
    .slice()
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .map((p) => {
      const u = getUserById(p.usuarioId);
      const prod = getProdutoById(p.produtoId);
      const userName = u?.nome || "Usuário removido";
      const prodName = prod?.nome || "Produto removido";
      const total = (prod?.preco || 0) * (p.qtd || 1);
      const st = statusStyle(p.status);

      return `
        <div class="order ${st.cls}">
          <div class="order__top">
            <div>
              <div class="order__title">Pedido ${escapeHTML(p.code)} <span class="badge ${st.badge}">${st.ico} ${escapeHTML(p.status)}</span></div>
              <div class="order__meta">
                Cliente: ${escapeHTML(userName)} • ${new Date(p.criadoEm).toLocaleString("pt-BR")}
              </div>
              <div class="order__meta">
                Produtos: ${escapeHTML(prodName)} (x${p.qtd}) • Total: <b>${formatBRL(total)}</b>
              </div>
              <div class="order__meta">
                ETA: <b>${p.etaMin} min</b>
              </div>
            </div>

            <div class="order__right">
              <div style="font-weight:1000;color:var(--success)">${formatBRL(total)}</div>
              <div style="color:var(--muted);font-weight:800;font-size:12px">${new Date(p.criadoEm).toLocaleTimeString("pt-BR")}</div>
            </div>
          </div>

          <div class="order__actions">
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Em preparo">Em preparo</button>
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="A caminho">A caminho</button>
            <button class="btn btn--ghost" type="button" data-st="${p.id}" data-new="Entregue">Entregue</button>
            <button class="btn" type="button" style="background:#0b1220" data-del-order="${p.id}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join("");

  $$("[data-st]").forEach((b) =>
    b.addEventListener("click", () => updatePedidoStatus(b.dataset.st, b.dataset.new))
  );
  $$("[data-del-order]").forEach((b) =>
    b.addEventListener("click", () => deletePedido(b.dataset.delOrder))
  );
}

function updatePedidoStatus(id, status) {
  const idx = pedidos.findIndex((x) => x.id === id);
  if (idx === -1) return;

  pedidos[idx].status = status;
  savePedidos();
  renderPedidosList();
  renderDashboard();
  notifyUserPedido(pedidos[idx]);
  showAlert("Status do pedido atualizado ✅");
}

function deletePedido(id) {
  if (!confirm("Excluir este pedido?")) return;
  pedidos = pedidos.filter((x) => x.id !== id);
  savePedidos();
  renderPedidosList();
  renderDashboard();
  showAlert("Pedido excluído ✅");
}

function makeOrderCode() {
  return Math.random().toString(16).slice(2, 6).toUpperCase();
}

formPedido?.addEventListener("submit", (e) => {
  e.preventDefault();

  const usuarioId = pedidoUsuario.value;
  const produtoId = pedidoProduto.value;
  const qtd = Number(pedidoQtd.value);
  const etaMin = Number(pedidoEta.value);
  const status = pedidoStatus.value;

  if (!usuarioId || !produtoId || Number.isNaN(qtd) || qtd < 1 || Number.isNaN(etaMin) || etaMin < 5) {
    return showAlert("Selecione cliente/produto e informe quantidade/ETA válidos.", "error");
  }

  const novo = {
    id: uid(),
    code: makeOrderCode(),
    usuarioId,
    produtoId,
    qtd,
    etaMin,
    status,
    criadoEm: new Date().toISOString(),
  };

  pedidos.push(novo);
  savePedidos();
  resetPedidoForm();
  renderPedidosList();
  renderDashboard();
  notifyUserPedido(novo);
  showAlert("Pedido criado ✅");
});

btnPedidoCancelar?.addEventListener("click", resetPedidoForm);
filtroPedido?.addEventListener("input", renderPedidosList);

function renderDashboard() {
  if (kpiTotalPedidos) kpiTotalPedidos.textContent = String(pedidos.length);
  if (kpiProdutos) kpiProdutos.textContent = String(produtos.length);

  const emPreparo = pedidos.filter((p) => String(p.status).toLowerCase().includes("preparo")).length;
  const entregues = pedidos.filter((p) => String(p.status).toLowerCase().includes("entregue")).length;

  if (kpiEmPreparo) kpiEmPreparo.textContent = String(emPreparo);
  if (kpiEntregues) kpiEntregues.textContent = String(entregues);

  if (!atividadeRecente) return;

  const rec = pedidos
    .slice()
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 6);

  atividadeRecente.innerHTML = rec
    .map((p) => {
      const u = getUserById(p.usuarioId);
      const st = statusStyle(p.status);
      const cls = st.cls === "order--ok" ? "act--ok" : st.cls === "order--mid" ? "act--mid" : "act--warn";
      const icon = st.ico;

      return `
        <div class="act ${cls}">
          <div class="act__ico">${icon}</div>
          <div>
            <div class="act__title">Pedido ${escapeHTML(p.code)} ${escapeHTML(p.status)}</div>
            <div class="act__sub">Cliente: ${escapeHTML(u?.nome || "—")} • ${new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function refreshAll() {
  renderMenu();
  renderProdutosList();
  renderUsuariosList();
  refreshPedidoCombos();
  renderPedidosList();
  renderDashboard();
  setClientChip();
  applyTheme();
  updateCartBadge();
}

btnAdmin?.addEventListener("click", openAdmin);

$("[data-admin-close]")?.addEventListener("click", () => closeAdmin());

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && adminEl && !adminEl.classList.contains("is-hidden")) {
    closeAdmin();
  }
});

adminTabs.forEach((b) => {
  b.addEventListener("click", () => setAdminTab(b.dataset.admin));
});

btnVoltarLoja?.addEventListener("click", () => {
  closeAdmin();
});

btnSair?.addEventListener("click", () => {
  adminLogout();
});

btnLogout?.addEventListener("click", clientLogout);

formLoginAdmin?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = loginAdminUser.value.trim();
  const pass = loginAdminPass.value;

  btnEntrarAdmin.classList.add("is-loading");
  btnEntrarAdmin.disabled = true;

  await new Promise((r) => setTimeout(r, AUTH.entrarDelayMs));

  const u = usuarios.find(
    (x) => x.tipo === "Administrador" && String(x.user).toLowerCase() === String(user).toLowerCase()
  );

  if (!u || u.senha !== pass) {
    btnEntrarAdmin.classList.remove("is-loading");
    btnEntrarAdmin.disabled = false;
    return showAlert("Acesso negado. Usuário/senha inválidos.", "error");
  }

  sessao = {
    role: "admin",
    userId: u.id,
    lastAuthAt: Date.now(),
  };
  storage.set(KEYS.sessao, sessao);

  btnEntrarAdmin.classList.remove("is-loading");
  btnEntrarAdmin.disabled = false;

  showAlert("Bem-vindo, admin ✅");
  showAdminApp();
});

toggleDark?.addEventListener("change", () => {
  settings = { ...settings, darkMode: !!toggleDark.checked };
  storage.set(KEYS.settings, settings);
  applyTheme();
});

function init() {
  ensureDefaults();

  settings = storage.get(KEYS.settings, { darkMode: false });
  applyTheme();

  sessao = storage.get(KEYS.sessao, null);
  setClientChip();

  setAdminTab("dashboard");
  refreshAll();
}

init();
