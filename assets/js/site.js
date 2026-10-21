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

  /* galeria: ver todos */
  document.querySelectorAll('[data-more]').forEach(function(b){
    var g=document.querySelector('[data-gal]');
    b.addEventListener('click',function(){
      var open=g.classList.toggle('is-open');
      b.setAttribute('aria-expanded',open?'true':'false');
      b.textContent=open?'Mostrar menos':b.dataset.label;
      if(open){g.querySelectorAll('.reveal:not(.is-in)').forEach(function(el){el.classList.add('is-in')})}
      else g.scrollIntoView({block:'start'});
    });
    b.dataset.label=b.textContent;
  });

  /* player: abre o filme tocado em tela cheia e para ao fechar */
  var dlg=document.querySelector('dialog.player');
  if(dlg){
    var frame=dlg.querySelector('.player-frame'),opener=null;
    var close=function(){if(dlg.open) dlg.close()};
    dlg.addEventListener('close',function(){frame.innerHTML='';document.documentElement.style.overflow='';if(opener) opener.focus()});
    dlg.addEventListener('click',function(e){if(e.target===dlg) close()});
    dlg.querySelector('.player-x').addEventListener('click',close);
    document.querySelectorAll('[data-play]').forEach(function(b){
      b.addEventListener('click',function(){
        opener=b;
        dlg.classList.toggle('is-v',b.hasAttribute('data-vertical'));
        var f=document.createElement('iframe');
        f.src=ytSrc(b.dataset.play);f.title=b.getAttribute('aria-label').replace('Assistir: ','');
        f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;
        frame.appendChild(f);
        document.documentElement.style.overflow='hidden';
        if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');
        dlg.querySelector('.player-x').focus();
      });
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

  /* ano no rodapé */
  document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
