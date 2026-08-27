export default function Contato() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o atendimento de escuta.');

  return (
    <div className="container">
      <div className="page-title">
        <h1>Contato</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Prefere conversar diretamente antes de marcar um horário? É só chamar no WhatsApp.
        </p>
        {whatsappNumber && (
          <a
            className="btn-whatsapp"
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chamar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
