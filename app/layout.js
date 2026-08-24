import './globals.css';

export const metadata = {
  title: 'Agenda de Escuta',
  description: 'Marque um horário de escuta psicológica',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
