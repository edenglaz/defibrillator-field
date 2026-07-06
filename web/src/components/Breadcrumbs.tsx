'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  '': 'בית',
  emergency: 'קריאת מצוקה',
  register: 'הרשמה',
  'lora-shops': 'חנויות LoRa',
  admin: 'אדמין',
  dispatch: 'מוקד / דיווח',
  fleet: 'מאגר מכשירים',
  volunteer: 'אפליקציית מתנדב',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [{ href: '/', label: 'בית' }];
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({ href: path, label: LABELS[seg] || seg });
  }

  return (
    <nav aria-label="breadcrumb" className="mb-4 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-400">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-red-800">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-red-700 hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
