import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <div className="hero">
        <div className="wave">
          {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
        </div>
        <h1>Escutar é o primeiro passo para transformar histórias.</h1>
        <p>Milena Gonzaga · Um espaço de escuta psicológica, pensado para acolher.</p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Este espaço foi criado para facilitar o agendamento de sessões de escuta.
          Conheça mais sobre como funciona o atendimento ou já marque um horário disponível.
        </p>
        <Link href="/agendamento" className="btn-whatsapp" style={{ display: 'inline-block' }}>
          Ver horários disponíveis
        </Link>
      </div>
    </div>
  );
}
