"use strict";
(() => {
  const form = document.querySelector('[data-daily-filters]');
  if (!form) return;
  const records = JSON.parse(document.getElementById('daily-records').textContent);
  const regions = JSON.parse(document.getElementById('daily-regions').textContent);
  const years = [...new Set(records.map(record => record.year))].sort().reverse();
  const labels = new Map(regions.map(region => [region.id, region.label]));
  const overseasIds = new Set(regions.filter(region => region.group === '해외').map(region => region.id));
  labels.set('unknown', '지역 미확인');
  labels.set('domestic', '국내 전체');
  labels.set('overseas', '해외 전체');
  const yearSelect = form.elements.year;
  const regionSelect = form.elements.region;
  const list = document.querySelector('[data-daily-list]');
  const empty = document.querySelector('[data-daily-empty]');
  const status = document.querySelector('[data-daily-status]');
  let pager = document.querySelector('[data-daily-pagination]');
  if (!pager) {
    pager = document.createElement('nav');
    pager.className = 'journey-pagination';
    pager.setAttribute('aria-label', '목록 페이지');
    list.after(pager);
  }
  const option = (value, label, parent) => {
    const element = document.createElement('option');
    element.value = value; element.textContent = label; parent.append(element);
  };
  years.forEach(year => option(year, `${year}년`, yearSelect));
  for (const [group, allValue] of [['국내', 'domestic'], ['해외', 'overseas']]) {
    const optgroup = document.createElement('optgroup'); optgroup.label = group;
    option(allValue, `${group} 전체`, optgroup);
    regions.filter(region => region.group === group).forEach(region => option(region.id, region.label, optgroup));
    regionSelect.append(optgroup);
  }
  if (records.some(record => record.regions.includes('unknown'))) option('unknown', '지역 미확인', regionSelect);
  let year = 'all', region = 'all', page = 1;
  const urlFor = number => {
    const url = new URL(location.href);
    url.pathname = '/journeys/daily/';
    for (const [key, value] of [['year', year], ['region', region], ['page', String(number)]]) {
      if (value === 'all' || (key === 'page' && number === 1)) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    return url;
  };
  const matchesRegion = record => region === 'all' || record.regions.some(id =>
    id === region || (region === 'domestic' && id.startsWith('kr-')) ||
    (region === 'overseas' && overseasIds.has(id)));
  const render = () => {
    const matches = records.filter(record => (year === 'all' || record.year === year) && matchesRegion(record));
    const pages = Math.max(1, Math.ceil(matches.length / 10));
    page = Math.max(1, Math.min(page, pages));
    yearSelect.value = year; regionSelect.value = region;
    list.replaceChildren();
    for (const record of matches.slice((page - 1) * 10, page * 10)) {
      const row = document.createElement('a'); row.className = 'post-row'; row.href = record.url;
      const date = document.createElement('time'); date.dateTime = record.date; date.textContent = record.date.replaceAll('-', '.');
      const body = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = record.title;
      const excerpt = document.createElement('p'); excerpt.textContent = record.excerpt.length > 100 ? record.excerpt.slice(0, 97) + '…' : record.excerpt;
      const arrow = document.createElement('span'); arrow.className = 'row-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
      body.append(title, excerpt); row.append(date, body, arrow); list.append(row);
    }
    empty.hidden = matches.length > 0;
    status.hidden = false;
    status.textContent = `${year === 'all' ? '전체 연도' : year + '년'} · ${region === 'all' ? '전체 지역' : labels.get(region)} · 기록 ${matches.length}개` + (pages > 1 ? ` · ${page} / ${pages}쪽` : '');
    pager.replaceChildren(); pager.hidden = pages <= 1;
    const addLink = (label, number, accessibleLabel) => {
      const link = document.createElement('a'); link.href = urlFor(number); link.textContent = label;
      link.setAttribute('aria-label', accessibleLabel);
      if (number === page) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); page = number; history.pushState(null, '', urlFor(page)); render();
        list.focus({preventScroll: true}); form.scrollIntoView({block: 'start'});
      });
      pager.append(link);
    };
    const first = Math.max(1, Math.min(page - 2, pages - 4));
    const last = Math.min(pages, first + 4);
    const gap = () => {
      const mark = document.createElement('span');
      mark.className = 'pagination-gap'; mark.textContent = '…';
      mark.setAttribute('aria-hidden', 'true'); pager.append(mark);
    };
    if (page > 1) { addLink('«', 1, '처음 쪽'); addLink('‹', page - 1, '이전 쪽'); }
    if (first > 1) gap();
    for (let number = first; number <= last; number++) addLink(String(number), number, `${number}쪽`);
    if (last < pages) gap();
    if (page < pages) { addLink('›', page + 1, '다음 쪽'); addLink('»', pages, '마지막 쪽'); }
    // Normalize invalid filters or an out-of-range page without creating a history entry.
    history.replaceState(null, '', urlFor(page));
  };
  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    year = years.includes(params.get('year')) ? params.get('year') : 'all';
    region = labels.has(params.get('region')) ? params.get('region') : 'all';
    const legacyPage = location.pathname.match(/\/page\/(\d+)\//)?.[1];
    const requested = params.get('page') || legacyPage || '1';
    page = /^\d+$/.test(requested) && Number.isSafeInteger(Number(requested)) ? Number(requested) : 1;
    render();
  };
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => {
    year = yearSelect.value; region = regionSelect.value; page = 1;
    history.pushState(null, '', urlFor(page)); render();
  });
  const reset = () => { year = region = 'all'; page = 1; history.pushState(null, '', urlFor(page)); render(); };
  form.addEventListener('reset', event => { event.preventDefault(); reset(); });
  document.querySelector('[data-daily-reset]').addEventListener('click', reset);
  window.addEventListener('popstate', readUrl);
  form.hidden = false;
  readUrl();
})();
