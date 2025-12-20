const Store = (() => {
  const STORAGE_KEY = "burger_place_admin_state_v1";

  const state = {
    produtos: [],
    usuarios: [],
    pedidos: [],
    activities: [],
    seq: { produto: 1, usuario: 1, pedido: 9 } // começa em 9 pq seed usa 6/7/8
  };

  function moneyBR(n) {
    const v = Number(n || 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function nowTime() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function slugifyUser(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s._-]/g, "")
      .replace(/\s+/g, ".")
      .replace(/\.+/g, ".")
      .replace(/^\.|\.$/g, "");
  }

  function isUsernameAvailable(username) {
    const u = slugifyUser(username);
    if (!u) return false;
    return !state.usuarios.some(x => x.username === u);
  }

  function suggestUsername(fullName) {
    const base = slugifyUser(fullName);
    if (!base) return "";
    if (isUsernameAvailable(base)) return base;

    for (let i = 2; i <= 99; i++) {
      const candidate = `${base}${i}`;
      if (isUsernameAvailable(candidate)) return candidate;
    }
    return `${base}${Math.floor(Math.random() * 999)}`;
  }

  // ---------- Atividades ----------
  function timeAgo(ts) {
    const diff = Math.max(0, Date.now() - Number(ts || Date.now()));
    const min = Math.floor(diff / 60000);

    if (min <= 0) return "agora";
    if (min < 60) return `há ${min} minuto${min === 1 ? "" : "s"}`;

    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} hora${h === 1 ? "" : "s"}`;

    const d = Math.floor(h / 24);
    return `há ${d} dia${d === 1 ? "" : "s"}`;
  }

  function makeId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function addActivity(type, title, subtitleBase) {
    state.activities.unshift({
      id: makeId(),
      type,
      title,
      subtitleBase: subtitleBase || "",
      ts: Date.now()
    });

    state.activities = state.activities.slice(0, 8);
    save(); // ✅ persiste sempre que cria atividade
  }

  function activitySubtitle(a) {
    const base = String(a?.subtitleBase || "").trim();
    const suffix = timeAgo(a?.ts);
    return base ? `${base} — ${suffix}` : suffix;
  }

  // ---------- Persistência ----------
  function sanitizeLoaded(obj) {
    const safe = {
      produtos: Array.isArray(obj?.produtos) ? obj.produtos : [],
      usuarios: Array.isArray(obj?.usuarios) ? obj.usuarios : [],
      pedidos: Array.isArray(obj?.pedidos) ? obj.pedidos : [],
      activities: Array.isArray(obj?.activities) ? obj.activities : [],
      seq: obj?.seq && typeof obj.seq === "object" ? obj.seq : { produto: 1, usuario: 1, pedido: 1 }
    };

    // garante seq mínima coerente
    safe.seq.produto = Number(safe.seq.produto || 1);
    safe.seq.usuario = Number(safe.seq.usuario || 1);
    safe.seq.pedido = Number(safe.seq.pedido || 1);

    return safe;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      const safe = sanitizeLoaded(parsed);

      state.produtos = safe.produtos;
      state.usuarios = safe.usuarios;
      state.pedidos = safe.pedidos;
      state.activities = safe.activities;
      state.seq = safe.seq;

      // safety: se já existem pedidos, seq.pedido deve ser > maior id
      const maxPedido = state.pedidos.reduce((m, o) => Math.max(m, Number(o.id || 0)), 0);
      if (maxPedido > 0) state.seq.pedido = Math.max(state.seq.pedido, maxPedido + 1);

      const maxProd = state.produtos.reduce((m, p) => Math.max(m, Number(p.id || 0)), 0);
      if (maxProd > 0) state.seq.produto = Math.max(state.seq.produto, maxProd + 1);

      const maxUser = state.usuarios.reduce((m, u) => Math.max(m, Number(u.id || 0)), 0);
      if (maxUser > 0) state.seq.usuario = Math.max(state.seq.usuario, maxUser + 1);

      return true;
    } catch {
      return false;
    }
  }

  function save() {
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, payload);
    } catch {
      // se der ruim, só não quebra a app
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---------- Seed ----------
  function seedDemoIfEmpty() {
    // 1) tenta carregar antes
    const loaded = load();
    if (loaded) return;

    // 2) se não existe nada salvo, gera demo
    if (state.produtos.length || state.usuarios.length || state.pedidos.length) return;

    // usuários
    const u1 = { id: state.seq.usuario++, nome: "Maria Oliveira", username: "maria.oliveira", senha: "123456" };
    const u2 = { id: state.seq.usuario++, nome: "Pedro Santos", username: "pedro.santos", senha: "123456" };
    const u3 = { id: state.seq.usuario++, nome: "Ana Silva", username: "ana.silva", senha: "123456" };
    state.usuarios.push(u1, u2, u3);

    // produtos
    const p1 = { id: state.seq.produto++, tipo: "Hambúrguer", nome: "X-Bacon", desc: "Hambúrguer, bacon crocante, queijo cheddar, alface e tomate", preco: 25.9, imgDataUrl: "" };
    const p2 = { id: state.seq.produto++, tipo: "Hambúrguer", nome: "X-Burger Especial", desc: "Hambúrguer artesanal 180g, queijo suíço, cebola caramelizada e molho", preco: 32.9, imgDataUrl: "" };
    const p3 = { id: state.seq.produto++, tipo: "Hambúrguer", nome: "X-Salada", desc: "Hambúrguer, queijo, alface, tomate, cebola e maionese", preco: 22.9, imgDataUrl: "" };
    state.produtos.push(p1, p2, p3);

    // pedidos 006/007/008
    state.pedidos.push(
      {
        id: 8,
        clienteId: u3.id,
        itens: [
          { produtoId: p2.id, nome: p2.nome, preco: p2.preco, qtd: 1 },
          { produtoId: p1.id, nome: p1.nome, preco: p1.preco, qtd: 1 },
        ],
        status: "Entregue",
        etaMin: 0,
        createdAt: Date.now() - 5 * 60_000,
        timeLabel: "08:04"
      },
      {
        id: 7,
        clienteId: u2.id,
        itens: [{ produtoId: p1.id, nome: p1.nome, preco: p1.preco, qtd: 2 }],
        status: "Em preparação",
        etaMin: 15,
        createdAt: Date.now() - 12 * 60_000,
        timeLabel: "07:57"
      },
      {
        id: 6,
        clienteId: u1.id,
        itens: [{ produtoId: p2.id, nome: p2.nome, preco: p2.preco, qtd: 2 }],
        status: "Em preparação",
        etaMin: 25,
        createdAt: Date.now() - 20 * 60_000,
        timeLabel: "07:44"
      }
    );

    state.activities = [
      { id: makeId(), type: "done", title: "Pedido nº 008 entregue", subtitleBase: "Cliente: Ana Silva", ts: Date.now() - 5 * 60_000 },
      { id: makeId(), type: "prep", title: "Pedido #007 em preparação", subtitleBase: "Cliente: Pedro Santos", ts: Date.now() - 12 * 60_000 },
      { id: makeId(), type: "new", title: "Novo pedido", subtitleBase: "Cliente: Maria Oliveira", ts: Date.now() - 20 * 60_000 },
    ];

    // garante seq.pedido correto após seed
    state.seq.pedido = 9;

    save();
  }

  return {
    state,
    moneyBR,
    nowTime,
    slugifyUser,
    suggestUsername,
    isUsernameAvailable,
    addActivity,
    activitySubtitle,
    timeAgo,
    seedDemoIfEmpty,
    save,
    load,
    clear,
  };
})();
