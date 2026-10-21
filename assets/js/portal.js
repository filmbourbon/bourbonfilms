/* Bourbon Films · área do cliente e painel interno (Firebase) */
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js?v=20261021q';
const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
let A, U, F; // módulos do Firebase (app, auth, firestore)

const ETAPAS = ['Briefing', 'Roteiro', 'Gravação', 'Edição', 'Revisão', 'Entregue'];
/* Clientes da casa: aparecem no painel para consulta interna */
const CLIENTES_BASE = ['Academia Korpus', 'Fazenda Coruja', 'Instituto Pachu', 'Matuta', "L'Oréal Paris", 'Assaí Atacadista', 'Unifip', 'Redepharma', 'CityMix'];
const MODE = document.body.dataset.portal; // "cliente" ou "admin"
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => /^https:\/\//i.test(u || '') ? u : '#';
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const show = (id) => document.querySelectorAll('[data-view]').forEach(v => { v.hidden = v.dataset.view !== id; });
const msg = (text, ok) => { const m = $('#authMsg'); if (m) { m.textContent = text || ''; m.classList.toggle('ok', !!ok); } };
const isAdminEmail = (e) => ADMIN_EMAILS.map(x => x.toLowerCase()).includes(String(e || '').toLowerCase());

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('COLE')) {
  show('setup');
} else {
  Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')])
    .then(([a, u, f]) => { A = a; U = u; F = f; start(); })
    .catch(() => { show('login'); msg('Não foi possível carregar o acesso. Verifique sua conexão e atualize a página.'); });
}

function erroAmigavel(e) {
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'E-mail ou senha incorretos. Confira os dados ou use "Esqueci minha senha".';
  if (c.includes('email-already-in-use')) return 'Este e-mail já tem conta. Use a aba "Entrar" ou "Continuar com o Google".';
  if (c.includes('weak-password')) return 'Escolha uma senha com pelo menos 8 caracteres.';
  if (c.includes('invalid-email')) return 'Confira o e-mail digitado.';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'A janela do Google foi fechada antes de concluir. Tente de novo.';
  if (c.includes('too-many-requests')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (c.includes('unauthorized-domain')) return 'Este endereço ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados). [' + c + ']';
  if (c.includes('operation-not-allowed')) return 'Este método de login ainda não foi ativado no Firebase (Authentication > Método de login). [' + c + ']';
  if (c.includes('configuration-not-found')) return 'O login ainda não foi ativado no Firebase (Authentication > Vamos começar). [' + c + ']';
  if (c.includes('network-request-failed')) return 'Sem conexão com o servidor de login. Desative bloqueadores (Brave Shields) para este site e tente de novo. [' + c + ']';
  return 'Não foi possível concluir agora. Tente de novo. [' + (c || (e && e.message) || 'erro') + ']';
}
function erroBanco(e) {
  const c = (e && e.code) || '';
  if (c.includes('permission-denied')) return 'Sem permissão no banco. Publique as regras novas do Firestore. [' + c + ']';
  if (c.includes('not-found') || c.includes('failed-precondition')) return 'O banco Firestore ainda não foi criado neste projeto. [' + c + ']';
  if (c.includes('unavailable')) return 'Banco indisponível agora. Verifique a conexão ou bloqueadores. [' + c + ']';
  return 'Não foi possível carregar. [' + (c || (e && e.message) || 'erro') + ']';
}

/* abas acessíveis (setas do teclado trocam a aba) */
function tabs(list, onChange) {
  const btns = [...list.querySelectorAll('[role=tab]')];
  const select = (b, focus) => {
    btns.forEach(x => {
      const on = x === b;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      const p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) b.focus();
    if (onChange) onChange(b);
  };
  btns.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        ev.preventDefault();
        select(btns[(i + (ev.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length], true);
      }
    });
  });
  return select;
}

/* abas Entrar / Criar conta funcionam mesmo antes do Firebase carregar */
const tabList = $('.pt-tabs[aria-label="Acesso"]');
if (tabList) tabs(tabList, () => msg(''));

