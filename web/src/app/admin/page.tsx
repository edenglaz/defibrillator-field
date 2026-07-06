'use client';

import { useEffect, useState } from 'react';
import { AUTH_API, SIM_API, fetchJson, authFetchJson } from '@/lib/api';
import { medicalTrainingLabel } from '@/lib/medicalTraining';
import { participantTypeLabel } from '@/lib/participantTypes';

type CmsPage = { slug: string; title: string; content: string };
type Registration = {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  loraId: string;
  medicalTraining?: string;
  participantType?: string;
  createdAt: string;
};

type MaintenancePush = {
  _id: string;
  ownerName: string;
  phone: string;
  alertType: string;
  message: string;
  createdAt: string;
};

type MaintenanceAlert = {
  type?: string;
  ownerName: string;
  phone: string;
  message: string;
};

export default function AdminPage() {
  const [username, setUsername] = useState('micha');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [maintenancePushes, setMaintenancePushes] = useState<MaintenancePush[]>([]);
  const [editSlug, setEditSlug] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editRegId, setEditRegId] = useState('');
  const [editRegFirst, setEditRegFirst] = useState('');
  const [editRegLast, setEditRegLast] = useState('');
  const [editRegPhone, setEditRegPhone] = useState('');
  const [editRegLora, setEditRegLora] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const at = localStorage.getItem('accessToken');
    const rt = localStorage.getItem('refreshToken');
    if (at && rt) {
      setAccessToken(at);
      setRefreshToken(rt);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn && accessToken) {
      loadAdminData();
    }
  }, [loggedIn, accessToken]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await fetchJson<{
        accessToken: string;
        refreshToken: string;
      }>(`${AUTH_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setLoggedIn(true);
      setMsg('התחברת בהצלחה');
    } catch {
      setMsg('שגיאת התחברות — בדוק micha / 1234');
    }
  }

  async function refreshAccess() {
    const rt = refreshToken || localStorage.getItem('refreshToken') || '';
    if (!rt) {
      setMsg('אין Refresh Token — התחבר מחדש');
      return;
    }
    try {
      const data = await fetchJson<{ accessToken: string }>(`${AUTH_API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      setAccessToken(data.accessToken);
      setRefreshToken(rt);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', rt);
      setMsg('Access Token רוענן — הנתונים נטענו מחדש');
      await loadAdminData();
    } catch {
      setMsg('Refresh נכשל — התחבר מחדש');
      logout();
    }
  }

  function logout() {
    fetch(`${AUTH_API}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setLoggedIn(false);
    setAccessToken('');
  }

  async function loadAdminData() {
    const [cms, registrations, alerts, pushes] = await Promise.all([
      fetchJson<CmsPage[]>(`${AUTH_API}/cms/pages`),
      fetchJson<Registration[]>(`${SIM_API}/register`),
      fetchJson<MaintenanceAlert[]>(`${SIM_API}/devices/maintenance-alerts`).catch(() => []),
      fetchJson<MaintenancePush[]>(`${SIM_API}/devices/maintenance-pushes`).catch(() => []),
    ]);
    setPages(cms);
    setRegs(registrations);
    setMaintenanceAlerts(alerts);
    setMaintenancePushes(pushes);
  }

  function selectPage(p: CmsPage) {
    setEditSlug(p.slug);
    setEditTitle(p.title);
    setEditContent(p.content);
  }

  async function savePage() {
    if (!editSlug) {
      setMsg('בחרי דף לעריכה');
      return;
    }
    try {
      await authFetchJson(`${AUTH_API}/cms/pages/${editSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setMsg(`דף "${editTitle}" נשמר — רענני את דף הבית/הרשמה בדפדפן`);
      await loadAdminData();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שמירה נכשלה — לחצי "רענון JWT" או התחברי מחדש');
    }
  }

  function selectRegistration(r: Registration) {
    setEditRegId(r._id);
    setEditRegFirst(r.firstName);
    setEditRegLast(r.lastName || '');
    setEditRegPhone(r.phone);
    setEditRegLora(r.loraId || '');
  }

  async function saveRegistration() {
    if (!editRegId) {
      setMsg('בחרי הרשמה לעריכה');
      return;
    }
    try {
      await fetchJson(`${SIM_API}/register/${editRegId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editRegFirst,
          lastName: editRegLast,
          phone: editRegPhone,
          loraId: editRegLora,
        }),
      });
      setMsg('ההרשמה עודכנה');
      setEditRegId('');
      await loadAdminData();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'עדכון הרשמה נכשל');
    }
  }

  async function deleteRegistration(id: string) {
    if (!confirm('למחוק הרשמה זו?')) return;
    try {
      await fetchJson(`${SIM_API}/register/${id}`, { method: 'DELETE' });
      setMsg('ההרשמה נמחקה');
      if (editRegId === id) setEditRegId('');
      await loadAdminData();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'מחיקה נכשלה');
    }
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold">כניסת אדמין</h1>
        <form onSubmit={login} className="space-y-3 rounded-xl border bg-white p-6 shadow">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="שם משתמש"
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="w-full rounded border px-3 py-2"
          />
          <button type="submit" className="w-full rounded bg-gray-800 py-2 text-white">
            התחבר (JWT)
          </button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">לוח אדמין</h1>
        <div className="flex gap-2">
          <button type="button" onClick={refreshAccess} className="rounded border px-3 py-1 text-sm">
            רענון JWT
          </button>
          <button type="button" onClick={logout} className="rounded bg-gray-700 px-3 py-1 text-sm text-white">
            יציאה
          </button>
        </div>
      </div>
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow">
          <h2 className="mb-3 font-bold">עריכת דפי שיווק (CMS — SQLite)</h2>
          <ul className="mb-4 space-y-1 text-sm">
            {pages.map((p) => (
              <li key={p.slug}>
                <button type="button" onClick={() => selectPage(p)} className="text-blue-700 hover:underline">
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
          {editSlug && (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border px-2 py-1"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full rounded border px-2 py-1"
              />
              <button type="button" onClick={savePage} className="rounded bg-red-700 px-4 py-2 text-white">
                שמור
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow">
          <h2 className="mb-3 font-bold">הרשמות (MongoDB) — צפייה, עריכה, מחיקה</h2>
          {editRegId && (
            <div className="mb-4 space-y-2 rounded border bg-gray-50 p-3">
              <p className="text-xs font-bold text-gray-600">עריכת הרשמה</p>
              <input
                value={editRegFirst}
                onChange={(e) => setEditRegFirst(e.target.value)}
                placeholder="שם פרטי"
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <input
                value={editRegLast}
                onChange={(e) => setEditRegLast(e.target.value)}
                placeholder="שם משפחה"
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <input
                value={editRegPhone}
                onChange={(e) => setEditRegPhone(e.target.value)}
                placeholder="טלפון"
                className="w-full rounded border px-2 py-1 text-sm"
                dir="ltr"
              />
              <input
                value={editRegLora}
                onChange={(e) => setEditRegLora(e.target.value)}
                placeholder="LoRa ID"
                className="w-full rounded border px-2 py-1 text-sm font-mono"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveRegistration}
                  className="rounded bg-green-700 px-3 py-1 text-sm text-white"
                >
                  שמור
                </button>
                <button
                  type="button"
                  onClick={() => setEditRegId('')}
                  className="rounded border px-3 py-1 text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
          <div className="max-h-96 overflow-auto text-sm">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-1">שם</th>
                  <th className="p-1">טלפון</th>
                  <th className="p-1">הכשרה</th>
                  <th className="p-1">משתתף</th>
                  <th className="p-1">סוג</th>
                  <th className="p-1">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r._id} className="border-b">
                    <td className="p-1">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="p-1 font-mono" dir="ltr">
                      {r.phone}
                    </td>
                    <td className="p-1">{medicalTrainingLabel(r.medicalTraining || 'none')}</td>
                    <td className="p-1">{participantTypeLabel(r.participantType)}</td>
                    <td className="p-1">{r.role}</td>
                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() => selectRegistration(r)}
                        className="ml-1 text-blue-700 hover:underline"
                      >
                        ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRegistration(r._id)}
                        className="text-red-700 hover:underline"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
                {regs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-2 text-gray-500">
                      אין הרשמות עדיין
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {maintenancePushes.length > 0 && (
        <section className="rounded-xl border border-blue-400 bg-blue-50 p-4">
          <h2 className="mb-2 font-bold text-blue-900">Push תחזוקה אוטומטי (סוללה &lt; 20%)</h2>
          <ul className="max-h-48 space-y-1 overflow-auto text-sm">
            {maintenancePushes.slice(0, 20).map((p) => (
              <li key={p._id}>
                {p.message}
                <span className="mr-2 text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleString('he-IL')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {maintenanceAlerts.length > 0 && (
        <section className="rounded-xl border border-amber-400 bg-amber-50 p-4">
          <h2 className="mb-2 font-bold text-amber-900">התראות תחזוקה — סוללה / תקינות</h2>
          <ul className="space-y-1 text-sm">
            {maintenanceAlerts.map((a, i) => (
              <li key={i}>
                {a.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
