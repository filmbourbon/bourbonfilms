/* Bourbon Films · comportamento compartilhado */
(function(){
  'use strict';
  var doc=document.documentElement;
  doc.classList.remove('no-js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* tema: todo primeiro acesso abre no claro; a escolha só fica guardada depois que a pessoa troca */
  var meta=document.querySelector('meta[name=theme-color]');
  function syncTheme(){
    var dark=doc.dataset.theme==='dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
      b.setAttribute('aria-pressed',dark?'true':'false');
      b.setAttribute('aria-label',dark?'Ativar modo diurno':'Ativar modo noturno');
    });
    if(meta) meta.content=dark?'#000000':'#FFFFFF';
  }
  syncTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
    b.addEventListener('click',function(){
      var next=doc.dataset.theme==='dark'?'light':'dark';
      var apply=function(){doc.dataset.theme=next;syncTheme()};
      try{localStorage.setItem('bf-tema',next==='dark'?'escuro':'claro')}catch(e){}
      if(document.startViewTransition&&!reduce) document.startViewTransition(apply); else apply();
    });
  });

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

  /* entrada suave */
  if('IntersectionObserver' in window&&!reduce){
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');ro.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el)});
  }else{
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('is-in')});
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
      btn.disabled=true;btn.textContent='Enviando...';if(msg) msg.textContent='';
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

  /* ano no rodapé */
  document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
