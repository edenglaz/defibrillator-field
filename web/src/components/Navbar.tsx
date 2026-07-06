import Link from 'next/link';

const links = [
  { href: '/', label: 'בית' },
  { href: '/emergency', label: 'קריאת מצוקה' },
  { href: '/dispatch', label: 'מוקד' },
  { href: '/fleet', label: 'מאגר מכשירים' },
  { href: '/volunteer', label: 'אפליקציית מתנדב' },
  { href: '/register', label: 'הרשמה' },
  { href: '/lora-shops', label: 'חנויות LoRa' },
  { href: '/admin', label: 'אדמין' },
];

export default function Navbar() {
  return (
    <nav className="bg-red-700 text-white shadow-lg" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          דפיברילטור בשטח — Pro Bono
        </Link>
        <ul className="flex flex-wrap gap-4 text-sm md:text-base">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="https://defi.co.il/#/map"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              איפה דפי (מד&quot;א)
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
