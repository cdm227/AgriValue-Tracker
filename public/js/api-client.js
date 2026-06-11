/**
 * API client — routes to Azure App Service from GitHub Pages or same-origin locally.
 */
const cfg = window.AGRIVALUE_CONFIG || { apiBase: "", staticFallback: true };

export function getApiBase() {
  if (cfg.apiBase) return cfg.apiBase.replace(/\/$/, "");
  return "";
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return res;
}

export function isRemoteApi() {
  return Boolean(getApiBase());
}

export function isStaticHost() {
  return (
    window.location.hostname.includes("github.io") ||
    window.location.search.includes("demo=static")
  );
}
