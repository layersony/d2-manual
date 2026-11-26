(function () {
  var MZ_AUTH_HASH = '3c633c2ca2ac42f4b2e056c882fcc4271dd647de164dc67e6ce2983b2e1a9201'; // mazda:changeme
  var KEY = 'mz-auth';

  function store(remember) { try { return remember ? localStorage : sessionStorage; } catch (e) { return null; } }
  function get(s) { try { return s && s.getItem(KEY); } catch (e) { return null; } }

  function signedIn() { return get(store(true)) === MZ_AUTH_HASH || get(store(false)) === MZ_AUTH_HASH; }

  function signOut() {
    [store(true), store(false)].forEach(function (s) { try { s && s.removeItem(KEY); } catch (e) {} });
  }

  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/assets\/auth\.js(\?.*)?$/, '') : '';
  var loginUrl = root + 'login.html';

  window.MZAuth = {
    hash: MZ_AUTH_HASH,
    signedIn: signedIn,
    signOut: signOut,
    signIn: function (remember) {
      signOut();
      var s = store(remember);
      try { s && s.setItem(KEY, MZ_AUTH_HASH); } catch (e) {}
    },
    root: root
  };

  if (document.currentScript && document.currentScript.hasAttribute('data-login-page')) return;

  if (!signedIn()) {
    document.documentElement.style.visibility = 'hidden';
    var here = location.href.indexOf(root) === 0 ? location.href.slice(root.length) : '';
    location.replace(loginUrl + (here ? '?next=' + encodeURIComponent(here) : ''));
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.top .wrap');
    if (!bar) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'signout';
    b.textContent = 'Sign out';
    b.addEventListener('click', function () { signOut(); location.replace(loginUrl); });
    bar.appendChild(b);
  });
})();
