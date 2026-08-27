export default function Sobre() {
  return (
    <div className="container">
      <div className="page-title">
        <h1>Sobre o atendimento</h1>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Como funciona</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          O atendimento acontece em sessões individuais de escuta, com horário marcado
          diretamente pela agenda deste site. Após a confirmação, você recebe os detalhes
          por e-mail e pode combinar os últimos detalhes pelo WhatsApp.
        </p>

        <h3 style={{ marginBottom: 10 }}>Para quem é</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Para quem busca um espaço de escuta acolhedor para conversar, refletir e ser
          ouvido, sem julgamentos.
        </p>

        <h3 style={{ marginBottom: 10 }}>Como acontece</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          As sessões são conduzidas de forma tranquila e respeitosa, respeitando o tempo
          e o ritmo de cada pessoa.
        </p>
      </div>
    </div>
  );
}
