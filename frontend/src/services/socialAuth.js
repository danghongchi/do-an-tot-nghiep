// Utility to load Google SDK and initiate sign-in flows

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const s = document.createElement('script');
  s.src = src; s.async = true; s.defer = true;
  s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

// Google One Tap / button via GSI
let __gsiLogged = false;
function logGsiInfo(context, chosenId){
  if (__gsiLogged) return; // log once per page load
  __gsiLogged = true;
  try {
    const origin = window.location?.origin;
    const fromEnv = import.meta?.env?.VITE_GOOGLE_CLIENT_ID;
    const fromMeta = document.querySelector('meta[name="google-client-id"]')?.getAttribute('content');
    const fromWindow = window.__GOOGLE_CLIENT_ID;
    const fromStorage = localStorage.getItem('VITE_GOOGLE_CLIENT_ID');
    // eslint-disable-next-line no-console
    console.group('[GSI] Configuration');
    // eslint-disable-next-line no-console
    console.debug('context:', context);
    // eslint-disable-next-line no-console
    console.debug('origin:', origin);
    // eslint-disable-next-line no-console
    console.debug('resolved clientId:', chosenId || '(empty)');
    // eslint-disable-next-line no-console
    console.debug('sources', { fromEnv, fromMeta, fromWindow, fromStorage });
    // eslint-disable-next-line no-console
    console.groupEnd();
  } catch {}
}

function resolveGoogleClientId(){
  const fromEnv = import.meta?.env?.VITE_GOOGLE_CLIENT_ID;
  const fromMeta = document.querySelector('meta[name="google-client-id"]')?.getAttribute('content');
  const fromWindow = window.__GOOGLE_CLIENT_ID;
  const fromStorage = localStorage.getItem('VITE_GOOGLE_CLIENT_ID');
  return fromEnv || fromMeta || fromWindow || fromStorage || '';
}

export async function googleGetIdToken() {
  const clientId = resolveGoogleClientId();
  logGsiInfo('googleGetIdToken', clientId);
  if (!clientId) throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  await loadScript('https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    try {
      /* global google */
      let settled = false;
      const cleanup = () => {
        const el = document.getElementById('google-login-temp');
        if (el && el.parentNode) el.parentNode.removeChild(el);
      };
      const onCallback = (resp) => {
        if (settled) return; settled = true; cleanup();
        if (resp?.credential) return resolve(resp.credential);
        return reject(new Error('Did not receive credential'));
      };

      google.accounts.id.initialize({ client_id: clientId, callback: onCallback, auto_select: false });

      // Render an offscreen button to guarantee a UI path
      const container = document.createElement('div');
      container.id = 'google-login-temp';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      try {
        google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', type: 'standard', shape: 'rectangular' });
      } catch {}

      // Try One Tap; if browser blocks it, user can still click the rendered button
      try { google.accounts.id.prompt(); } catch {}

      // Safety timeout to fail fast with actionable message
      setTimeout(() => {
        if (!settled) {
          cleanup();
          reject(new Error('Google did not return token. Check Client ID, origin (http://localhost:5173), and allow third‑party cookies.'));
        }
      }, 15000);
    } catch (e) { reject(e); }
  });
}

export async function renderGoogleButton(container, onCredential){
  const clientId = resolveGoogleClientId();
  logGsiInfo('renderGoogleButton', clientId);
  if (!clientId) {
    try {
      container.innerHTML = '<div style="font-size:12px;color:#ef4444">Thiếu VITE_GOOGLE_CLIENT_ID. Kiểm tra file .env.local</div>';
    } catch {}
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  }
  await loadScript('https://accounts.google.com/gsi/client');
  /* global google */
  google.accounts.id.initialize({ client_id: clientId, callback: (resp)=>{
    if (resp?.credential) onCredential?.(resp.credential);
  }});
  try {
    // Make the button look great and responsive
    const width = Math.min(Math.max(container.clientWidth || 320, 280), 420);
    google.accounts.id.renderButton(container, {
      theme: 'filled_black',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: 'signin_with',
      logo_alignment: 'left',
      width
    });
  } catch {
    // Fallback minimal
    google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
  }
}