function start() {
  const app = A.initializeApp(firebaseConfig);
  const auth = U.getAuth(app);
  auth.languageCode = 'pt';
  const db = F.getFirestore(app);
  const here = location.origin + location.pathname;

  /* Google */
  $('#btnGoogle').addEventListener('click', async () => {
    const p = new U.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    msg('');
    try { await U.signInWithPopup(auth, p); }
    catch (e) {
      if ((e.code || '').includes('popup-blocked')) return U.signInWithRedirect(auth, p);
      msg(erroAmigavel(e));
    }
  });

  /* entrar com e-mail e senha */
  $('#pane-entrar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $('#authEmail').value.trim(), pass = $('#authPass').value;
    if (!email || !pass) { msg('Preencha e-mail e senha.'); (email ? $('#authPass') : $('#authEmail')).focus(); return; }
    const b = ev.submitter || $('#pane-entrar [type=submit]'); b.disabled = true; b.textContent = 'Entrando…';
    try { await U.signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { msg(erroAmigavel(e)); }
    b.disabled = false; b.textContent = 'Entrar';
  });
  $('#btnEsqueci').addEventListener('click', async () => {
    const email = $('#authEmail').value.trim();
    if (!email) { msg('Digite seu e-mail acima para receber o link de nova senha.'); $('#authEmail').focus(); return; }
    try { await U.sendPasswordResetEmail(auth, email); msg('Enviamos um link para criar uma nova senha. Confira também o spam.', true); }
    catch (e) { msg(erroAmigavel(e)); }
  });

  /* criar conta do zero */
  const criar = $('#pane-criar');
  if (criar) criar.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const nome = $('#cNome').value.trim(), email = $('#cEmail').value.trim();
    const s1 = $('#cPass').value, s2 = $('#cPass2').value;
    if (!nome) { msg('Digite seu nome completo.'); $('#cNome').focus(); return; }
    if (!email) { msg('Digite seu e-mail.'); $('#cEmail').focus(); return; }
    if (s1.length < 8) { msg('Escolha uma senha com pelo menos 8 caracteres.'); $('#cPass').focus(); return; }
    if (s1 !== s2) { msg('As senhas não conferem.'); $('#cPass2').focus(); return; }
    if (!$('#cAceite').checked) { msg('Para criar a conta, aceite a Política de Privacidade.'); $('#cAceite').focus(); return; }
    const b = ev.submitter || criar.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Criando conta…';
    try {
      const cred = await U.createUserWithEmailAndPassword(auth, email, s1);
      await U.updateProfile(cred.user, { displayName: nome });
      try { await F.setDoc(F.doc(db, 'usuarios', cred.user.uid), { nome, email: email.toLowerCase(), criadoEm: F.serverTimestamp() }); } catch (e) {}
      await U.sendEmailVerification(cred.user, { url: here });
    } catch (e) { msg(erroAmigavel(e)); }
    b.disabled = false; b.textContent = 'Criar conta';
  });

  /* confirmação de e-mail */
  $('#btnReenviar').addEventListener('click', async () => {
    try { await U.sendEmailVerification(auth.currentUser, { url: here }); $('#verifyMsg').textContent = 'Enviado. Confira sua caixa de entrada e o spam.'; }
    catch (e) { $('#verifyMsg').textContent = erroAmigavel(e); }
  });
  $('#btnJaConfirmei').addEventListener('click', async () => {
    try { await auth.currentUser.reload(); } catch (e) {}
    if (auth.currentUser && auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); entrar(auth.currentUser); }
    else $('#verifyMsg').textContent = 'Ainda não identificamos a confirmação. Abra o link do e-mail e tente de novo.';
  });
  document.querySelectorAll('[data-sair]').forEach(b => b.addEventListener('click', () => U.signOut(auth)));

  const entrar = async (user) => {
    document.querySelectorAll('[data-user]').forEach(el => { el.textContent = (user.displayName || user.email).split(' ')[0]; });
    if (MODE === 'admin') {
      if (!isAdminEmail(user.email)) {
        const n = $('[data-view="negado"] .muted'); if (n) n.textContent = 'Você entrou como ' + user.email + '. Este painel é só para a equipe da Bourbon Films.';
        show('negado'); return;
      }
      show('painel'); carregarAdmin(db);
    } else {
      /* registra o perfil de quem entra pelo Google pela primeira vez */
      try {
        const ref = F.doc(db, 'usuarios', user.uid);
        const snap = await F.getDoc(ref);
        if (!snap.exists()) await F.setDoc(ref, { nome: user.displayName || '', email: (user.email || '').toLowerCase(), criadoEm: F.serverTimestamp() });
      } catch (e) {}
      show('painel'); carregarCliente(db, user.email.toLowerCase());
    }
  };

  U.onAuthStateChanged(auth, (user) => {
    if (!user) { show('login'); return; }
    if (!user.emailVerified) { $('#verifyEmail').textContent = user.email; show('verify'); return; }
    entrar(user);
  });
}

