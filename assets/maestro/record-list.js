"use strict";
(() => {
  const list = document.querySelector('[data-record-list]');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('[data-topic]'));
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const pager = document.querySelector('[data-record-pagination]');
  const status = document.querySelector('[data-record-status]');
  const pageSize = 10;
  let topic = 'all';
  let page = 1;

  const pageUrl = (nextTopic, nextPage) => {
    const url = new URL(location.href);
    if (nextTopic === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', nextTopic);
    if (nextPage === 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(nextPage));
    return url;
  };

  const render = () => {
    const matches = rows.filter(row => topic === 'all' || row.dataset.topic === topic);
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(totalPages, Math.max(1, page));
    const visible = new Set(matches.slice((page - 1) * pageSize, page * pageSize));
    for (const row of rows) row.hidden = !visible.has(row);
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === topic));
    status.textContent = `총 ${matches.length}개 · ${page} / ${totalPages}쪽`;
    pager.replaceChildren();
    pager.hidden = totalPages <= 1;

    const addLink = (label, nextPage, accessibleLabel) => {
      const link = document.createElement('a');
      link.href = pageUrl(topic, nextPage).toString();
      link.textContent = label;
      link.setAttribute('aria-label', accessibleLabel);
      if (nextPage === page) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        page = nextPage;
        history.pushState(null, '', pageUrl(topic, page));
        render();
        list.focus({preventScroll: true});
        document.querySelector('.filter-bar').scrollIntoView({block: 'start'});
      });
      pager.append(link);
    };
    const first = Math.max(1, Math.min(page - 2, totalPages - 4));
    const last = Math.min(totalPages, first + 4);
    const gap = () => {
      const mark = document.createElement('span');
      mark.className = 'pagination-gap'; mark.textContent = '…';
      mark.setAttribute('aria-hidden', 'true'); pager.append(mark);
    };
    if (page > 1) { addLink('«', 1, '처음 쪽'); addLink('‹', page - 1, '이전 쪽'); }
    if (first > 1) gap();
    for (let number = first; number <= last; number++) addLink(String(number), number, `${number}쪽`);
    if (last < totalPages) gap();
    if (page < totalPages) { addLink('›', page + 1, '다음 쪽'); addLink('»', totalPages, '마지막 쪽'); }
  };

  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    const requestedTopic = params.get('topic');
    topic = ['learning', 'life'].includes(requestedTopic) ? requestedTopic : 'all';
    const requestedPage = params.get('page') || '1';
    page = /^\d+$/.test(requestedPage) ? Number(requestedPage) : 1;
    render();
  };
  for (const button of filters) button.addEventListener('click', () => {
    topic = button.dataset.filter;
    page = 1;
    history.pushState(null, '', pageUrl(topic, page));
    render();
  });
  window.addEventListener('popstate', readUrl);
  readUrl();
})();
