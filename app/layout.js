import './globals.css';
import SiteNav from '../components/SiteNav';

export const metadata = {
  title: 'Agenda de Escuta',
  description: 'Marque um horário de escuta psicológica',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteNav />
        <main>{children}</main>
        <footer className="site-footer">
          <p>Este serviço não substitui acompanhamento psicológico, psiquiátrico ou atendimento profissional especializado.</p>
        </footer>
      </body>
    </html>
  );
}
