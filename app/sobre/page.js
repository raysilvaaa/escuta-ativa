export default function Sobre() {
  return (
    <div className="container">
      <div className="page-title">
        <h1>Sobre o atendimento</h1>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>O que significa ser uma Active Listener</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Mais do que ouvir, é estar presente, compreender e acolher de verdade.
          É criar um espaço seguro para que o outro se sinta ouvido e validado.
        </p>

        <h3 style={{ marginBottom: 10 }}>Como funciona</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          O atendimento acontece em sessões individuais de escuta, com horário marcado
          diretamente pela agenda deste site. Após a confirmação, você recebe os detalhes
          por e-mail e pode combinar os últimos detalhes pelo WhatsApp.
        </p>

        <h3 style={{ marginBottom: 10 }}>Como acontece</h3>
        <ul style={{ color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 20, marginBottom: 24 }}>
          <li><strong style={{ color: 'var(--text)' }}>Ouvir com atenção</strong> — escuta que vai além das palavras</li>
          <li><strong style={{ color: 'var(--text)' }}>Acolher sem julgamentos</strong> — respeito e empatia em cada conversa</li>
          <li><strong style={{ color: 'var(--text)' }}>Fazer perguntas que geram conexão</strong> — abrindo portas para novas perspectivas</li>
          <li><strong style={{ color: 'var(--text)' }}>Compreender para transformar</strong> — entender é o primeiro passo para ajudar</li>
          <li><strong style={{ color: 'var(--text)' }}>Promover clareza e autoconhecimento</strong> — apoio para decisões mais conscientes</li>
        </ul>

        <h3 style={{ marginBottom: 10 }}>Para quem é</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Para quem busca escuta com empatia, acolhimento de verdade, conexão que
          transforma e clareza para novos caminhos.
        </p>
      </div>
    </div>
  );
}
