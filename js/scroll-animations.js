/* RotaLivre - animações de rolagem (sem dependências). Funciona com AJAX do JSF/PrimeFaces. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('rl-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io, parallax = [], ticking = false;

  /* Contador animado: <strong data-count="1080" data-prefix="R$ ">0</strong> */
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count')) || 0;
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var fmt = function (v) {
      return pre + v.toLocaleString('pt-BR', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + suf;
    };
    if (reduce) { el.textContent = fmt(end); return; }
    var t0 = performance.now(), dur = 1200;
    (function step(t) {
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function show(el) {
    el.classList.add('is-visible');
    if (el.hasAttribute('data-count')) countUp(el);
    if (io) io.unobserve(el);
  }

  /* Prepara elementos novos (inclusive os que chegam por AJAX) */
  function scan(scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-stagger]').forEach(function (p) {
      var i = 0;
      Array.prototype.forEach.call(p.children, function (c) {
        if (c.hasAttribute('data-reveal') && !c.hasAttribute('data-rl-seen')) {
          c.style.setProperty('--rl-delay', (i++ * 100) + 'ms');
        }
      });
    });
    scope.querySelectorAll('[data-reveal],[data-count],.rl-steps').forEach(function (el) {
      if (el.hasAttribute('data-rl-seen')) return;
      el.setAttribute('data-rl-seen', '');
      if (el.hasAttribute('data-count') && !el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'up');
      io ? io.observe(el) : show(el);
    });
    scope.querySelectorAll('[data-parallax]').forEach(function (el) {
      if (parallax.indexOf(el) < 0) parallax.push(el);
    });
  }

  /* Barra de progresso, sombra do cabeçalho e parallax */
  var bar = document.createElement('div');
  bar.className = 'rl-progress';
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset, h = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      var hd = document.querySelector('.rl-header');
      if (hd) hd.classList.toggle('is-scrolled', y > 8);
      if (!reduce) parallax = parallax.filter(function (el) {
        if (!document.body.contains(el)) return false;
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          var f = parseFloat(el.getAttribute('data-parallax')) || 0.2;
          el.style.transform = 'translate3d(0,' + (-r.top * f).toFixed(1) + 'px,0)';
        }
        return true;
      });
      ticking = false;
    });
  }

  function init() {
    document.body.appendChild(bar);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (list) {
        list.forEach(function (e) { if (e.isIntersecting) show(e.target); });
      }, {threshold: 0.15, rootMargin: '0px 0px -8% 0px'});
    }
    scan();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    onScroll();
    /* Reaplica depois de updates AJAX do JSF/PrimeFaces */
    new MutationObserver(function () { scan(); }).observe(document.body, {childList: true, subtree: true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
