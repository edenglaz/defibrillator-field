'use client';

import { useEffect, useState } from 'react';
import { SIM_API, AUTH_API, fetchJson } from '@/lib/api';
import { MEDICAL_TRAINING_OPTIONS } from '@/lib/medicalTraining';
import { PARTICIPANT_TYPE_OPTIONS } from '@/lib/participantTypes';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loraId, setLoraId] = useState('');
  const [hasDefibrillator, setHasDefibrillator] = useState(true);
  const [hasLora, setHasLora] = useState(false);
  const [medicalTraining, setMedicalTraining] = useState('none');
  const [participantType, setParticipantType] = useState('defibrillator_owner');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [cmsIntro, setCmsIntro] = useState(
    'הרשמה בטלפון נייד בלבד, ללא סיסמה — לבעלי דפיברילטור נייד (עם/בלי LoRa) או נושאי LoRa בלבד.'
  );

  useEffect(() => {
    fetchJson<{ slug: string; content: string }[]>(`${AUTH_API}/cms/pages`, {
      cache: 'no-store',
    })
      .then((pages) => {
        const reg = pages.find((p) => p.slug === 'registration');
        if (reg?.content) setCmsIntro(reg.content);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const res = await fetchJson<{ success: boolean; role: string; message?: string }>(`${SIM_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          loraId: hasLora ? loraId : '',
          hasDefibrillator,
          hasLora,
          medicalTraining,
          participantType,
        }),
      });
      setMsg(res.message || `נרשמת בהצלחה! סוג: ${res.role}. אין צורך בסיסמה.`);
      setFirstName('');
      setLastName('');
      setPhone('');
      setLoraId('');
      setMedicalTraining('none');
      setParticipantType('defibrillator_owner');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'שגיאה');
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-red-800">הרשמה למיזם</h1>
      <p className="mb-6 text-gray-600">{cmsIntro}</p>

      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6 shadow">
        <label className="block">
          שם פרטי <span className="text-red-600">*</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          שם משפחה
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          מספר נייד <span className="text-red-600">*</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            dir="ltr"
          />
        </label>

        <label className="block">
          סוג משתתף ברשת
          <select
            value={participantType}
            onChange={(e) => setParticipantType(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            {PARTICIPANT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          הכשרה רפואית
          <select
            value={medicalTraining}
            onChange={(e) => setMedicalTraining(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            {MEDICAL_TRAINING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2 rounded border p-3">
          <legend className="px-1 font-bold">סוג השתתפות</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasDefibrillator}
              onChange={(e) => setHasDefibrillator(e.target.checked)}
            />
            יש לי דפיברילטור נייד
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasLora} onChange={(e) => setHasLora(e.target.checked)} />
            יש לי מכשיר LoRa (433MHz)
          </label>
        </fieldset>

        {hasLora && (
          <label className="block">
            LoRa ID / DevEUI <span className="text-red-600">*</span>
            <input
              required={hasLora}
              value={loraId}
              onChange={(e) => setLoraId(e.target.value)}
              placeholder="DEV-0001-ABCD"
              className="mt-1 w-full rounded border px-3 py-2 font-mono"
              dir="ltr"
            />
          </label>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-red-700 py-3 font-bold text-white hover:bg-red-800"
        >
          שליחת הרשמה
        </button>
      </form>

      {msg && <p className="mt-4 rounded bg-green-100 p-3 text-green-800">{msg}</p>}
      {err && <p className="mt-4 rounded bg-red-100 p-3 text-red-800">{err}</p>}
    </div>
  );
}
