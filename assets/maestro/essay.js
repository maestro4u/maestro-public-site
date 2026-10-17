'use strict';
(() => {
  // Future essays use the same A layout from their declared media dimensions.
  document.querySelectorAll('.photo-essay .essay-gallery').forEach(gallery=>{
    const figures=[...gallery.children].filter(node=>node.tagName==='FIGURE');
    const ratios=figures.map(figure=>{const media=figure.querySelector('img,video');return Number(media?.getAttribute('width'))/Number(media?.getAttribute('height'));});
    if(!ratios.length||ratios.some(ratio=>!Number.isFinite(ratio)||ratio<=0))return;
    figures.forEach((figure,index)=>{figure.querySelector('img,video').style.aspectRatio=String(ratios[index]);});
    gallery.classList.add('essay-gallery-balanced');
    gallery.classList.toggle('essay-gallery-three',figures.length===3);
    gallery.style.setProperty('--essay-columns',ratios.map(ratio=>ratio+'fr').join(' '));
    gallery.style.setProperty('--essay-pair-columns',ratios.slice(0,2).map(ratio=>ratio+'fr').join(' '));
  });
  const dialog=document.querySelector('.essay-lightbox');if(!dialog)return;
  const links=[...document.querySelectorAll('[data-essay-photo]')];let current=0;
  const image=dialog.querySelector('img'),caption=dialog.querySelector('figcaption');
  function show(index){current=(index+links.length)%links.length;const link=links[current];const source=link.querySelector('img');image.src=link.href;image.alt=source.alt;const text=link.closest('figure').querySelector('figcaption')?.textContent||source.alt;caption.textContent=text+' · '+(current+1)+' / '+links.length;}
  links.forEach((link,index)=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();show(index);dialog.showModal();}));
  dialog.querySelector('.essay-lightbox-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('.essay-lightbox-prev').addEventListener('click',()=>show(current-1));
  dialog.querySelector('.essay-lightbox-next').addEventListener('click',()=>show(current+1));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
})();
