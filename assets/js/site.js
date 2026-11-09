/* campos editáveis de uma página: mesma regra no site e na Central Bourbon */
function bfCmsCampos(doc, pagina) {
  var out = [], raiz = [].slice.call(doc.querySelectorAll('main > section, main > header, main > article, body > footer'));
  raiz.forEach(function (sec, si) {
    var sid = sec.tagName === 'FOOTER' ? 'rodape' : (sec.id || ('s' + si)), n = {};
    [].slice.call(sec.querySelectorAll('h1,h2,h3,h4,p,li,a,figcaption,dt,dd,blockquote,summary')).forEach(function (el) {
      if (el.closest('[data-cms-ignorar],.nle,.brands,.quotes,.gal,.ig-grid,.gv,svg,template,noscript,[data-more]')) return;
      if (!el.childNodes.length) return;
      for (var i = 0; i < el.childNodes.length; i++) { var c = el.childNodes[i]; if (c.nodeType === 1 && c.tagName !== 'BR') return; }
      var t = el.textContent.replace(/\s+/g, ' ').trim(); if (t.length < 2) return;
      var tag = el.tagName.toLowerCase(); n[tag] = (n[tag] || 0) + 1;
      out.push({ k: pagina + '/' + sid + '/' + tag + n[tag], el: el, t: t, tag: tag, sec: sid });
    });
  });
  return out;
}
function bfCmsSecoes(doc) {
  return [].slice.call(doc.querySelectorAll('main > section[id]')).map(function (s) {
    var h = s.querySelector('h1,h2'); return { id: s.id, el: s, titulo: h ? h.textContent.replace(/\s+/g, ' ').trim() : s.id };
  });
}
function bfCmsNorm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
function bfCmsAplicar(doc, pagina, textos, layout) {
  var c = (textos && textos.campos) || {};
  bfCmsCampos(doc, pagina).forEach(function (f) {
    var v = c[f.k]; if (!v || typeof v.t !== 'string') return;
    if (v.o && bfCmsNorm(v.o) !== f.t) return; /* o texto original mudou no código: não aplica para não errar o lugar */
    var partes = v.t.split('\n'); f.el.textContent = '';
    partes.forEach(function (p, i) { if (i) f.el.appendChild(doc.createElement('br')); f.el.appendChild(doc.createTextNode(p)); });
  });
  var seo = c[pagina + '/seo/title']; if (seo && seo.t) doc.title = seo.t;
  var de = c[pagina + '/seo/description'], md = doc.querySelector('meta[name="description"]'); if (de && de.t && md) md.setAttribute('content', de.t);
  var L = layout && layout.paginas && layout.paginas[pagina];
  if (L) {
    var main = doc.querySelector('main'), secs = bfCmsSecoes(doc), porId = {};
    secs.forEach(function (s) { porId[s.id] = s.el; });
    var ancora = secs.length ? secs[secs.length - 1].el.nextSibling : null;
    (L.ordem || []).forEach(function (id) { if (porId[id]) main.insertBefore(porId[id], ancora); });
    secs.forEach(function (s) {
      var oculta = (L.ocultas || []).indexOf(s.id) >= 0;
      if (oculta) s.el.hidden = true; else if (s.el.dataset.cmsOculta) s.el.hidden = false;
      s.el.dataset.cmsOculta = oculta ? '1' : '';
      var clip = doc.querySelector('.nle-clips [data-clip="' + s.id + '"]'); if (clip) clip.hidden = oculta;
      var al = L.alinhar && L.alinhar[s.id]; s.el.classList.toggle('cms-centro', al === 'centro');
    });
  }
}

