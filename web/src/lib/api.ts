export const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API || 'http://localhost:3001/api';
export const SIM_API = process.env.NEXT_PUBLIC_SIM_API || 'http://localhost:3002/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'שגיאת שרת');
  }
  return res.json();
}

/** fetch עם JWT — מרענן Access Token אוטומטית ב-401 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${AUTH_API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('accessToken', data.accessToken);
      headers.set('Authorization', `Bearer ${data.accessToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

export async function authFetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await authFetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'שגיאת שרת');
  }
  return res.json();
}

export type CmsPage = { slug: string; title: string; content: string };

export async function fetchCmsPages(): Promise<CmsPage[]> {
  try {
    const res = await fetch(`${AUTH_API}/cms/pages`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function getCmsContent(pages: CmsPage[], slug: string, fallback: string): string {
  return pages.find((p) => p.slug === slug)?.content || fallback;
}
