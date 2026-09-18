export function mountHomeMotion(root, locale) {
  const controller = new AbortController();
  const signal = controller.signal;
  let disposed = false;
  const animations = [];
  function listen(target, type, handler, options = {}) {
    target.addEventListener(type, handler, {...options, signal});
  }
  function animate(target, frames, options) {
    const animation = target.animate(frames, options);
    animations.push(animation);
  }
  root.classList.add('js');
  const $ = s => root.querySelector(s);
  const t = key => locale.t(key);
  const $$ = s => [...root.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a,b,p) => a + (b-a)*p;
  const ease = x => { x=clamp(x); return x*x*(3-2*x); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => innerWidth <= 760;
  const hero = $('.hero-journey'), detail = $('.detail-journey'), gallery = $('.gallery-journey');
  const track = $('.gallery-track'), viewport = $('.gallery-window'), header = $('#header');
  const scene = {hero:0, detail:0, gallery:0};
  let metrics={}, raf=0, activeLook=0, maxTravel=0, savedFocus=null;
  const cards=$$('.look');
  const data=cards.map(card=>({image:card.dataset.image}));
  const specialCards=$$('.special-look');
  const specialData=specialCards.map(card=>({image:card.dataset.image}));
  const lookCount=data.length;
  const totalLabel=String(lookCount).padStart(2,'0');
  $('.gallery-line i').style.width=`${100/lookCount}%`;
  function measure(){
    const y=scrollY;
    const gutter=innerWidth*(innerWidth>=1800?.07:.05);
    maxTravel=Math.max(0,track.scrollWidth-innerWidth+gutter*2);
    gallery.style.height=mobile()||reduced.matches?'':`${innerHeight+Math.max(innerHeight*1.7,maxTravel*.85)}px`;
    [hero,detail,gallery].forEach((el,i)=>{
      metrics[['hero','detail','gallery'][i]]={top:el.getBoundingClientRect().top+y,range:Math.max(1,el.offsetHeight-innerHeight)};
    });
    metrics.lightStart=detail.getBoundingClientRect().top+y;
    metrics.orderTop=$('#order').getBoundingClientRect().top+y;
    queue();
  }
  function updateGalleryCount(i){
    i=clamp(i,0,lookCount-1);activeLook=i;
    $('.gallery-count').textContent=`${String(i+1).padStart(2,'0')} / ${totalLabel}`;
    $('.gallery-prev').disabled=i===0;
    $('.gallery-next').disabled=i===lookCount-1;
    $('.gallery-line i').style.transform=`translateX(${i*100}%)`;
  }
  function render(){
    raf=0;
    let unsettled=false;
    for(const key of ['hero','detail','gallery']){
      const target=clamp((scrollY-metrics[key].top)/metrics[key].range);
      const delta=target-scene[key];
      if(Math.abs(delta)>.00015){scene[key]+=delta*.14;unsettled=true;}else scene[key]=target;
    }
    const p=scene.hero,q=scene.detail;
    header.classList.toggle('scrolled',scrollY>25);
    const onLight=scrollY+80>=metrics.lightStart && scrollY+80<metrics.orderTop;
    header.classList.toggle('light',onLight && !(scrollY<metrics.hero.top+hero.offsetHeight+detail.offsetHeight && q>.38));
    if(!reduced.matches){
      const introOut=ease(p/.32),focus=ease((p-.07)/.58),statement=ease((p-.44)/.25);
      $('.hero-opening').style.opacity=1-introOut;
      $('.hero-opening').style.transform=`translate3d(${-introOut*35}px,${-introOut*30}px,0)`;
      $('.hero-opening').style.pointerEvents=introOut>.8?'none':'auto';
      $('.hero-picture').style.transform=`scale(${1+focus*.40}) translate3d(${focus*-2}%,${focus*3}%,0)`;
      $('.hero-picture').style.opacity=1-statement*.66;
      $('.hero-statement').style.opacity=statement;
      $('.hero-statement').style.transform=`translate3d(0,${(1-statement)*35}px,0)`;
      $('.hero-bottom').style.opacity=1-ease(p/.20);
      $('.chapter-meter i').style.transform=`scaleX(${p})`;
      const expansion=ease((q-.13)/.46),caption=ease((q-.44)/.24),detailOut=ease((q-.05)/.29);
      const dp=$('.detail-photo');
      dp.style.left=mobile()?'0':`${51*(1-expansion)}%`;
      dp.style.top=mobile()?`${41*(1-expansion)}%`:'0';
      dp.style.height=mobile()?`${59+41*expansion}%`:'100%';
      $('.detail-photo img').style.transform=`scale(${1+ease((q-.2)/.68)*(mobile()?.58:.72)}) translate3d(${expansion*7}%,${expansion*4}%,0)`;
      $('.detail-intro').style.opacity=1-detailOut;
      $('.detail-intro').style.transform=`translate3d(${-detailOut*25}px,${-detailOut*15}px,0)`;
      $('.detail-gradient').style.opacity=caption;
      $('.detail-focus').style.opacity=caption;
      $('.detail-focus').style.transform=`translate3d(0,${(1-caption)*35}px,0)`;
      $('.detail-foot').style.color=q>.38?'#ddd5c6':'';
      $('.detail-tick i').style.transform=`scaleX(${q})`;
      if(!mobile()){
        track.style.transform=`translate3d(${-scene.gallery*maxTravel}px,0,0)`;
        updateGalleryCount(Math.round(scene.gallery*(lookCount-1)));
      }
    }
    if(unsettled&&!reduced.matches)raf=requestAnimationFrame(render);
  }
  function queue(){if(!disposed&&!raf)raf=requestAnimationFrame(render);}
  listen(window,'scroll',queue,{passive:true});
  listen(window,'resize',measure);
  listen(reduced,'change',()=>{
    for(const el of $$('.hero-opening,.hero-picture,.hero-statement,.hero-bottom,.detail-photo,.detail-photo img,.detail-intro,.detail-gradient,.detail-focus,.detail-foot'))el.removeAttribute('style');
    measure();
  });
  document.fonts.ready.then(()=>{
    if(disposed)return;
    measure();
    const target=root.querySelector(location.hash && /^#[a-zA-Z][\w-]*$/.test(location.hash) ? location.hash : '#top');
    if(target)target.scrollIntoView({behavior:'instant'});
  });
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}
  }),{threshold:.1});
  $$('.reveal').forEach(el=>observer.observe(el));
  function galleryGo(i){
    i=clamp(i,0,lookCount-1);
    if(mobile()||reduced.matches){
      const card=$$('.look')[i];
      viewport.scrollTo({left:card.offsetLeft-(viewport.clientWidth-card.offsetWidth)/2,behavior:reduced.matches?'instant':'smooth'});
      updateGalleryCount(i);
    }else{scrollTo({top:metrics.gallery.top+metrics.gallery.range*i/(lookCount-1),behavior:'smooth'});}
  }
  listen($('.gallery-prev'),'click',()=>galleryGo(activeLook-1));
  listen($('.gallery-next'),'click',()=>galleryGo(activeLook+1));
  listen(viewport,'scroll',()=>{
    if(mobile()||reduced.matches){
      const center=viewport.scrollLeft+viewport.clientWidth/2;
      const distances=cards.map(card=>Math.abs(card.offsetLeft+card.offsetWidth/2-center));
      updateGalleryCount(distances.indexOf(Math.min(...distances)));
    }
  },{passive:true});
  const specialRail=$('.special-grid');let activeSpecial=0;
  function specialCount(i){
    activeSpecial=clamp(i,0,specialCards.length-1);
    $('.special-count').textContent=`${String(activeSpecial+1).padStart(2,'0')} / ${String(specialCards.length).padStart(2,'0')}`;
    $('.special-prev').disabled=activeSpecial===0;
    $('.special-next').disabled=activeSpecial===specialCards.length-1;
  }
  function specialGo(i){
    i=clamp(i,0,specialCards.length-1);
    const card=specialCards[i],r=card.getBoundingClientRect(),rail=specialRail.getBoundingClientRect();
    specialRail.scrollTo({left:specialRail.scrollLeft+r.left-rail.left-(rail.width-r.width)/2,behavior:reduced.matches?'instant':'smooth'});
  }
  listen($('.special-prev'),'click',()=>specialGo(activeSpecial-1));
  listen($('.special-next'),'click',()=>specialGo(activeSpecial+1));
  listen(specialRail,'scroll',()=>{
    const rail=specialRail.getBoundingClientRect(),center=rail.left+rail.width/2;
    const distances=specialCards.map(c=>{const r=c.getBoundingClientRect();return Math.abs(r.left+r.width/2-center);});
    specialCount(distances.indexOf(Math.min(...distances)));
  },{passive:true});
  specialCount(0);
  const menu=$('#mobile-menu'),toggle=$('.menu-toggle');
  function closeMenu(){menu.hidden=true;header.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',t('menuOpen'));root.classList.remove('modal-open');}
  listen(toggle,'click',()=>{
    if(!menu.hidden){closeMenu();return;}
    menu.hidden=false;header.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label',t('menuClose'));root.classList.add('modal-open');
  });
  $$('#mobile-menu a').forEach(a=>listen(a,'click',closeMenu));
  $$('[data-scroll]').forEach(b=>listen(b,'click',()=>$(b.dataset.scroll).scrollIntoView({behavior:reduced.matches?'instant':'smooth'})));
  listen(window,'keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();toggle.focus();}});
  const dialog=$('.look-dialog');let dialogIndex=0,dialogCollection='custom';
  function showLook(i){
    const isSpecial=dialogCollection==='special';
    const collection=isSpecial?specialData:data;
    dialogIndex=(i+collection.length)%collection.length;
    const look=collection[dialogIndex],key=`${isSpecial?'specialLook':'look'}${dialogIndex}`;
    $('#dialog-image').src=`/homepage/assets/${look.image}.webp`;
    $('#dialog-image').alt=t(`${key}Alt`);
    $('#dialog-title').textContent=t(key);
    $('#dialog-count').textContent=`${String(dialogIndex+1).padStart(2,'0')} / ${String(collection.length).padStart(2,'0')}`;
    const index=$('#dialog-index'),description=$('#dialog-description'),action=$('#dialog-action');
    index.dataset.i18n=isSpecial?'specialDialogIndex':'dialogIndex';
    description.dataset.i18n=isSpecial?'specialExampleProduct':'exampleProduct';
    action.dataset.i18n=isSpecial?'specialContact':'createCombination';
    [index,description,action].forEach(el=>el.innerHTML=t(el.dataset.i18n));
    action.href=isSpecial?'tel:+821034815598':'/customize';
    action.removeAttribute('target');
  }
  $$('[data-open],[data-special-open]').forEach(b=>listen(b,'click',()=>{
    savedFocus=b;dialogCollection=b.hasAttribute('data-special-open')?'special':'custom';
    showLook(Number(b.dataset.specialOpen??b.dataset.open));dialog.showModal();root.classList.add('modal-open');
  }));
  listen($('.dialog-close'),'click',()=>dialog.close());
  listen($('#dialog-prev'),'click',()=>showLook(dialogIndex-1));
  listen($('#dialog-next'),'click',()=>showLook(dialogIndex+1));
  listen(dialog,'keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showLook(dialogIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();showLook(dialogIndex-1);}});
  listen(dialog,'close',()=>{root.classList.remove('modal-open');savedFocus?.focus({preventScroll:true});});
  const special=$('.special-dialog');
  $$('[data-special-info]').forEach(b=>listen(b,'click',()=>{special.showModal();root.classList.add('modal-open');}));
  listen($('.special-examples-link'),'click',()=>special.close());
  listen($('.special-close'),'click',()=>special.close());
  listen(special,'close',()=>root.classList.remove('modal-open'));
  [dialog,special].forEach(d=>listen(d,'click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  $$('.process-list details').forEach(d=>listen(d,'toggle',()=>{if(d.open)$$('.process-list details').forEach(other=>{if(other!==d)other.open=false;});}));
  $$('.faq-list details,.process-list details').forEach(d=>listen(d,'toggle',measure));
  if(!reduced.matches){
    animate($('.hero-kicker'),[{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'none'}],{duration:950,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
    $$('h1>span').forEach((e,i)=>animate(e,[{opacity:0,transform:'translateY(40px)',clipPath:'inset(100% 0 0 0)'},{opacity:1,transform:'none',clipPath:'inset(0 0 0 0)'}],{duration:1350,delay:150+i*160,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  }
  listen(root,'jidokaan:languagechange',()=>{showLook(dialogIndex);measure();});
  showLook(0);measure();updateGalleryCount(0);
  return {measure, destroy(){disposed=true;controller.abort();observer.disconnect();cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());[dialog,special].forEach(d=>{if(d.open)d.close();});root.classList.remove('modal-open','js');}};
}
