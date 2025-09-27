<<<<<<< HEAD
// ip-checker-script.js
(function () {
  // gate UI by token (login first)
  function setLoggedInUI(isAuthed) {
    const loginSection = document.getElementById('loginSection');
    const ipSection = document.getElementById('ipCheckSection');
    if (loginSection) loginSection.classList.toggle('hidden', !!isAuthed);
    if (ipSection) ipSection.classList.toggle('hidden', !isAuthed);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    setLoggedInUI(!!token);

    // If your existing login-script.js already handles login form submit
    // and stores localStorage.access_token, we just listen for a custom event.
    // If you don’t have this event, you can keep this as-is; nothing breaks.
    window.addEventListener('auth:logged-in', () => setLoggedInUI(true));
    window.addEventListener('auth:logged-out', () => setLoggedInUI(false));

    const form = document.getElementById('ipForm');
    const input = document.getElementById('ipInput');
    const out   = document.getElementById('results');

    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please login first.');
        return;
      }

      const ip = (input.value || '').trim();
      if (!ip) {
        alert('Enter an IP address');
        return;
      }

      // Your nginx or dev server rewrites /api/* to your backend
      const url = `/api/check-ip/${encodeURIComponent(ip)}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('access_token');
          setLoggedInUI(false);
          alert('Session expired. Please login again.');
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `API error (${res.status})`);
        }

        const data = await res.json();
        const root = data && data.data ? data.data : data;

        // ---- tolerant picks across common providers & custom API shapes ----
        const get = (obj, path) => path.split('.').reduce((o,k)=> (o && o[k] !== undefined) ? o[k] : undefined, obj);
        const pick = (obj, paths, fallback='n/a') => {
          for (const p of paths) {
            const v = get(obj, p);
            if (v !== undefined && v !== null && v !== '') return v;
          }
          return fallback;
        };

        // IP
        const ipValue = pick(root, [
          'ip', 'query', 'ip_address', 'ipAddress', 'request.ip', 'data.ip'
        ], ip);

        // Country name/code
        let countryName = pick(root, [
          'country_name', 'country',
          'location.country_name', 'location.country',
          'geo.country_name', 'geo.country'
        ], 'n/a');

        const countryCode = pick(root, [
          'countryCode', 'country_code',
          'location.country_code', 'geo.country_code'
        ], '');

        if (countryName === 'n/a' && countryCode) {
          // show code if name missing
          countryName = countryCode;
        } else if (countryName !== 'n/a' && countryCode && !String(countryName).includes('(')) {
          // show "Sweden (SE)" if both present
          countryName = `${countryName} (${countryCode})`;
        }

        // Paint the two quick outputs (added)
        const ipEl = document.getElementById('ipOut');
        if (ipEl) ipEl.textContent = String(ipValue || 'n/a');

        const countryEl = document.getElementById('countryOut');
        if (countryEl) countryEl.textContent = String(countryName || 'n/a');

        // ---- OPTIONAL: also render your existing detailed area safely ----
        // If you already build HTML elsewhere, keep doing that.
        // Here we only add a minimal fallback renderer that won’t clash.
        if (out && !out._hasRenderedOnce) {
          out._hasRenderedOnce = true; // avoid duplicate render if your own code writes too
        }

        // Always include raw JSON for debugging (doesn’t break anything)
        if (out) {
          const preId = 'rawJsonBlock';
          let pre = document.getElementById(preId);
          if (!pre) {
            const details = document.createElement('details');
            details.style.marginTop = '12px';
            const summary = document.createElement('summary');
            summary.textContent = 'Raw response';
            pre = document.createElement('pre');
            pre.id = preId;
            details.appendChild(summary);
            details.appendChild(pre);
            out.appendChild(details);
          }
          pre.textContent = JSON.stringify(data, null, 2);
        }

      } catch (err) {
        console.error(err);
        const out = document.getElementById('results');
        if (out) {
          const p = document.createElement('p');
          p.className = 'error';
          p.textContent = `IP check failed: ${err.message}`;
          out.appendChild(p);
        }
        alert('IP check failed: ' + err.message);
      }
    });
  });
})();
=======
// ip-checker-script.js
(function () {
  // gate UI by token (login first)
  function setLoggedInUI(isAuthed) {
    const loginSection = document.getElementById('loginSection');
    const ipSection = document.getElementById('ipCheckSection');
    if (loginSection) loginSection.classList.toggle('hidden', !!isAuthed);
    if (ipSection) ipSection.classList.toggle('hidden', !isAuthed);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    setLoggedInUI(!!token);

    // If your existing login-script.js already handles login form submit
    // and stores localStorage.access_token, we just listen for a custom event.
    // If you don’t have this event, you can keep this as-is; nothing breaks.
    window.addEventListener('auth:logged-in', () => setLoggedInUI(true));
    window.addEventListener('auth:logged-out', () => setLoggedInUI(false));

    const form = document.getElementById('ipForm');
    const input = document.getElementById('ipInput');
    const out   = document.getElementById('results');

    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please login first.');
        return;
      }

      const ip = (input.value || '').trim();
      if (!ip) {
        alert('Enter an IP address');
        return;
      }

      // Your nginx or dev server rewrites /api/* to your backend
      const url = `/api/check-ip/${encodeURIComponent(ip)}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('access_token');
          setLoggedInUI(false);
          alert('Session expired. Please login again.');
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `API error (${res.status})`);
        }

        const data = await res.json();
        const root = data && data.data ? data.data : data;

        // ---- tolerant picks across common providers & custom API shapes ----
        const get = (obj, path) => path.split('.').reduce((o,k)=> (o && o[k] !== undefined) ? o[k] : undefined, obj);
        const pick = (obj, paths, fallback='n/a') => {
          for (const p of paths) {
            const v = get(obj, p);
            if (v !== undefined && v !== null && v !== '') return v;
          }
          return fallback;
        };

        // IP
        const ipValue = pick(root, [
          'ip', 'query', 'ip_address', 'ipAddress', 'request.ip', 'data.ip'
        ], ip);

        // Country name/code
        let countryName = pick(root, [
          'country_name', 'country',
          'location.country_name', 'location.country',
          'geo.country_name', 'geo.country'
        ], 'n/a');

        const countryCode = pick(root, [
          'countryCode', 'country_code',
          'location.country_code', 'geo.country_code'
        ], '');

        if (countryName === 'n/a' && countryCode) {
          // show code if name missing
          countryName = countryCode;
        } else if (countryName !== 'n/a' && countryCode && !String(countryName).includes('(')) {
          // show "Sweden (SE)" if both present
          countryName = `${countryName} (${countryCode})`;
        }

        // Paint the two quick outputs (added)
        const ipEl = document.getElementById('ipOut');
        if (ipEl) ipEl.textContent = String(ipValue || 'n/a');

        const countryEl = document.getElementById('countryOut');
        if (countryEl) countryEl.textContent = String(countryName || 'n/a');

        // ---- OPTIONAL: also render your existing detailed area safely ----
        // If you already build HTML elsewhere, keep doing that.
        // Here we only add a minimal fallback renderer that won’t clash.
        if (out && !out._hasRenderedOnce) {
          out._hasRenderedOnce = true; // avoid duplicate render if your own code writes too
        }

        // Always include raw JSON for debugging (doesn’t break anything)
        if (out) {
          const preId = 'rawJsonBlock';
          let pre = document.getElementById(preId);
          if (!pre) {
            const details = document.createElement('details');
            details.style.marginTop = '12px';
            const summary = document.createElement('summary');
            summary.textContent = 'Raw response';
            pre = document.createElement('pre');
            pre.id = preId;
            details.appendChild(summary);
            details.appendChild(pre);
            out.appendChild(details);
          }
          pre.textContent = JSON.stringify(data, null, 2);
        }

      } catch (err) {
        console.error(err);
        const out = document.getElementById('results');
        if (out) {
          const p = document.createElement('p');
          p.className = 'error';
          p.textContent = `IP check failed: ${err.message}`;
          out.appendChild(p);
        }
        alert('IP check failed: ' + err.message);
      }
    });
  });
})();
>>>>>>> 4aac0aa (Initial commit: IP Reputation Checker microservices + Kubernetes manifests)