/* Bourbon Films · comportamento compartilhado */
(function(){
  'use strict';
  var doc=document.documentElement;
  doc.classList.remove('no-js');doc.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* navegação: fundo sólido ao rolar */
  var nav=document.querySelector('.nav');
  var hero=document.querySelector('.hero');
  function onScroll(){
    if(nav&&!nav.classList.contains('nav--solid')) nav.classList.toggle('is-solid',window.scrollY>40);
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* menu no celular */
  var toggle=document.querySelector('.nav-toggle');
  if(toggle){
    toggle.addEventListener('click',function(){
      var open=doc.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded',open?'true':'false');
    });
    document.querySelectorAll('.nav-sheet a').forEach(function(a){
      a.addEventListener('click',function(){doc.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false')});
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){doc.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false')}});
  }

  /* entrada suave: filhos de [data-stagger] entram em sequência */
  document.querySelectorAll('[data-stagger]').forEach(function(g){
    [].forEach.call(g.children,function(c,i){c.style.setProperty('--i',i%6)});
  });
  if('IntersectionObserver' in window&&!reduce){
    var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');lo.unobserve(e.target)}})},{threshold:.4});
    document.querySelectorAll('.steps-line').forEach(function(el){lo.observe(el)});
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');ro.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el)});
  }else{
    document.querySelectorAll('.reveal,.steps-line').forEach(function(el){el.classList.add('is-in')});
  }

  /* vídeos leves do YouTube */
  function ytSrc(id,opts){
    var p='autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0';
    if(opts&&opts.muted) p+='&mute=1';
    if(opts&&opts.loop) p+='&loop=1&playlist='+id+'&controls=0&disablekb=1';
    return 'https://www.youtube-nocookie.com/embed/'+id+'?'+p;
  }
  function play(box,muted){
    if(box.classList.contains('is-playing')&&box.dataset.current===box.dataset.id) return;
    var old=box.querySelector('iframe');if(old) old.remove();
    var f=document.createElement('iframe');
    f.src=ytSrc(box.dataset.id,{muted:muted});
    f.title=box.dataset.title||'Vídeo Bourbon Films';
    f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen=true;
    box.appendChild(f);
    box.dataset.current=box.dataset.id;
    box.classList.add('is-playing');
  }
  function setPoster(box){
    var img=box.querySelector('.video-poster');
    if(img) img.src='https://i.ytimg.com/vi/'+box.dataset.id+'/hqdefault.jpg';
  }
  /* capa indisponível: some sem deixar ícone quebrado */
  /* capa em alta indisponível: usa a versão padrão do YouTube */
  document.querySelectorAll('img[data-fallback]').forEach(function(img){
    var swap=function(){if(img.dataset.fallback){img.src=img.dataset.fallback;img.removeAttribute('data-fallback')}};
    img.addEventListener('load',function(){if(img.naturalWidth<200) swap()});
    img.addEventListener('error',swap);
    if(img.complete&&img.naturalWidth===0) swap();
  });
  document.querySelectorAll('.video-poster,.hero-media img').forEach(function(img){
    var hide=function(){img.style.visibility='hidden'};
    if(img.complete&&img.naturalWidth===0) hide(); else img.addEventListener('error',hide);
  });
  document.querySelectorAll('.video[data-id]').forEach(function(box){
    var btn=box.querySelector('.video-play');
    if(btn) btn.addEventListener('click',function(){play(box,false)});
  });
  /* autoplay sem som quando o vídeo entra na tela */
  if('IntersectionObserver' in window&&!reduce){
    var vo=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){play(e.target,true);vo.unobserve(e.target)}
    })},{threshold:.5});
    document.querySelectorAll('.video[data-autoplay]').forEach(function(b){vo.observe(b)});
  }

  /* troca de caso dentro do mesmo player */
  document.querySelectorAll('[data-player]').forEach(function(group){
    var box=document.getElementById(group.dataset.player);
    group.addEventListener('click',function(e){
      var chip=e.target.closest('.chip');if(!chip||!box) return;
      if(chip.getAttribute('aria-pressed')==='true'&&box.classList.contains('is-playing')) return;
      group.querySelectorAll('.chip').forEach(function(c){c.setAttribute('aria-pressed','false')});
      chip.setAttribute('aria-pressed','true');
      box.dataset.id=chip.dataset.id;box.dataset.title=chip.textContent.trim();
      box.classList.remove('is-playing');setPoster(box);
      play(box,false);
    });
  });

  /* vídeo de fundo da capa */
  var hv=document.querySelector('.hero-media[data-id]');
  if(hv&&!reduce){
    var startHero=function(){
      var f=document.createElement('iframe');
      f.src=ytSrc(hv.dataset.id,{muted:true,loop:true});
      f.title='Manifesto Bourbon Films';f.setAttribute('aria-hidden','true');f.tabIndex=-1;
      f.allow='autoplay; encrypted-media';
      f.addEventListener('load',function(){setTimeout(function(){f.classList.add('is-ready')},900)});
      hv.appendChild(f);
    };
    if(document.readyState==='complete') setTimeout(startHero,200);
    else window.addEventListener('load',function(){setTimeout(startHero,200)});
  }

  /* mosaico de bastidores: entrada e movimento sutil das colunas ao rolar */
  var mz=document.querySelector('.mz');
  if(mz){
    var cols=[].slice.call(mz.querySelectorAll('.mz-col'));
    if('IntersectionObserver' in window){
      var mo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){mz.classList.add('is-in');mo.disconnect()}})},{threshold:.15});
      mo.observe(mz);
      cols.forEach(function(c){c.querySelectorAll('img').forEach(function(i){i.loading='eager'})});
    }else mz.classList.add('is-in');
    if(!reduce){
      var mzTick=false;
      var mzMove=function(){
        var r=mz.getBoundingClientRect(),vh=window.innerHeight;
        if(r.bottom>0&&r.top<vh){
          var p=(vh-r.top)/(vh+r.height)-.5;
          cols.forEach(function(c,i){c.style.transform='translate3d(0,'+(p*(i%2?-70:70))+'px,0)'});
        }
        mzTick=false;
      };
      window.addEventListener('scroll',function(){if(!mzTick){requestAnimationFrame(mzMove);mzTick=true}},{passive:true});
      mzMove();
    }
  }


  /* ---------- rolagem como entrada contínua (1:1, reversível) ---------- */
  var scrubbers=[];
  var scrubTick=false;
  function runScrub(){scrubTick=false;for(var i=0;i<scrubbers.length;i++) scrubbers[i]()}
  function queueScrub(){if(!scrubTick){scrubTick=true;requestAnimationFrame(runScrub)}}
  window.addEventListener('scroll',queueScrub,{passive:true});
  window.addEventListener('resize',queueScrub,{passive:true});
  var clamp=function(v,a,b){return v<a?a:v>b?b:v};
  function tc(sec,fps){
    var f=Math.floor(sec*fps),fr=f%fps,s=Math.floor(f/fps)%60,m=Math.floor(f/fps/60);
    var z=function(n){return (n<10?'0':'')+n};
    return '00:'+z(m)+':'+z(s)+':'+z(fr);
  }

  /* manifesto: as palavras acendem conforme a leitura */
  var lit=document.querySelector('[data-lit]');
  if(lit&&!reduce){
    scrubbers.push(function(){
      var r=lit.getBoundingClientRect(),vh=window.innerHeight;
      lit.style.setProperty('--p',clamp((vh*.9-r.top)/(vh*.75+r.height),0,1).toFixed(4));
    });
  }

  /* processo: cada etapa se monta enquanto a pessoa rola */
  var track=document.querySelector('.proc-track');
  if(track){
    var stage=track.querySelector('.proc-stage');
    var steps=[].slice.call(track.querySelectorAll('.ps'));
    var scenes=[].slice.call(track.querySelectorAll('.scw'));
    var scs=scenes.map(function(w){return w.querySelector('.sc')});
    var bars=[].slice.call(track.querySelectorAll('.proc-bar i'));
    var tcEl=track.querySelector('[data-tc]'),tcEl2=track.querySelector('[data-tc2]');
    var N=steps.length,cur=-1;
    var range=function(){return Math.max(1,track.offsetHeight-stage.offsetHeight)};
    scrubbers.push(function(){
      var r=track.getBoundingClientRect();
      var p=clamp(-r.top/range(),0,1);
      var x=p*N;
      var step=Math.min(N-1,Math.floor(x));
      for(var i=0;i<N;i++){
        var lp=clamp((x-i)*1.12+.12,0,1);
        scs[i].style.setProperty('--lp',lp.toFixed(4));
        bars[i].style.setProperty('--f',clamp(x-i,0,1).toFixed(4));
      }
      if(tcEl) tcEl.textContent=tc(clamp(x-2,0,1)*14+3.2,24);
      if(tcEl2) tcEl2.textContent=tc(clamp(x-3,0,1)*42,24);
      if(step!==cur){
        cur=step;
        steps.forEach(function(s,i){s.classList.toggle('is-on',i===step);s.classList.toggle('is-past',i<step);s.setAttribute('aria-current',i===step?'step':'false')});
        scenes.forEach(function(s,i){s.classList.toggle('is-on',i===step)});
      }
    });
    /* tocar numa etapa leva até ela */
    track.querySelectorAll('[data-go]').forEach(function(b){
      b.addEventListener('click',function(){
        var i=+b.dataset.go;
        var top=track.getBoundingClientRect().top+window.scrollY+range()*((i+.55)/N);
        window.scrollTo({top:top,behavior:reduce?'auto':'smooth'});
      });
    });
    /* imagens das cenas carregam antes de a seção chegar */
    if('IntersectionObserver' in window){
      var po=new IntersectionObserver(function(es){if(es[0].isIntersecting){track.querySelectorAll('img[loading=lazy]').forEach(function(i){i.loading='eager'});po.disconnect()}},{rootMargin:'100% 0px'});
      po.observe(track);
    }
  }

  /* controle segmentado: o indicador desliza com mola até a opção escolhida */
  document.querySelectorAll('.chips').forEach(function(g){
    var thumb=document.createElement('span');thumb.className='chips-thumb';thumb.setAttribute('aria-hidden','true');
    g.insertBefore(thumb,g.firstChild);g.classList.add('has-thumb');
    var place=function(instant){
      var on=g.querySelector('.chip[aria-pressed="true"]');if(!on) return;
      if(instant){thumb.style.transition='none'}
      thumb.style.width=on.offsetWidth+'px';
      thumb.style.transform='translateX('+on.offsetLeft+'px)';
      if(instant){thumb.offsetWidth;thumb.style.transition=''}
    };
    place(true);
    g.addEventListener('click',function(e){if(e.target.closest('.chip')) requestAnimationFrame(function(){place(false)})});
    window.addEventListener('resize',function(){place(true)},{passive:true});
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){place(true)});
  });

  queueScrub();


  /* linha do tempo de edição: playhead, timecode e clipes acompanham a leitura */
  var nle=document.querySelector('.nle');
  if(nle){
    doc.classList.add('has-nle');
    var track=nle.querySelector('.nle-track'),head=nle.querySelector('.nle-head'),tcEl=nle.querySelector('.nle-tc');
    var clips=[].slice.call(nle.querySelectorAll('[data-clip]'));
    var secs=clips.map(function(li){return document.getElementById(li.dataset.clip)});
    var DUR=90,FPS=24,tops=[],start=0,end=1,tw=1,curClip=-1,nleTick=false;
    var tcf=function(sec){var f=Math.round(sec*FPS),z=function(n){return (n<10?'0':'')+n};return '00:'+z(Math.floor(f/FPS/60))+':'+z(Math.floor(f/FPS)%60)+':'+z(f%FPS)};
    var measure=function(){
      tops=secs.map(function(s){return s.getBoundingClientRect().top+window.scrollY});
      var last=secs[secs.length-1];
      start=tops[0];end=Math.max(start+1,document.documentElement.scrollHeight);
      clips.forEach(function(li,i){var h=(i<secs.length-1?tops[i+1]:end)-tops[i];li.style.flexGrow=Math.max(h,1)});
      tw=track.clientWidth;
    };
    var frac=function(){
      /* ponto de leitura: 40% da altura da tela; no fim da página, o playhead chega ao fim */
      var maxY=document.documentElement.scrollHeight-window.innerHeight;
      var y=window.scrollY+window.innerHeight*.4;
      var f=(y-start)/(end-start);
      if(window.scrollY>=maxY-2) f=1;
      if(window.scrollY<=0) f=0;
      return Math.min(1,Math.max(0,f));
    };
    var paint=function(){
      nleTick=false;
      var f=frac();
      head.style.setProperty('--x',(f*tw).toFixed(1)+'px');
      tcEl.textContent=tcf(f*DUR);
      var y=start+f*(end-start),c=0;
      tops.forEach(function(t,i){if(y>=t) c=i});
      if(c!==curClip){curClip=c;clips.forEach(function(li,i){li.classList.toggle('is-on',i===c);li.classList.toggle('is-past',i<c);var a=li.querySelector('a');if(i===c)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})}
    };
    var queue=function(){if(!nleTick){nleTick=true;requestAnimationFrame(paint)}};
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',function(){measure();paint()},{passive:true});
    window.addEventListener('load',function(){measure();paint()});
    measure();paint();
    /* arrastar na trilha procura o trecho, como na edição (mouse e caneta; no toque, os clipes são links) */
    var seek=function(ev){
      var r=track.getBoundingClientRect(),f=Math.min(1,Math.max(0,(ev.clientX-r.left)/r.width));
      window.scrollTo({top:start+f*(end-start)-window.innerHeight*.4,behavior:'auto'});
    };
    track.addEventListener('pointerdown',function(ev){
      if(ev.pointerType==='touch') return;
      ev.preventDefault();track.setPointerCapture(ev.pointerId);nle.classList.add('is-scrub');doc.style.scrollBehavior='auto';seek(ev);
      var mv=function(e){seek(e)},up=function(){track.removeEventListener('pointermove',mv);track.removeEventListener('pointerup',up);track.removeEventListener('pointercancel',up);nle.classList.remove('is-scrub');doc.style.scrollBehavior=''};
      track.addEventListener('pointermove',mv);track.addEventListener('pointerup',up);track.addEventListener('pointercancel',up);
    });
    track.addEventListener('click',function(ev){if(ev.pointerType&&ev.pointerType!=='touch'&&ev.detail) ev.preventDefault()});
  }

  /* galeria: ordem embaralhada a cada visita (Fisher-Yates) e botão "ver todos" */
  document.querySelectorAll('[data-gal]').forEach(function(g){
    var items=[].slice.call(g.children);
    for(var i=items.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=items[i];items[i]=items[j];items[j]=t}
    items.forEach(function(li){g.appendChild(li)});
  });
  document.querySelectorAll('[data-more]').forEach(function(b){
    var g=document.getElementById(b.dataset.more);if(!g) return;
    b.dataset.label=b.textContent;
    b.addEventListener('click',function(){
      var open=g.classList.toggle('is-open');
      b.setAttribute('aria-expanded',open?'true':'false');
      b.textContent=open?'Mostrar menos':b.dataset.label;
      if(!open) g.scrollIntoView({block:'start'});
      window.dispatchEvent(new Event('resize'));
    });
  });

  /* player: abre o filme tocado em tela cheia e para ao fechar */
  var dlg=document.querySelector('dialog.player');
  if(dlg){
    var frame=dlg.querySelector('.player-frame'),opener=null;
    var close=function(){if(dlg.open) dlg.close()};
    dlg.addEventListener('close',function(){frame.innerHTML='';document.documentElement.style.overflow='';if(opener) opener.focus()});
    dlg.addEventListener('click',function(e){if(e.target===dlg) close()});
    dlg.querySelector('.player-x').addEventListener('click',close);
    /* clique delegado: funciona também para filmes que chegam da Central Bourbon */
    document.addEventListener('click',function(ev){
      var b=ev.target.closest&&ev.target.closest('[data-play],[data-vimeo]');
      if(!b) return;
      var vimeo=/^\d{5,12}$/.test(b.dataset.vimeo||'')?b.dataset.vimeo:'';
      if(!vimeo&&!/^[A-Za-z0-9_-]{11}$/.test(b.dataset.play||'')) return;
      opener=b;
      if(window.bfTrack) window.bfTrack('filme',vimeo||b.dataset.play);
      dlg.classList.toggle('is-v',b.hasAttribute('data-vertical'));
      var f=document.createElement('iframe');
      f.src=vimeo?'https://player.vimeo.com/video/'+vimeo+'?autoplay=1&dnt=1':ytSrc(b.dataset.play);f.title=(b.getAttribute('aria-label')||'Filme').replace('Assistir: ','');
      f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;
      frame.appendChild(f);
      document.documentElement.style.overflow='hidden';
      if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');
      dlg.querySelector('.player-x').focus();
    });
  }

  /* botão de WhatsApp aparece depois da capa */
  var fab=document.querySelector('.wpp-fab');
  if(fab){
    var showFab=function(){fab.classList.toggle('is-on',window.scrollY>(hero?hero.offsetHeight*.6:240))};
    window.addEventListener('scroll',showFab,{passive:true});showFab();
  }


  /* formulários simples (Web3Forms) */
  document.querySelectorAll('form[data-web3]').forEach(function(form){
    var done=document.getElementById(form.dataset.done);
    var btn=form.querySelector('[type=submit]');
    var label=btn?btn.innerHTML:'';
    var msg=form.querySelector('.form-msg');
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      if(form.hp&&form.hp.value) return;
      var lines=[];
      form.querySelectorAll('[data-label]').forEach(function(f){lines.push(f.dataset.label+': '+(f.value.trim()||'-'))});
      var fd=new FormData();
      fd.append('access_key','cecf6141-9abc-4182-aa50-fb7625cc188e');
      fd.append('subject',(form.dataset.subject||'Contato pelo site')+' | '+(form.querySelector('[data-label]').value||''));
      fd.append('from_name','Site Bourbon Films');
      fd.append('message',lines.join('\n'));
      btn.disabled=true;btn.textContent='Enviando…';if(msg) msg.textContent='';
      fetch('https://api.web3forms.com/submit',{method:'POST',body:fd,headers:{Accept:'application/json'}})
        .then(function(r){return r.json()})
        .then(function(j){
          if(!j.success) throw new Error(j.message||'erro');
          form.hidden=true;if(done){done.hidden=false;done.focus()}
        })
        .catch(function(){
          btn.disabled=false;btn.innerHTML=label;
          if(msg) msg.textContent='Não foi possível enviar agora. Tente de novo em instantes ou fale com a gente pelo WhatsApp.';
        });
    });
  });


  /* ---------- medição própria (sem cookies, sem dados pessoais) e conteúdo vivo da Central Bourbon ---------- */
  var SCRIPT_URL=(document.currentScript&&document.currentScript.src)||location.href;
  var FBV='https://www.gstatic.com/firebasejs/10.14.1/';
  var fbp=null;
  function fb(){
    if(!fbp) fbp=Promise.all([import(new URL('firebase-config.js',SCRIPT_URL).href),import(FBV+'firebase-app.js'),import(FBV+'firebase-firestore-lite.js')])
      .then(function(m){var a=m[1],f=m[2];var app=a.getApps().length?a.getApp():a.initializeApp(m[0].firebaseConfig);return {f:f,db:f.getFirestore(app)}});
    return fbp;
  }

  /* ---------- origem do visitante (primeira e última conhecidas), sessão e tráfego interno ---------- */
  var ORIG_K='bf-origem-v1',RET_DIAS=365;
  function lerLS(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
  function gravarLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  var Q={};try{new URLSearchParams(location.search).forEach(function(v,k){Q[k]=String(v).slice(0,80)})}catch(e){}
  if(Q.modo==='dev'){try{localStorage.setItem('bf-interno','1')}catch(e){}}
  if(Q.modo==='publico'){try{localStorage.setItem('bf-interno','0')}catch(e){}}
  var flagInt=null;try{flagInt=localStorage.getItem('bf-interno')}catch(e){}
  var interno=flagInt==='1'||(flagInt!=='0'&&/^(localhost|127\.0\.0\.1|\[::1\])$|\.test$|\.localhost$/.test(location.hostname));
  function canalDe(q,ref){
    var s=(q.utm_source||'').toLowerCase(),m=(q.utm_medium||'').toLowerCase();
    if(q.gclid||(/google/.test(s)&&/cpc|ppc|paid|ads/.test(m))) return 'google-ads';
    if(q.ref) return 'indicacao';
    if(s){if(/insta|^ig$/.test(s))return 'instagram';if(/face|^fb$|meta/.test(s))return 'facebook';if(/youtube|^yt$/.test(s))return 'youtube';if(/whats|^wa$/.test(s))return 'whatsapp';if(/mail|newsletter/.test(s)||/e-?mail/.test(m))return 'email';if(/google/.test(s))return 'google';if(/parceir|partner/.test(s+m))return 'parceiro';return 'campanha'}
    if(q.fbclid) return 'facebook';
    if(!ref) return 'direto';
    if(/(^|\.)instagram\.com$/.test(ref))return 'instagram';if(/(^|\.)google\.[a-z.]+$/.test(ref))return 'google';
    if(/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(ref))return 'facebook';if(/(^|\.)(youtube\.com|youtu\.be)$/.test(ref))return 'youtube';
    if(/whatsapp|(^|\.)wa\.me$/.test(ref))return 'whatsapp';if(/mail\.|outlook|gmail/.test(ref))return 'email';
    if(/bing\.|duckduckgo|yahoo|ecosia|search\.brave/.test(ref))return 'busca-outros';if(/linkedin/.test(ref))return 'linkedin';
    return 'site-externo';
  }
  var sessao=null,canalSessao='direto',novoVisitante=false;
  (function(){
    try{sessao=sessionStorage.getItem('bf-s');canalSessao=sessionStorage.getItem('bf-sc')||'direto'}catch(e){}
    if(sessao) return;
    var a='abcdefghjkmnpqrstuvwxyz23456789',r=crypto.getRandomValues(new Uint8Array(10));sessao='';r.forEach(function(b){sessao+=a[b%a.length]});
    var ref='';try{if(document.referrer){var h=new URL(document.referrer).hostname.replace(/^www\./,'');if(h!==location.hostname.replace(/^www\./,''))ref=h}}catch(e){}
    var t={c:canalDe(Q,ref),f:(Q.utm_source||ref||'').slice(0,60),m:(Q.utm_medium||'').slice(0,40),cp:(Q.utm_campaign||'').slice(0,60),ct:(Q.utm_content||'').slice(0,60),tm:(Q.utm_term||'').slice(0,60),ref:(Q.ref||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,24),lp:location.pathname.slice(0,80),em:Date.now()};
    canalSessao=t.c;
    try{sessionStorage.setItem('bf-s',sessao);sessionStorage.setItem('bf-sc',t.c)}catch(e){}
    try{novoVisitante=!localStorage.getItem('bf-v');if(novoVisitante)localStorage.setItem('bf-v','1')}catch(e){}
    if(interno||navigator.doNotTrack==='1'||window.doNotTrack==='1') return;
    var o=lerLS(ORIG_K)||{};
    if(o.primeira&&Date.now()-o.primeira.em>RET_DIAS*864e5) o={};
    if(!o.primeira) o.primeira=t;
    if(t.c!=='direto'||!o.ultima) o.ultima=t;
    gravarLS(ORIG_K,o);
  })();
  window.bfOrigem=function(){
    var o=lerLS(ORIG_K);if(!o||!o.primeira) return null;
    var limpa=function(t){return t?{canal:t.c,fonte:t.f||'',meio:t.m||'',campanha:t.cp||'',conteudo:t.ct||'',termo:t.tm||'',indicacao:t.ref||'',entrada:t.lp||'',em:new Date(t.em).toISOString().slice(0,10)}:null};
    return {primeira:limpa(o.primeira),ultima:limpa(o.ultima||o.primeira)};
  };
  window.bfInterno=interno;
  if(interno&&!document.body.dataset.portal&&!document.querySelector('.cc')){
    var tag=document.createElement('a');tag.className='bf-dev';tag.href='?modo=publico';tag.textContent='Tráfego interno';tag.title='Suas visitas neste aparelho não entram nas estatísticas comerciais. Toque para voltar ao modo público.';
    document.body.appendChild(tag);
  }

  /* ---------- textos e layout publicados pela Central Bourbon ---------- */
  var PAGINA=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'')||'index';
  var CMS_K='bf-cms-txt-v1';
  if(window.parent!==window&&Q.previa==='1'){
    var origPrev=null;addEventListener('message',function(e){if(e.origin!==location.origin||!e.data||!e.data.bfPrevia) return;if(!origPrev)origPrev=bfCmsCampos(document,PAGINA);origPrev.forEach(function(f){f.el.textContent=f.t});bfCmsAplicar(document,PAGINA,e.data.bfPrevia.textos,e.data.bfPrevia.layout);document.querySelectorAll('.reveal').forEach(function(x){x.classList.add('is-in')})});
    window.parent.postMessage({bfPreviaPronta:PAGINA},location.origin);
  } else if(!document.body.dataset.portal&&!document.querySelector('.cc')){
    var cc=null;try{cc=JSON.parse(sessionStorage.getItem(CMS_K)||'null')}catch(e){}
    if(cc&&Date.now()-cc.t<3e5) bfCmsAplicar(document,PAGINA,cc.x,cc.l);
    else fb().then(function(o){return Promise.all([o.f.getDoc(o.f.doc(o.db,'site','textos')),o.f.getDoc(o.f.doc(o.db,'site','layout'))])})
      .then(function(r){var x=r[0].exists()?r[0].data():null,l=r[1].exists()?r[1].data():null;try{sessionStorage.setItem(CMS_K,JSON.stringify({t:Date.now(),x:x,l:l}))}catch(e){}bfCmsAplicar(document,PAGINA,x,l)}).catch(function(){});
  }

  var privado=!!document.body.dataset.portal||navigator.doNotTrack==='1'||window.doNotTrack==='1';
  var fila=[];
  window.bfTrack=function(t,x){
    if(privado) return;
    var d=new Date(),p=function(n){return String(n).padStart(2,'0')};
    var r='direto';try{if(document.referrer){var h=new URL(document.referrer).hostname;r=h===location.hostname?'interno':h.replace(/^www\./,'')}}catch(e){}
    fila.push({t:t,p:location.pathname.slice(0,80)||'/',r:r.slice(0,80),dv:innerWidth<768?'m':'d',dia:d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()),x:String(x||'').slice(0,60),c:String(canalSessao||'direto').slice(0,20),s:String(sessao||'').slice(0,12),i:!!interno,v:t==='view'&&novoVisitante});if(t==='view')novoVisitante=false;
    clearTimeout(window.__bfT);window.__bfT=setTimeout(enviarFila,800);
  };
  function enviarFila(){
    var lote=fila.splice(0);if(!lote.length) return;
    fb().then(function(o){lote.forEach(function(ev){ev.em=o.f.serverTimestamp();o.f.addDoc(o.f.collection(o.db,'eventos'),ev).catch(function(){})})}).catch(function(){});
  }
  if(!privado){
    var ver=function(){window.bfTrack('view')};
    if('requestIdleCallback' in window) requestIdleCallback(ver,{timeout:4000}); else setTimeout(ver,1500);
    document.addEventListener('click',function(ev){
      var a=ev.target.closest&&ev.target.closest('a[href]');if(!a) return;
      if(/wa\.me|whatsapp/.test(a.href)) window.bfTrack('whatsapp');
      else if(/^mailto:/.test(a.href)) window.bfTrack('contato');
    },true);
  }

  var gH=document.getElementById('gal-h'),gV=document.getElementById('gal-v'),brands=document.querySelector('#clientes .brands'),quotes=document.querySelector('#depoimentos .quotes'),bast=document.getElementById('bastidores');
  if(gH||brands||quotes||bast){
    var CK='bf-cms-v2',cache=null;
    try{cache=JSON.parse(sessionStorage.getItem(CK)||'null')}catch(e){}
    var carregar=function(){
      if(cache&&Date.now()-cache.t<6e5) return Promise.resolve(cache.d);
      return fb().then(function(o){
        var f=o.f,db=o.db,pub=function(c){return f.getDocs(f.query(f.collection(db,c),f.where('status','==','publicado'))).then(function(s){return s.docs.map(function(d){var v=d.data();v.id=d.id;return v})}).catch(function(){return null})};
        return Promise.all([pub('trabalhos'),pub('marcas'),pub('depoimentos'),pub('instagram'),pub('diario'),f.getDoc(f.doc(db,'site','config')).then(function(s){return s.exists()?s.data():null}).catch(function(){return null})]);
      }).then(function(r){var d={trabalhos:r[0],marcas:r[1],depoimentos:r[2],instagram:r[3],diario:(r[4]||[]).map(function(m){return {id:m.id,slug:m.slug}}),config:r[5]};try{sessionStorage.setItem(CK,JSON.stringify({t:Date.now(),d:d}))}catch(e){}return d});
    };
    var el=function(tag,cls,txt){var e=document.createElement(tag);if(cls) e.className=cls;if(txt!=null) e.textContent=txt;return e};
    var ordem=function(a,b){return (a.ordem||0)-(b.ordem||0)};
    var embaralhar=function(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a};
    var imgOk=function(u){return typeof u==='string'&&(/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(u)||/^assets\/[\w\/.-]+$/.test(u)||/^https:\/\/(i\.ytimg\.com|i\.vimeocdn\.com)\//.test(u))};
    var gvItem=function(t){
      var vert=t.orientacao==='vertical',id=t.videoId,vm=t.plataforma==='vimeo';
      var li=el('li','gv'+(vert?' gv--v':''));
      var b=el('button','gv-btn');b.type='button';if(vm) b.dataset.vimeo=id; else b.dataset.play=id;if(vert) b.setAttribute('data-vertical','');b.setAttribute('aria-label','Assistir: '+t.titulo);
      var box=el('span','gv-img'),img=document.createElement('img');
      img.src=imgOk(t.thumb)?t.thumb:vm?'':'https://i.ytimg.com/vi/'+id+'/'+(vert?'oardefault':'maxresdefault')+'.jpg';
      img.width=vert?360:1280;img.height=vert?640:720;img.alt='';img.loading='lazy';img.decoding='async';
      if(!vm) img.addEventListener('load',function(){if(img.naturalWidth<200&&!img.dataset.f){img.dataset.f=1;img.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'}});
      var pl=el('span','gv-play');pl.setAttribute('aria-hidden','true');pl.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
      box.append(img,pl);b.append(box,el('span','gv-t',t.titulo));li.appendChild(b);return li;
    };
    var montarGaleria=function(ul,lista,rotulo){
      if(!ul||!lista.length) return;
      var fix=lista.filter(function(t){return t.destaque}).sort(ordem),resto=embaralhar(lista.filter(function(t){return !t.destaque}));
      ul.textContent='';fix.concat(resto).forEach(function(t){ul.appendChild(gvItem(t))});
      var more=document.querySelector('[data-more="'+ul.id+'"]');
      if(more){var lbl='Ver todos os '+lista.length+' '+rotulo;more.dataset.label=lbl;if(more.getAttribute('aria-expanded')!=='true') more.textContent=lbl}
    };
    var rotuloOrigem={google:'Avaliação no Google',recorrente:'Cliente recorrente',direto:'Depoimento direto'};
    carregar().then(function(d){
      var tr=(d.trabalhos||[]).filter(function(t){return (t.plataforma==='vimeo'?/^\d{5,12}$/:/^[A-Za-z0-9_-]{11}$/).test(t.videoId||'')&&t.titulo});
      if(tr.length){
        montarGaleria(gH,tr.filter(function(t){return t.orientacao!=='vertical'}),'filmes');
        montarGaleria(gV,tr.filter(function(t){return t.orientacao==='vertical'}),'verticais');
      }
      var mk=(d.marcas||[]).filter(function(m){return imgOk(m.arquivo)&&m.nome}).sort(ordem);
      if(brands&&mk.length){
        brands.textContent='';
        mk.forEach(function(m){
          var li=el('li','reveal is-in'),img=document.createElement('img');
          img.src=m.arquivo;img.alt=m.nome;img.width=m.w||200;img.height=m.hpx||80;img.loading='lazy';img.decoding='async';
          img.style.setProperty('--h',(Number(m.h)||40)+'px');
          if(m.tratamento==='original'){img.style.filter='none';img.style.opacity='1'}
          if(Number(m.dx)||Number(m.dy)) img.style.transform='translate('+(Number(m.dx)||0)+'px,'+(Number(m.dy)||0)+'px)';
          if(m.link&&/^https:\/\//.test(m.link)){var a=el('a');a.href=m.link;a.target='_blank';a.rel='noopener';a.appendChild(img);li.appendChild(a)}else li.appendChild(img);
          brands.appendChild(li);
        });
      }
      var dp=(d.depoimentos||[]).filter(function(q){return q.texto&&q.autor}).sort(ordem);
      if(quotes&&dp.length){
        quotes.textContent='';
        dp.forEach(function(q){
          var fg=el('figure','quote reveal is-in'),bq=el('blockquote',null,'“'+q.texto.replace(/^[“"]|[”"]$/g,'')+'”'),fc=el('figcaption',null,q.autor);
          var sp=el('span',null,q.legenda||[q.empresa,rotuloOrigem[q.origem]].filter(Boolean).join(', '));
          fc.appendChild(sp);fg.append(bq,fc);var vl=q.vinculo;var vivo=vl&&(vl.tipo==='diario'?(d.diario||[]).some(function(m){return m.id===vl.id}):vl.tipo==='trabalho'?(d.trabalhos||[]).some(function(t){return t.id===vl.id}):true);if(vivo&&vl&&vl.url&&(/^https:\/\//.test(vl.url)||/^diario\.html\?m=[a-z0-9-]+$/.test(vl.url))){var lk=el('a','quote-link',vl.rotulo||'Conheça o trabalho realizado');lk.href=vl.url;if(/^https/.test(vl.url)){lk.target='_blank';lk.rel='noopener'}lk.setAttribute('aria-label',(vl.rotulo||'Conheça o trabalho realizado')+': '+(vl.titulo||q.autor));fg.appendChild(lk)}quotes.appendChild(fg);
        });
      }
      var c=d.config;
      if(c){
        var st=document.querySelector('#clientes .stat-line');
        if(st&&c.projetos&&c.marcas){st.textContent='';st.append(el('b',null,'Mais de '+c.projetos+' projetos'),' entregues para ',el('b',null,'mais de '+c.marcas+' marcas'),'.')}
        var rt=document.querySelector('#depoimentos .rating > span:not(.stars)');
        if(rt&&c.notaGoogle&&c.avaliacoesGoogle){rt.textContent='';rt.append(el('b',null,c.notaGoogle),' no Google, com mais de '+c.avaliacoesGoogle+' avaliações.')}
      }
      var ig=(d.instagram||[]).filter(function(p){return imgOk(p.imagem)&&/^https:\/\/(www\.)?instagram\.com\//.test(p.url||'')}).sort(ordem);
      if(bast&&ig.length){
        var ul=bast.querySelector('.ig-grid');ul.textContent='';
        ig.slice(0,8).forEach(function(p){
          var li=el('li'),a=el('a');a.href=p.url;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',(p.legenda||'Publicação no Instagram')+' (abre o Instagram)');
          var img=document.createElement('img');img.src=p.imagem;img.alt='';img.width=600;img.height=750;img.loading='lazy';img.decoding='async';
          a.appendChild(img);li.appendChild(a);ul.appendChild(li);
        });
        bast.hidden=false;
      }
    }).catch(function(){});
  }

  /* ano no rodapé */
  document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
