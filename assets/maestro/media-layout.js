'use strict';
/* Preserve the original media nodes, frames and reading order. */
(() => {
  const preserved = /\/2026-11-(13-mongchontoseong-autumn-walk|14-jecheon-outing)\//;
  if (preserved.test(location.pathname) || location.pathname.startsWith('/previews/')) return;
  function start() {
    if (document.documentElement.dataset.mediaLayout) return;
    const compositions = [];
    let sequence = 0;
    const ratio = figure => {
      const media = figure.querySelector('img,video');
      return Number(media?.getAttribute('width')) / Number(media?.getAttribute('height'));
    };
    function make(parent, before, figures, wide) {
      const block = document.createElement('div');
      block.className = 'media-composition' + (wide ? ' essay-wide' : '');
      block.dataset.layoutSide = sequence++ % 2 ? 'right' : 'left';
      parent.insertBefore(block, before);
      figures.forEach(figure => {
        figure.classList.add('media-composition-item');
        figure.classList.remove('essay-wide');
        const media = figure.querySelector('img,video');
        const r = ratio(figure);
        if (Number.isFinite(r) && r > 0) media.style.setProperty('aspect-ratio', String(r), 'important');
        block.appendChild(figure);
      });
      compositions.push(block);
    }
    function partition(parent, before, figures, wide) {
      const marker = document.createComment('media composition');
      parent.insertBefore(marker, before);
      before = marker;
      while (figures.length) {
        // Panoramas and video pairs retain a clear, uninterrupted frame.
        if (ratio(figures[0]) >= 2.1 && !figures[1]?.querySelector('video')) { make(parent, before, figures.splice(0, 1), wide); continue; }
        let count = Math.min(3, figures.length);
        const panorama = figures.slice(0, count).findIndex(f => ratio(f) >= 2.1);
        if (panorama > 0 && !figures.slice(0,count).some(f => f.querySelector('video'))) count = panorama;
        if (count === 3 && figures.length === 4 && sequence % 3 === 1 && ratio(figures[0]) > 1) count = 1;
        if (count === 2 && Math.abs(Math.log(ratio(figures[0]) / ratio(figures[1]))) < .13) count = 1;
        make(parent, before, figures.splice(0, count), wide);
      }
      marker.remove();
    }
    const content = document.querySelector('.photo-essay .essay-content');
    if (content) {
      const selector = '.essay-gallery:not(.tee-reel), .story-grid, figure.essay-image';
      const parents = new Set([...content.querySelectorAll(selector)].map(b => b.parentElement));
      for (const parent of parents) {
        let run = [];
        const flush = () => {
          if (!run.length) return;
          const figures = run.flatMap(b => b.tagName === 'FIGURE' ? [b] : [...b.children].filter(n => n.tagName === 'FIGURE'));
          if (figures.length && figures.every(f => Number.isFinite(ratio(f)) && ratio(f) > 0)) {
            partition(parent, run[0], [...figures], true);
            run.forEach(b => { if (!b.classList.contains('media-composition-item')) b.remove(); });
          }
          run = [];
        };
        for (const child of [...parent.children]) {
          if (child.matches(selector)) {
            if (child.querySelector('video')) { flush(); run.push(child); flush(); }
            else run.push(child);
          } else flush();
        }
        flush();
      }
    }
    document.querySelectorAll('.trip-gallery').forEach(gallery => {
      const figures = [...gallery.children].filter(n => n.tagName === 'FIGURE');
      if (!figures.length) return;
      gallery.classList.add('media-trip-gallery');
      partition(gallery, figures[0], [...figures], false);
    });
    // Legacy example figures have one caption shared by several images.
    document.querySelectorAll('.article-shell .prose figure.half, .article-shell .prose figure.third').forEach(f => f.classList.add('media-example-flow'));
    function layout(block) {
      const items = [...block.children];
      const width = block.clientWidth;
      if (!width) return; // Hidden trip days are laid out when selected.
      const gap = width < 600 ? 8 : 14;
      block.style.gap = gap + 'px';
      items.forEach(f => { f.style.gridColumn = ''; f.style.gridRow = ''; });
      block.dataset.layout = 'single';
      block.style.gridTemplateColumns = 'minmax(0, 1fr)';
      if (items.length === 2) {
        const a = ratio(items[0]), b = ratio(items[1]);
        const minimum = (width - gap) * Math.min(a, b) / (a + b);
        if (minimum >= 125 && Math.abs(Math.log(a / b)) >= .13) {
          block.dataset.layout = 'pair';
          block.style.gridTemplateColumns = `minmax(0,${a}fr) minmax(0,${b}fr)`;
        }
      }
      if (items.length !== 3) return;
      let right = block.dataset.layoutSide === 'right';
      const share = i => { const others = items.filter((_,j) => i !== j); const weight = ratio(items[i]) * (1/ratio(others[0]) + 1/ratio(others[1])); return weight/(1+weight); };
      if (share(right ? 2 : 0) < .3 || share(right ? 2 : 0) > .75) right = !right;
      const big = right ? 2 : 0;
      const small = right ? [0,1] : [1,2];
      // Solve using actual caption wrapping, without ever cropping a photograph.
      items[big].style.gridColumn = right ? '2' : '1';
      items[big].style.gridRow = '1 / span 2';
      small.forEach((index, row) => {
        items[index].style.gridColumn = right ? '1' : '2';
        items[index].style.gridRow = String(row + 1);
      });
      const available = width - gap;
      let low = 0.18 * available, high = 0.82 * available, largeWidth = available / 2;
      for (let pass = 0; pass < 12; pass++) {
        largeWidth = (low + high) / 2;
        const narrow = available - largeWidth;
        block.style.gridTemplateColumns = right ? `${narrow}px ${largeWidth}px` : `${largeWidth}px ${narrow}px`;
        const delta = items[big].getBoundingClientRect().height - items[small[0]].getBoundingClientRect().height - items[small[1]].getBoundingClientRect().height - gap;
        if (delta > 0) high = largeWidth; else low = largeWidth;
      }
      const minWidth = Math.min(largeWidth, available - largeWidth);
      const delta = Math.abs(items[big].getBoundingClientRect().height - items[small[0]].getBoundingClientRect().height - items[small[1]].getBoundingClientRect().height - gap);
      if (minWidth >= (width < 500 ? 96 : 112) && delta < 6) {
        block.dataset.layout = right ? 'three-right' : 'three-left';
      } else {
        // Keep small screens legible and unusual frame ratios intact.
        items.forEach(f => { f.style.gridColumn = ''; f.style.gridRow = ''; });
        block.style.gridTemplateColumns = 'minmax(0,1fr)';
      }
    }
    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; compositions.forEach(layout); });
    }
    compositions.forEach(layout);
    window.addEventListener('resize', schedule, {passive:true});
    document.fonts?.ready.then(schedule);
    // The private player adds a status row; recalculate without moving its video.
    const observer = new ResizeObserver(schedule);
    compositions.forEach(block => {
      block.querySelectorAll('figcaption,.private-video-actions').forEach(n => observer.observe(n));
    });
    const trips = document.querySelector('.trip-explorer');
    if (trips) new MutationObserver(schedule).observe(trips, {subtree:true, attributes:true, attributeFilter:['hidden']});
    document.documentElement.dataset.mediaLayout = '20261114';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
