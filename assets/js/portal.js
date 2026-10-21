/* Bourbon Films · área do cliente e painel interno (Firebase) */
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js?v=20261021e';
const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
let initializeApp, getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,
  getFirestore, collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp;

const ETAPAS = ['Briefing', 'Roteiro', 'Gravação', 'Edição', 'Revisão', 'Entregue'];
const MODE = document.body.dataset.portal; // "cliente" ou "admin"
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => /^https:\/\//i.test(u || '') ? u : '#';
const show = (id) => document.querySelectorAll('[data-view]').forEach(v => { v.hidden = v.dataset.view !== id; });
const msg = (text, ok) => { const m = $('#authMsg'); if (m) { m.textContent = text || ''; m.classList.toggle('ok', !!ok); } };

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('COLE')) {
  show('setup');
} else {
  Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')])
    .then(([A, U, F]) => {
      ({ initializeApp } = A);
      ({ getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
        sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
        signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } = U);
      ({ getFirestore, collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } = F);
      start();
    })
    .catch(() => { show('login'); msg('Não foi possível carregar o acesso. Verifique sua conexão e atualize a página.'); });
}

function erroAmigavel(e) {
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'E-mail ou senha incorretos.';
  if (c.includes('email-already-in-use')) return 'Este e-mail já tem conta. Use "Entrar" ou receba um link de acesso.';
  if (c.includes('weak-password')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (c.includes('invalid-email')) return 'Confira o e-mail digitado.';
  if (c.includes('popup-closed')) return 'A janela do Google foi fechada antes de concluir.';
  if (c.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (c.includes('unauthorized-domain')) return 'Este endereço ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados). [' + c + ']';
  if (c.includes('operation-not-allowed')) return 'Este método de login ainda não foi ativado no Firebase (Authentication > Método de login). [' + c + ']';
  if (c.includes('configuration-not-found')) return 'O login ainda não foi ativado no Firebase (Authentication > Vamos começar). [' + c + ']';
  if (c.includes('api-key')) return 'Chave do Firebase inválida no firebase-config.js. [' + c + ']';
  if (c.includes('network-request-failed')) return 'Sem conexão com o Firebase. Desative bloqueadores (Brave Shields) para este site e tente de novo. [' + c + ']';
  return 'Não foi possível entrar agora. [' + (c || (e && e.message) || 'erro') + ']';
}

function erroBanco(e) {
  const c = (e && e.code) || '';
  if (c.includes('permission-denied')) return 'Sem permissão no banco. Confira se as regras do Firestore foram publicadas. [' + c + ']';
  if (c.includes('not-found') || c.includes('failed-precondition')) return 'O banco Firestore ainda não foi criado neste projeto. [' + c + ']';
  if (c.includes('unavailable')) return 'Banco indisponível agora. Verifique a conexão ou bloqueadores. [' + c + ']';
  return 'Não foi possível carregar. [' + (c || (e && e.message) || 'erro') + ']';
}

function start() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = 'pt';
  const db = getFirestore(app);
  const here = location.origin + location.pathname;

  /* volta do link enviado por e-mail */
  if (isSignInWithEmailLink(auth, location.href)) {
    let email = '';
    try { email = localStorage.getItem('bf-email-link') || ''; } catch (e) {}
    if (!email) email = window.prompt('Confirme o e-mail em que você recebeu o link:') || '';
    if (email) {
      signInWithEmailLink(auth, email.trim(), location.href)
        .then(() => { try { localStorage.removeItem('bf-email-link'); } catch (e) {} history.replaceState(null, '', here); })
        .catch(e => { show('login'); msg(erroAmigavel(e)); });
    }
  }

  const emailEl = $('#authEmail'), passEl = $('#authPass');
  const getEmail = () => (emailEl.value || '').trim();

  $('#btnLink').addEventListener('click', async () => {
    const email = getEmail();
    if (!email) return msg('Digite seu e-mail.');
    try {
      await sendSignInLinkToEmail(auth, email, { url: here, handleCodeInApp: true });
      try { localStorage.setItem('bf-email-link', email); } catch (e) {}
      msg('Pronto. Abra o link que enviamos para ' + email + '. Confira também o spam.', true);
    } catch (e) { msg(erroAmigavel(e)); }
  });

  $('#btnGoogle').addEventListener('click', async () => {
    const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await signInWithPopup(auth, p); }
    catch (e) {
      if ((e.code || '').includes('popup-blocked')) return signInWithRedirect(auth, p);
      msg(erroAmigavel(e));
    }
  });

  $('#btnEntrar').addEventListener('click', async () => {
    try { await signInWithEmailAndPassword(auth, getEmail(), passEl.value); } catch (e) { msg(erroAmigavel(e)); }
  });
  $('#btnCriar').addEventListener('click', async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, getEmail(), passEl.value);
      await sendEmailVerification(cred.user, { url: here });
    } catch (e) { msg(erroAmigavel(e)); }
  });
  $('#btnEsqueci').addEventListener('click', async () => {
    const email = getEmail();
    if (!email) return msg('Digite seu e-mail para receber o link de nova senha.');
    try { await sendPasswordResetEmail(auth, email); msg('Enviamos um link para criar uma nova senha.', true); }
    catch (e) { msg(erroAmigavel(e)); }
  });
  $('#btnReenviar').addEventListener('click', async () => {
    try { await sendEmailVerification(auth.currentUser, { url: here }); $('#verifyMsg').textContent = 'Enviado. Confira sua caixa de entrada.'; } catch (e) {}
  });
  document.querySelectorAll('[data-sair]').forEach(b => b.addEventListener('click', () => signOut(auth)));

  onAuthStateChanged(auth, async (user) => {
    if (!user) { show('login'); return; }
    if (!user.emailVerified) { $('#verifyEmail').textContent = user.email; show('verify'); return; }
    document.querySelectorAll('[data-user]').forEach(el => { el.textContent = user.displayName || user.email; });
    if (MODE === 'admin') {
      if (!ADMIN_EMAILS.map(x => x.toLowerCase()).includes(user.email.toLowerCase())) { const n = $('[data-view="negado"] .muted'); if (n) n.textContent = 'Você entrou como ' + user.email + '. Este painel é só para a equipe da Bourbon Films.'; show('negado'); return; }
      show('painel'); carregarAdmin(db);
    } else {
      show('painel'); carregarCliente(db, user.email.toLowerCase());
    }
  });
}

