const Admin = (() => {
  const s = Store.state;

  // views
  const viewMap = {
    dashboard: "view-dashboard",
    produtos: "view-produtos",
    usuarios: "view-usuarios",
    pedidos: "view-pedidos",
    config: "view-config",
  };

  // produtos temp img
  let currentProductImgDataUrl = "";

  // pedidos: itens temporários do form
  let pendingItems = [];

  function setActiveView(name) {
    document.querySelectorAll(".nav__item").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.view === name)
    );

    Object.entries(viewMap).forEach(([k, id]) => {
      const el = document.getElementById(id);
      el?.classList.toggle("is-active", k === name);
    });

    // quando entrar em pedidos, garante inputs/itens atualizados
    if (name === "pedidos") {
      refreshOrderInputs();
      renderOrders();
    }
  }

  function setupNav() {
    document.querySelectorAll(".nav__item").forEach((btn) => {
      btn.addEventListener("click", () => setActiveView(btn.dataset.view));
    });
  }

  function setupLogout() {
    document.getElementById("btnLogout")?.addEventListener("click", () => Auth.logout());
  }

  function refreshDashboard() {
    const total = s.pedidos.length;

    // Em andamento = Em preparação + A caminho
    const inProgress = s.pedidos.filter((o) => o.status !== "Entregue").length;

    const done = s.pedidos.filter((o) => o.status === "Entregue").length;
    const produtos = s.produtos.length;

    document.getElementById("kpiTotalPedidos").textContent = String(total);
    document.getElementById("kpiPreparacao").textContent = String(inProgress);
    document.getElementById("kpiEntregues").textContent = String(done);
    document.getElementById("kpiProdutos").textContent = String(produtos);

    const list = document.getElementById("activityList");
    if (!list) return;

    const icon = (type) => {
      if (type === "done") return "✓";
      if (type === "prep") return "⏱";
      return "🛒";
    };

    // Limita para ficar fiel ao layout (3 itens no painel)
    const items = (s.activities || []).slice(0, 3);

    list.innerHTML = items
      .map((a) => {
        const cls =
          a.type === "done" ? "act--green" : a.type === "prep" ? "act--orange" : "act--blue";

        return `
          <div class="actItem ${cls}">
            <div class="actItem__ico">${icon(a.type)}</div>
            <div>
              <div class="actItem__t">${UI.escapeHtml(a.title)}</div>
              <div class="actItem__s">${UI.escapeHtml(Store.activitySubtitle(a))}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // ---------- PRODUTOS ----------
  function renderProdutos() {
    document.getElementById("prodCount").textContent = String(s.produtos.length);

    const tbody = document.querySelector("#tableProdutos tbody");
    if (!tbody) return;

    tbody.innerHTML = s.produtos
      .map(
        (p) => `
      <tr>
        <td>
          ${
            p.imgDataUrl
              ? `<img class="imgThumb" src="${p.imgDataUrl}" alt="Imagem ${UI.escapeHtml(
                  p.nome
                )}" />`
              : `<div class="imgThumb" style="display:grid;place-items:center;color:var(--muted)">—</div>`
          }
        </td>
        <td>${UI.escapeHtml(p.tipo)}</td>
        <td><strong>${UI.escapeHtml(p.nome)}</strong></td>
        <td class="trunc" title="${UI.escapeHtml(p.desc)}">${UI.escapeHtml(p.desc)}</td>
        <td class="right"><strong style="color: var(--green)">${Store.moneyBR(p.preco)}</strong></td>
        <td class="right">
          <button class="iconBtn" data-del-prod="${p.id}" title="Excluir">🗑</button>
        </td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll("[data-del-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-del-prod"));
        const idx = s.produtos.findIndex((x) => x.id === id);
        if (idx < 0) return;

        const prod = s.produtos[idx];
        s.produtos.splice(idx, 1);

        Store.addActivity("new", "Produto removido", `Produto: ${prod.nome}`);
        Store.save(); // ✅ persistência
        UI.toast("Produto removido.");

        renderProdutos();
        refreshOrderInputs();
        refreshDashboard();
      });
    });
  }

  function setupDropzone() {
    const dz = document.getElementById("dropzone");
    const input = document.getElementById("pImagem");
    const preview = document.getElementById("dropPreview");

    if (!dz || !input || !preview) return;

    const openPicker = () => input.click();

    dz.addEventListener("click", openPicker);

    // teclado (acessibilidade e UX)
    dz.setAttribute("tabindex", "0");
    dz.setAttribute("role", "button");
    dz.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    });

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      await handleProductFile(file);
    });

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("is-drag");
    });

    dz.addEventListener("dragleave", () => dz.classList.remove("is-drag"));

    dz.addEventListener("drop", async (e) => {
      e.preventDefault();
      dz.classList.remove("is-drag");
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      await handleProductFile(file);
    });

    async function handleProductFile(file) {
      if (!file.type.startsWith("image/")) {
        UI.toast("Envie um arquivo de imagem.");
        return;
      }
      currentProductImgDataUrl = await UI.readFileAsDataURL(file);
      preview.innerHTML = `<img src="${currentProductImgDataUrl}" alt="Preview" />`;
      UI.toast("Imagem carregada!");
    }
  }

  function setupProdutoForm() {
    const form = document.getElementById("formProduto");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const tipo = document.getElementById("pTipo").value.trim();
      const nome = document.getElementById("pNome").value.trim();
      const preco = Number(document.getElementById("pPreco").value);
      const desc = document.getElementById("pDesc").value.trim();

      if (!tipo || !nome || !desc || !Number.isFinite(preco) || preco < 0) {
        UI.toast("Preencha os campos corretamente.");
        return;
      }

      const p = {
        id: s.seq.produto++,
        tipo,
        nome,
        preco,
        desc,
        imgDataUrl: currentProductImgDataUrl,
      };

      s.produtos.unshift(p);

      Store.addActivity("new", "Produto cadastrado", `Produto: ${nome}`);
      Store.save(); // ✅ persistência
      UI.toast("Produto cadastrado!");

      // reset
      form.reset();
      currentProductImgDataUrl = "";
      const pv = document.getElementById("dropPreview");
      if (pv) pv.innerHTML = "";

      renderProdutos();
      refreshOrderInputs();
      refreshDashboard();
    });
  }

  // ---------- USUÁRIOS ----------
  function renderUsuarios() {
    document.getElementById("userCount").textContent = String(s.usuarios.length);

    const tbody = document.querySelector("#tableUsuarios tbody");
    if (!tbody) return;

    tbody.innerHTML = s.usuarios
      .map(
        (u) => `
      <tr>
        <td><strong>${UI.escapeHtml(u.nome)}</strong></td>
        <td>${UI.escapeHtml(u.username)}</td>
        <td class="right">
          <button class="iconBtn" data-del-user="${u.id}" title="Excluir">🗑</button>
        </td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll("[data-del-user]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-del-user"));
        const hasOrders = s.pedidos.some((o) => o.clienteId === id);
        if (hasOrders) {
          UI.toast("Não é possível excluir: usuário tem pedidos.");
          return;
        }

        const idx = s.usuarios.findIndex((x) => x.id === id);
        if (idx < 0) return;

        const u = s.usuarios[idx];
        s.usuarios.splice(idx, 1);

        Store.addActivity("new", "Usuário removido", `Usuário: ${u.username}`);
        Store.save(); // ✅ persistência
        UI.toast("Usuário removido.");

        renderUsuarios();
        refreshOrderInputs();
        refreshDashboard();
      });
    });
  }

  function setupUserSuggest() {
    const nome = document.getElementById("uNome");
    const user = document.getElementById("uUser");
    const hint = document.getElementById("userHint");
    const btnCheck = document.getElementById("btnCheckUser");

    if (!nome || !user || !hint || !btnCheck) return;

    nome.addEventListener("input", () => {
      const sug = Store.suggestUsername(nome.value);
      if (!sug) return;
      user.value = sug;
      hint.textContent = `Sugestão: "${sug}". Você pode editar e verificar disponibilidade.`;
      hint.style.color = "var(--muted)";
    });

    btnCheck.addEventListener("click", () => {
      const raw = user.value.trim();
      const val = Store.slugifyUser(raw);

      if (!val) {
        hint.textContent = "❌ Informe um usuário válido.";
        hint.style.color = "var(--danger)";
        UI.toast("Informe um usuário válido.");
        return;
      }

      user.value = val; // normaliza
      const ok = Store.isUsernameAvailable(val);

      hint.textContent = ok ? "✅ Usuário disponível." : "❌ Usuário indisponível. Tente outro.";
      hint.style.color = ok ? "var(--green)" : "var(--danger)";
      UI.toast(ok ? "Usuário disponível." : "Usuário indisponível.");
    });

    user.addEventListener("input", () => {
      hint.textContent = "Clique em “Verificar” para checar disponibilidade.";
      hint.style.color = "var(--muted)";
    });
  }

  function setupUsuarioForm() {
    const form = document.getElementById("formUsuario");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = document.getElementById("uNome").value.trim();
      const username = Store.slugifyUser(document.getElementById("uUser").value.trim());
      const senha = document.getElementById("uSenha").value;

      if (!nome || !username || !senha || senha.length < 6) {
        UI.toast("Preencha corretamente. Senha mín. 6.");
        return;
      }
      if (!Store.isUsernameAvailable(username)) {
        UI.toast("Usuário indisponível. Escolha outro.");
        return;
      }

      s.usuarios.unshift({ id: s.seq.usuario++, nome, username, senha });

      Store.addActivity("new", "Novo usuário cadastrado", `Usuário: ${username}`);
      Store.save(); // ✅ persistência
      UI.toast("Usuário cadastrado!");

      form.reset();

      const hint = document.getElementById("userHint");
      if (hint) {
        hint.textContent = "Sugestão automática baseada no nome. Você pode editar.";
        hint.style.color = "var(--muted)";
      }

      renderUsuarios();
      refreshOrderInputs();
      refreshDashboard();
    });
  }

  // ---------- PEDIDOS ----------
  function refreshOrderInputs() {
    const selCliente = document.getElementById("oCliente");
    const selProduto = document.getElementById("oProduto");

    if (selCliente) {
      if (!s.usuarios.length) {
        selCliente.innerHTML = `<option value="">Cadastre um usuário</option>`;
        selCliente.disabled = true;
      } else {
        selCliente.disabled = false;
        selCliente.innerHTML =
          `<option value="">Selecione um cliente</option>` +
          s.usuarios.map((u) => `<option value="${u.id}">${UI.escapeHtml(u.nome)}</option>`).join("");
      }
    }

    if (selProduto) {
      if (!s.produtos.length) {
        selProduto.innerHTML = `<option value="">Cadastre um produto</option>`;
        selProduto.disabled = true;
      } else {
        selProduto.disabled = false;
        selProduto.innerHTML = s.produtos
          .map((p) => `<option value="${p.id}">${UI.escapeHtml(p.nome)}</option>`)
          .join("");
      }
    }

    renderPendingItems();
  }

  function addItemToPending(prodId) {
    const p = s.produtos.find((x) => x.id === Number(prodId));
    if (!p) return;

    const found = pendingItems.find((i) => i.produtoId === p.id);
    if (found) found.qtd += 1;
    else pendingItems.push({ produtoId: p.id, nome: p.nome, preco: p.preco, qtd: 1 });

    renderPendingItems();
  }

  function removePendingItem(prodId) {
    const idx = pendingItems.findIndex((i) => i.produtoId === prodId);
    if (idx >= 0) pendingItems.splice(idx, 1);
    renderPendingItems();
  }

  function renderPendingItems() {
    const box = document.getElementById("orderItems");
    if (!box) return;

    if (!pendingItems.length) {
      box.innerHTML = `<span class="hint">Nenhum item adicionado ainda.</span>`;
      return;
    }

    box.innerHTML = pendingItems
      .map(
        (i) => `
      <span class="chip">
        ${UI.escapeHtml(i.nome)} x${i.qtd}
        <button type="button" data-rm="${i.produtoId}" title="Remover">×</button>
      </span>
    `
      )
      .join("");

    box.querySelectorAll("[data-rm]").forEach((b) => {
      b.addEventListener("click", () => removePendingItem(Number(b.getAttribute("data-rm"))));
    });
  }

  function orderTotal(o) {
    return o.itens.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  }

  function statusKey(status) {
    if (status === "Entregue") return "done";
    if (status === "A caminho") return "way";
    return "prep";
  }

  function renderOrders() {
    document.getElementById("orderCount").textContent = String(s.pedidos.length);

    const list = document.getElementById("ordersList");
    if (!list) return;

    list.innerHTML = s.pedidos
      .slice()
      .sort((a, b) => b.id - a.id)
      .map((o) => {
        const key = statusKey(o.status);
        const cls =
          key === "done" ? "orderCard--done" : key === "way" ? "orderCard--way" : "orderCard--prep";
        const badgeCls =
          key === "done" ? "badge--done" : key === "way" ? "badge--way" : "badge--prep";

        const cliente = s.usuarios.find((u) => u.id === o.clienteId)?.nome || "—";
        const total = Store.moneyBR(orderTotal(o));
        const itens = o.itens.map((i) => `${i.qtd} x ${UI.escapeHtml(i.nome)}`).join("<br/>");

        const showEta = o.status !== "Entregue";
        const etaLine = showEta
          ? `<div class="orderMeta"><strong>ETA:</strong> <input class="etaInput" data-eta="${o.id}" type="number" min="1" value="${o.etaMin}" /> min</div>`
          : `<div class="orderMeta"><strong>ETA:</strong> entregue</div>`;

        const nextButtons =
          o.status === "Em preparação"
            ? `<button class="btnStatus btnStatus--way" data-status="${o.id}" data-to="A caminho">Marcar como A caminho</button>`
            : o.status === "A caminho"
              ? `<button class="btnStatus btnStatus--done" data-status="${o.id}" data-to="Entregue">Marcar como Entregue</button>`
              : `<button class="btnStatus btnStatus--prep" data-status="${o.id}" data-to="Em preparação">Voltar para Em preparação</button>`;

        return `
          <article class="orderCard ${cls}">
            <div class="orderTop">
              <div>
                <div class="orderTitle">
                  Pedido nº ${String(o.id).padStart(3,"0")}
                  <span class="badge ${badgeCls}">${o.status}</span>
                </div>
                <div class="orderMeta">Cliente: ${UI.escapeHtml(cliente)}</div>
              </div>

              <div style="text-align:right">
                <div style="font-weight:900;color:var(--green)">${total}</div>
                <div class="orderMeta">${UI.escapeHtml(o.timeLabel || Store.nowTime())}</div>
              </div>
            </div>

            <div class="orderBody">
              <div class="orderMeta"><strong>Produtos:</strong></div>
              <div style="margin-top:8px; color: var(--muted)">${itens || "—"}</div>
              ${etaLine}
            </div>

            <div class="orderActions">
              ${nextButtons}
            </div>
          </article>
        `;
      })
      .join("");

    // status buttons
    list.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-status"));
        const to = btn.getAttribute("data-to");
        const o = s.pedidos.find((x) => x.id === id);
        if (!o) return;

        o.status = to;

        Store.addActivity(
          to === "Entregue" ? "done" : to === "Em preparação" ? "prep" : "new",
          `Pedido #${String(id).padStart(3, "0")} ${to.toLowerCase()}`,
          `Atualizado agora`
        );

        Store.save(); // ✅ persistência
        UI.toast("Status atualizado!");
        renderOrders();
        refreshDashboard();
      });
    });

    // ETA input
    list.querySelectorAll(".etaInput").forEach((inp) => {
      inp.addEventListener("change", () => {
        const id = Number(inp.getAttribute("data-eta"));
        const o = s.pedidos.find((x) => x.id === id);
        if (!o) return;

        const newEta = Math.max(1, Number(inp.value || 1));
        o.etaMin = newEta;

        Store.addActivity("prep", "ETA atualizado", `Pedido #${String(id).padStart(3, "0")} — ${newEta} min`);
        Store.save(); // ✅ persistência
        UI.toast("ETA atualizado!");

        refreshDashboard();
      });
    });
  }

  function setupOrderForm() {
    document.getElementById("btnAddItem")?.addEventListener("click", () => {
      const sel = document.getElementById("oProduto");
      const val = sel?.value;
      if (!val) return;
      addItemToPending(val);
    });

    const form = document.getElementById("formPedido");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const clienteId = Number(document.getElementById("oCliente").value);
      const etaMin = Math.max(1, Number(document.getElementById("oEta").value || 20));

      if (!clienteId) {
        UI.toast("Selecione um cliente.");
        return;
      }
      if (!pendingItems.length) {
        UI.toast("Adicione ao menos 1 produto.");
        return;
      }

      const id = s.seq.pedido++;
      const o = {
        id,
        clienteId,
        itens: pendingItems.map((i) => ({ ...i })),
        status: "Em preparação",
        etaMin,
        createdAt: Date.now(),
        timeLabel: Store.nowTime(),
      };

      s.pedidos.unshift(o);

      Store.addActivity(
        "new",
        "Novo pedido",
        `Cliente: ${s.usuarios.find((u) => u.id === clienteId)?.nome || "—"} — agora`
      );

      Store.save(); // ✅ persistência
      UI.toast("Pedido criado!");

      pendingItems = [];
      form.reset();

      const etaField = document.getElementById("oEta");
      if (etaField) etaField.value = "20";

      refreshOrderInputs();
      renderOrders();
      refreshDashboard();
    });
  }

  // ---------- SETTINGS ----------
  function setupDarkMode() {
    const toggle = document.getElementById("darkToggle");
    if (!toggle) return;

    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    toggle.checked = saved === "dark";

    toggle.addEventListener("change", () => {
      const theme = toggle.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      UI.toast(theme === "dark" ? "Modo escuro ativado." : "Modo claro ativado.");
    });
  }

  function init() {
    Store.seedDemoIfEmpty();

    setupNav();
    setupLogout();

    setupDropzone();
    setupProdutoForm();

    setupUserSuggest();
    setupUsuarioForm();

    setupOrderForm();
    setupDarkMode();

    renderProdutos();
    renderUsuarios();
    refreshOrderInputs();
    renderOrders();
    refreshDashboard();
  }

  return { init };
})();
