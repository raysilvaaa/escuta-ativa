const FAQS = [
  {
    q: 'Como funciona o atendimento?',
    a: 'Você escolhe um horário disponível na agenda, preenche seus dados e confirma. Depois disso, recebe um e-mail de confirmação com os detalhes.',
  },
  {
    q: 'Quanto tempo dura?',
    a: 'A duração pode variar conforme o horário disponível — cada horário mostra o tempo da sessão ao ser aberto na agenda.',
  },
  {
    q: 'Preciso conversar pelo WhatsApp antes?',
    a: 'Não é obrigatório. Você pode marcar direto pela agenda. Se preferir tirar dúvidas antes, é só chamar no WhatsApp pela página de Contato.',
  },
  {
    q: 'Como faço para cancelar?',
    a: 'Entre em contato pelo WhatsApp informando a data e o horário marcados, e o cancelamento é feito manualmente.',
  },
  {
    q: 'Como escolho o horário?',
    a: 'Na página de Agendamento, os dias com horários livres aparecem em colunas. Basta tocar no horário desejado e preencher o formulário.',
  },
];

export default function FAQ() {
  return (
    <div className="container">
      <div className="page-title">
        <h1>Perguntas frequentes</h1>
      </div>

      <div className="card">
        {FAQS.map((item) => (
          <div className="faq-item" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