/* ---------- área do cliente ---------- */
function etapasHTML(status) {
  return '<ol class="pt-steps" aria-label="Andamento">' + ETAPAS.map((e, i) =>
    `<li class="${i < status ? 'done' : ''}${i === status ? ' now' : ''}"><span>${esc(e)}</span></li>`).join('') + '</ol>';
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
    const snap = await getDocs(query(collection(db, 'projetos'), where('clienteEmail', '==', email)));
    const itens = snap.docs.map(d => d.data()).sort((a, b) => (b.atualizadoEm?.seconds || 0) - (a.atualizadoEm?.seconds || 0));
    if (!itens.length) {
      box.innerHTML = `<div class="pt-empty"><h2 class="h3">Nenhum projeto por aqui ainda.</h2><p class="muted">Se você já fechou um projeto com a gente, ele aparece aqui em breve.</p></div>`;
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
let CACHE = [];
async function carregarAdmin(db) {
  const lista = $('#projetos');
  const form = $('#projForm');
  const filesBox = $('#fFiles');

  const addFileRow = (f = {}) => {
    const row = document.createElement('div');
    row.className = 'pt-file-row';
    row.innerHTML = `<input placeholder="Nome da entrega (ex.: Filme final)" value="${esc(f.titulo)}" data-k="titulo">
      <input placeholder="Link do Google Drive" value="${esc(f.url)}" data-k="url" inputmode="url">
      <input placeholder="Data" value="${esc(f.data)}" data-k="data">
      <button type="button" class="icon-btn" aria-label="Remover entrega">×</button>`;
    row.querySelector('button').addEventListener('click', () => row.remove());
    filesBox.appendChild(row);
  };
  $('#addFile').onclick = () => addFileRow();

  const abrir = (p) => {
    form.reset(); filesBox.innerHTML = '';
    form.dataset.id = p ? p.id : '';
    $('#formTitulo').textContent = p ? 'Editar projeto' : 'Novo projeto';
    $('#btnExcluir').hidden = !p;
    if (p) {
      form.clienteNome.value = p.clienteNome || ''; form.clienteEmail.value = p.clienteEmail || '';
      form.titulo.value = p.titulo || ''; form.status.value = String(p.status || 0);
      form.prazo.value = p.prazo || ''; form.observacao.value = p.observacao || '';
      (p.entregas || []).forEach(addFileRow);
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
      atualizadoEm: serverTimestamp()
    };
    const b = $('#salvar'); b.disabled = true; b.textContent = 'Salvando…';
    try {
      if (form.dataset.id) await updateDoc(doc(db, 'projetos', form.dataset.id), dados);
      else await addDoc(collection(db, 'projetos'), { ...dados, criadoEm: serverTimestamp() });
      show('painel'); await listar();
    } catch (e) { alert('Não foi possível salvar. [' + (e.code || e.message) + ']'); }
    b.disabled = false; b.textContent = 'Salvar';
  };
  $('#btnExcluir').onclick = async () => {
    if (!form.dataset.id || !confirm('Excluir este projeto? Isso não pode ser desfeito.')) return;
    await deleteDoc(doc(db, 'projetos', form.dataset.id)); show('painel'); await listar();
  };

  async function listar() {
    lista.innerHTML = '<p class="muted">Carregando…</p>';
    try {
      const snap = await getDocs(collection(db, 'projetos'));
      CACHE = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.atualizadoEm?.seconds || 0) - (a.atualizadoEm?.seconds || 0));
      if (!CACHE.length) { lista.innerHTML = '<p class="muted">Nenhum projeto cadastrado. Clique em "Novo projeto".</p>'; return; }
      lista.innerHTML = CACHE.map((p, i) => `<button type="button" class="pt-row" data-i="${i}">
          <span><b>${esc(p.titulo)}</b><small>${esc(p.clienteNome || '')} · ${esc(p.clienteEmail)}</small></span>
          <span class="tag">${esc(ETAPAS[p.status] || ETAPAS[0])}</span></button>`).join('');
      lista.querySelectorAll('.pt-row').forEach(b => b.addEventListener('click', () => abrir(CACHE[+b.dataset.i])));
    } catch (e) { lista.innerHTML = '<p class="form-msg">' + esc(erroBanco(e)) + '</p>'; }
  }
  listar();
}
