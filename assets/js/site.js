/* Bourbon Films · comportamento compartilhado */
(function(){
  'use strict';
  var doc=document.documentElement;
  doc.classList.remove('no-js');
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
  document.querySelectorAll('.video-poster').forEach(function(img){
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
