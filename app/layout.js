import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Agenda de Escuta',
  description: 'Marque um horário de escuta psicológica',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="site-nav">
          <div className="site-nav-inner">
            <Link href="/">Início</Link>
            <Link href="/sobre">Sobre o atendimento</Link>
            <Link href="/agendamento">Agendamento</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/faq">Perguntas frequentes</Link>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="site-footer">
          <p>Este serviço não substitui acompanhamento psicológico, psiquiátrico ou atendimento profissional especializado.</p>
        </footer>
      </body>
    </html>
  );
}
