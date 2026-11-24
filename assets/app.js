(function () {
  var root = document.body.getAttribute('data-root') || '';
  var idx = null, loading = false, waiters = [];

  function load(cb) {
    if (idx) return cb();
    waiters.push(cb);
    if (loading) return;
    loading = true;
    var s = document.createElement('script');
    s.src = root + 'assets/search-index.js';
    s.onload = function () {
      idx = window.MZ_INDEX || [];
      idx.forEach(function (e) { e.h = (e[0] + ' ' + e[2] + ' ' + (e[3] || '')).toLowerCase(); e.t = e[0].toLowerCase(); });
      waiters.splice(0).forEach(function (f) { f(); });
    };
    s.onerror = function () { loading = false; };
    document.head.appendChild(s);
  }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function search(q, limit) {
    var toks = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (!toks.length || !idx) return [];
    var res = [];
    idx.forEach(function (e) {
      var s = 0;
      for (var i = 0; i < toks.length; i++) {
        var k = toks[i];
        if (e.h.indexOf(k) < 0) return;
        if (e.t.indexOf(k) >= 0) { s += 3; if (new RegExp('(^|[^a-z0-9])' + esc(k)).test(e.t)) s += 2; }
        if (e[4]) s += 1;
      }
      res.push([s - e.t.length / 200, e]);
    });
    res.sort(function (a, b) { return b[0] - a[0]; });
    return res.slice(0, limit).map(function (x) { return x[1]; });
  }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  /* ---- typeahead on every search box ---- */
  document.querySelectorAll('input[data-search]').forEach(function (input) {
    var form = input.form, box = null, items = [], cur = -1;
    function close() { if (box) { box.remove(); box = null; } items = []; cur = -1; }
    function paint() {
      items.forEach(function (li, i) { li.classList.toggle('on', i === cur); });
    }
    function show() {
      var q = input.value.trim();
      if (!q) return close();
      load(function () {
        var r = search(q, 8);
        close();
        box = el('ul', 'sugg'); box.setAttribute('role', 'listbox');
        if (!r.length) box.appendChild(el('li', 'none', 'No matches. Try fewer words.'));
        r.forEach(function (e) {
          var li = el('li'), a = el('a'); a.href = root + e[1];
          a.appendChild(el('b', null, e[0])); a.appendChild(el('small', null, e[2]));
          li.appendChild(a); box.appendChild(li); items.push(li);
        });
        form.appendChild(box);
      });
    }
    input.addEventListener('focus', function () { load(function () {}); });
    input.addEventListener('input', show);
    input.addEventListener('keydown', function (ev) {
      if (!box) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); cur = Math.min(cur + 1, items.length - 1); paint(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); cur = Math.max(cur - 1, -1); paint(); }
      else if (ev.key === 'Enter' && cur >= 0) { ev.preventDefault(); items[cur].querySelector('a').click(); }
      else if (ev.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (ev) { if (!form.contains(ev.target)) close(); });
  });

  /* ---- full results page ---- */
  var out = document.getElementById('results');
  if (out) {
    var input = document.querySelector('#q');
    var params = new URLSearchParams(location.search);
    input.value = params.get('q') || '';
    var render = function () {
      var q = input.value.trim();
      out.textContent = '';
      if (!q) { out.appendChild(el('p', 'lede', 'Type a procedure, part, system or fault code such as P0011.')); return; }
      load(function () {
        var r = search(q, 150);
        out.textContent = '';
        out.appendChild(el('p', 'fcount', r.length ? (r.length >= 150 ? 'Showing the top 150 matches.' : r.length + (r.length === 1 ? ' match' : ' matches')) : 'No matches. Try fewer or different words.'));
        if (!r.length) return;
        var ul = el('ul', 'rows');
        r.forEach(function (e) {
          var li = el('li'), a = el('a'); a.href = root + e[1];
          a.appendChild(el('b', null, e[0])); a.appendChild(el('small', null, e[2]));
          li.appendChild(a); ul.appendChild(li);
        });
        out.appendChild(ul);
      });
    };
    input.addEventListener('input', function () {
      var u = new URL(location.href); u.searchParams.set('q', input.value);
      try { history.replaceState(null, '', u); } catch (e) {}
      render();
    });
    render();
    input.focus();
  }

  /* ---- filter long lists on a page ---- */
  document.querySelectorAll('input[data-filter]').forEach(function (input) {
    var list = document.getElementById(input.getAttribute('data-filter'));
    var note = document.getElementById(input.getAttribute('data-filter') + '-n');
    var lis = list ? Array.prototype.slice.call(list.querySelectorAll('li')) : [];
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      lis.forEach(function (li) {
        var t = li.textContent.toLowerCase(), ok = q.every(function (k) { return t.indexOf(k) >= 0; });
        li.hidden = !ok; if (ok) n++;
      });
      if (note) note.textContent = q.length ? (n + ' of ' + lis.length + ' shown') : '';
    });
  });
})();