/* ---------- área do cliente ---------- */
function etapasHTML(status) {
  return '<ol class="pt-steps" aria-label="Andamento">' + ETAPAS.map((e, i) =>
    `<li class="${i < status ? 'done' : ''}${i === status ? ' now' : ''}"${i === status ? ' aria-current="step"' : ''}><span>${esc(e)}</span></li>`).join('') + '</ol>';
}
function entregasHTML(list) {
  if (!list || !list.length) return '<p class="pt-empty-line">As entregas aparecem aqui assim que estiverem prontas.</p>';
  return '<ul class="pt-files">' + list.map(f =>
    `<li><span><b>${esc(f.titulo || 'Entrega')}</b>${f.data ? `<small>${esc(f.data)}</small>` : ''}</span><a class="btn btn--ghost" href="${esc(safeUrl(f.url))}" target="_blank" rel="noopener">Abrir no Drive</a></li>`).join('') + '</ul>';
}
async function carregarCliente(db, email) {
  const box = $('#projetos');
  box.innerHTML = '<p class="muted">Carregando seus projetos…</p>';
  try {
    const snap = await F.getDocs(F.query(F.collection(db, 'projetos'), F.where('clienteEmail', '==', email)));
    const itens = snap.docs.map(d => d.data()).sort((a, b) => (b.atualizadoEm?.seconds || 0) - (a.atualizadoEm?.seconds || 0));
    if (!itens.length) {
      box.innerHTML = `<div class="pt-empty"><h2 class="h3">Nenhum projeto por aqui ainda.</h2><p class="muted">Assim que seu projeto começar, ele aparece aqui com etapas, prazo e entregas.</p></div>`;
      return;
    }
    box.innerHTML = itens.map(p => {
      const st = Math.max(0, Math.min(ETAPAS.length - 1, Number(p.status) || 0));
      return `<article class="pt-card">
        <header><div><p class="eyebrow">${esc(ETAPAS[st])}</p><h2 class="h3">${esc(p.titulo)}</h2></div>${p.prazo ? `<p class="pt-due">Previsão<br><b>${esc(p.prazo)}</b></p>` : ''}</header>
        ${etapasHTML(st)}
        ${p.observacao ? `<p class="pt-note">${esc(p.observacao)}</p>` : ''}
        <h3 class="pt-sub">Entregas</h3>${entregasHTML(p.entregas)}
      </article>`;
    }).join('');
  } catch (e) {
    box.innerHTML = '<p class="form-msg">' + esc(erroBanco(e)) + '</p>';
  }
}

