'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/">Início</Link>
        <Link href="/sobre">Sobre o atendimento</Link>
        <Link href="/agendamento">Agendamento</Link>
        <Link href="/contato">Contato</Link>
        <Link href="/faq">Perguntas frequentes</Link>
      </div>
    </nav>
  );
}
