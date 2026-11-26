(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- header: solid after scroll, mobile menu ----
  const header = $('#header');
  const burger = $('#burger');
  const onScroll = () => header.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---- reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal, .meter').forEach((el) => io.observe(el));

  // ---- layer stacks in model cards ----
  $$('.layers[data-layers]').forEach((el) => {
    el.innerHTML = '<i></i>'.repeat(+el.dataset.layers);
  });

  // ---- catalog: highlight current section chip ----
  const chips = $$('.cat-chips a');
  if (chips.length) {
    const byId = Object.fromEntries(chips.map((a) => [a.hash.slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        chips.forEach((a) => a.classList.remove('is-active'));
        const a = byId[e.target.id];
        if (a) { a.classList.add('is-active'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.cat-section').forEach((s) => spy.observe(s));
  }

  // ---- hero background loop ----
  const hero = $('#heroVideo');
  if (hero && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    const portrait = matchMedia('(max-aspect-ratio: 1/1)').matches;
    hero.src = portrait ? hero.dataset.srcMobile : hero.dataset.src;
    hero.play().catch(() => {});
  }

  // ---- gallery players: load and play on click ----
  $$('.player').forEach((p) => {
    const video = $('video', p);
    const cover = $('.player-cover', p);
    if (!cover) return;
    cover.addEventListener('click', () => {
      $$('.player.is-playing video').forEach((v) => v !== video && v.pause());
      if (!video.src) video.src = video.dataset.src;
      p.classList.add('is-playing');
      video.play().catch(() => {});
      video.focus({ preventScroll: true });
    });
    video.addEventListener('play', () => {
      $$('.player video').forEach((v) => v !== video && !v.paused && v.pause());
    });
  });

  // ---- lightbox (single images and groups) ----
  const lb = $('#lightbox');
  if (!lb) return;
  const lbImg = $('img', lb), lbCap = $('.lightbox-cap', lb);
  const prev = $('.prev', lb), next = $('.next', lb);
  let group = [], idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    const el = group[idx];
    lbImg.src = el.dataset.lightbox;
    lbImg.alt = el.dataset.caption || '';
    lbCap.textContent = el.dataset.caption || '';
    lb.classList.toggle('is-cut', el.dataset.cut !== undefined);
    prev.hidden = next.hidden = group.length < 2;
  };
  const open = (el) => {
    const g = el.dataset.group;
    group = g ? $$(`[data-lightbox][data-group="${g}"]`) : [el];
    lastFocus = el;
    show(group.indexOf(el));
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('.lightbox-close', lb).focus();
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lightbox]');
    if (t) { e.preventDefault(); open(t); }
  });
  $('.lightbox-close', lb).addEventListener('click', close);
  prev.addEventListener('click', () => show(idx - 1));
  next.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && group.length > 1) show(idx - 1);
    if (e.key === 'ArrowRight' && group.length > 1) show(idx + 1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null || group.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