/* ---------- painel interno ---------- */
let CACHE = [], CLIENTES = [];
async function carregarAdmin(db) {
  const lista = $('#projetos');
  const form = $('#projForm');
  const filesBox = $('#fFiles');

  tabs($('.pt-tabs--admin'), (b) => { if (b.id === 'tabCli') listarClientes(); });

  const addFileRow = (f = {}) => {
    const row = document.createElement('div');
    row.className = 'pt-file-row';
    row.innerHTML = `<input placeholder="Nome da entrega…" aria-label="Nome da entrega" value="${esc(f.titulo)}" data-k="titulo">
      <input placeholder="https://drive.google.com/…" aria-label="Link do Google Drive" value="${esc(f.url)}" data-k="url" inputmode="url" spellcheck="false">
      <input placeholder="Data…" aria-label="Data da entrega" value="${esc(f.data)}" data-k="data">
      <button type="button" class="icon-btn" aria-label="Remover entrega">×</button>`;
    row.querySelector('button').addEventListener('click', () => row.remove());
    filesBox.appendChild(row);
  };
  $('#addFile').onclick = () => addFileRow();

  const abrir = (p, nomeCliente) => {
    form.reset(); filesBox.innerHTML = '';
    form.dataset.id = p ? p.id : '';
    $('#formTitulo').textContent = p ? 'Editar projeto' : 'Novo projeto';
    $('#btnExcluir').hidden = !p;
    $('#listaClientes').innerHTML = CLIENTES.map(c => `<option value="${esc(c.nome)}">`).join('');
    if (p) {
      form.clienteNome.value = p.clienteNome || ''; form.clienteEmail.value = p.clienteEmail || '';
      form.titulo.value = p.titulo || ''; form.status.value = String(p.status || 0);
      form.prazo.value = p.prazo || ''; form.observacao.value = p.observacao || '';
      (p.entregas || []).forEach(addFileRow);
    } else if (nomeCliente) {
      form.clienteNome.value = nomeCliente;
      const c = CLIENTES.find(x => norm(x.nome) === norm(nomeCliente));
      if (c && c.email) form.clienteEmail.value = c.email;
    }
    if (!filesBox.children.length) addFileRow();
    show('editor'); window.scrollTo(0, 0);
  };
  $('#novoProjeto').onclick = () => abrir(null);
  $('#cancelar').onclick = () => { show('painel'); };

  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const entregas = [...filesBox.querySelectorAll('.pt-file-row')].map(r => {
      const o = {}; r.querySelectorAll('input').forEach(i => { o[i.dataset.k] = i.value.trim(); }); return o;
    }).filter(o => o.url);
    const dados = {
      clienteNome: form.clienteNome.value.trim(),
      clienteEmail: form.clienteEmail.value.trim().toLowerCase(),
      titulo: form.titulo.value.trim(),
      status: Number(form.status.value),
      prazo: form.prazo.value.trim(),
      observacao: form.observacao.value.trim(),
      entregas,
      atualizadoEm: F.serverTimestamp()
    };
    const b = $('#salvar'); b.disabled = true; b.textContent = 'Salvando…';
    try {
      if (form.dataset.id) await F.updateDoc(F.doc(db, 'projetos', form.dataset.id), dados);
      else await F.addDoc(F.collection(db, 'projetos'), { ...dados, criadoEm: F.serverTimestamp() });
      show('painel'); await listar();
    } catch (e) { alert('Não foi possível salvar. [' + (e.code || e.message) + ']'); }
    b.disabled = false; b.textContent = 'Salvar projeto';
  };
  $('#btnExcluir').onclick = async () => {
    if (!form.dataset.id || !confirm('Excluir este projeto? Isso não pode ser desfeito.')) return;
    await F.deleteDoc(F.doc(db, 'projetos', form.dataset.id)); show('painel'); await listar();
  };

  async function listar() {
    lista.innerHTML = '<p class="muted">Carregando…</p>';
    try {
      const snap = await F.getDocs(F.collection(db, 'projetos'));
      CACHE = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.atualizadoEm?.seconds || 0) - (a.atualizadoEm?.seconds || 0));
      if (!CACHE.length) { lista.innerHTML = '<p class="muted">Nenhum projeto cadastrado. Toque em "Novo projeto" para começar.</p>'; return; }
      lista.innerHTML = CACHE.map((p, i) => `<button type="button" class="pt-row" data-i="${i}">
          <span><b>${esc(p.titulo)}</b><small>${esc(p.clienteNome || '')}${p.clienteEmail ? ', ' + esc(p.clienteEmail) : ''}</small></span>
          <span class="tag">${esc(ETAPAS[p.status] || ETAPAS[0])}</span></button>`).join('');
      lista.querySelectorAll('.pt-row').forEach(b => b.addEventListener('click', () => abrir(CACHE[+b.dataset.i])));
    } catch (e) { lista.innerHTML = '<p class="form-msg">' + esc(erroBanco(e)) + '</p>'; }
  }

  /* clientes: os da casa (cadastrados uma vez) + quem criou conta no site */
  async function listarClientes() {
    const box = $('#clientes');
    box.innerHTML = '<p class="muted">Carregando…</p>';
    try {
      let snap = await F.getDocs(F.collection(db, 'clientes'));
      if (snap.empty) {
        const batch = F.writeBatch(db);
        CLIENTES_BASE.forEach(nome => batch.set(F.doc(F.collection(db, 'clientes')), { nome, origem: 'casa', criadoEm: F.serverTimestamp() }));
        await batch.commit();
        snap = await F.getDocs(F.collection(db, 'clientes'));
      }
      const casa = snap.docs.map(d => ({ id: d.id, ...d.data(), tipo: 'casa' }));
      let contas = [];
      try { contas = (await F.getDocs(F.collection(db, 'usuarios'))).docs.map(d => ({ id: d.id, ...d.data(), tipo: 'conta' })); } catch (e) {}
      CLIENTES = [...casa, ...contas.filter(u => !isAdminEmail(u.email))].sort((a, b) => norm(a.nome || a.email).localeCompare(norm(b.nome || b.email)));
      const nProj = (c) => CACHE.filter(p => (c.email && p.clienteEmail === c.email) || norm(p.clienteNome) === norm(c.nome)).length;
      box.innerHTML = CLIENTES.map((c, i) => {
        const n = nProj(c);
        return `<button type="button" class="pt-row" data-c="${i}">
          <span><b>${esc(c.nome || c.email)}</b><small>${c.tipo === 'casa' ? 'Cliente Bourbon' : 'Conta criada no site'}${c.email ? ', ' + esc(c.email) : ''}. ${n} ${n === 1 ? 'projeto' : 'projetos'} no painel.</small></span>
          <span class="tag${c.tipo === 'casa' ? ' tag--casa' : ''}">${c.tipo === 'casa' ? 'Da casa' : 'Conta'}</span></button>`;
      }).join('');
      box.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => abrir(null, CLIENTES[+b.dataset.c].nome || '')));
    } catch (e) { box.innerHTML = '<p class="form-msg">' + esc(erroBanco(e)) + '</p>'; }
  }
  $('#novoCliente').onsubmit = async (ev) => {
    ev.preventDefault();
    const nome = $('#ncNome').value.trim(); if (!nome) return;
    try { await F.addDoc(F.collection(db, 'clientes'), { nome, origem: 'casa', criadoEm: F.serverTimestamp() }); $('#ncNome').value = ''; listarClientes(); }
    catch (e) { alert('Não foi possível adicionar. [' + (e.code || e.message) + ']'); }
  };

  await listar();
  listarClientes();
}
