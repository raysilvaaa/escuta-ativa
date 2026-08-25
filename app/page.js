'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function formatTime(t) {
  return t.slice(0, 5);
}

export default function Home() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    setLoading(true);
    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setSlots(data || []);
    setLoading(false);
  }

  const grouped = slots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: selected.id, ...form }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error || 'Não foi possível concluir o agendamento. Tente novamente.');
      return;
    }
    setBooked(selected);
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (booked) {
    const message = encodeURIComponent(
      `Olá! Marquei um horário de escuta no dia ${formatDateLabel(booked.date)} às ${formatTime(booked.start_time)}. Gostaria de combinar o pagamento.`
    );
    return (
      <div className="container">
        <div className="confirmation">
          <div className="wave">
            {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
          </div>
          <h2>Horário reservado</h2>
          <p>
            {formatDateLabel(booked.date)} às {formatTime(booked.start_time)}.
            <br />
            Enviamos os detalhes para {form.email}.
          </p>
          {whatsappNumber && (
            <a
              className="btn-whatsapp"
              href={`https://wa.me/${whatsappNumber}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Combinar pagamento no WhatsApp
            </a>
          )}
        </div>
        <footer>Um espaço de escuta.</footer>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <div className="wave">
          {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
        </div>
        <h1>Um espaço pra ser ouvido.</h1>
        <p>Escolha um horário livre na agenda abaixo para marcar sua sessão de escuta.</p>
      </div>

      {loading && <p className="empty-state">Carregando horários…</p>}

      {!loading && Object.keys(grouped).length === 0 && (
        <p className="empty-state">Nenhum horário disponível no momento. Volte em breve.</p>
      )}

      {Object.entries(grouped).map(([date, daySlots]) => (
        <div className="day-group" key={date}>
          <div className="day-label">{formatDateLabel(date)}</div>
          <div className="slot-grid">
            {daySlots.map((slot) => (
              <button
                key={slot.id}
                className={`slot-btn ${selected?.id === slot.id ? 'selected' : ''}`}
                onClick={() => setSelected(slot)}
              >
                {formatTime(slot.start_time)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <form className="card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 18 }}>
            {formatDateLabel(selected.date)} às {formatTime(selected.start_time)}
          </h3>
          <div className="field">
            <label>Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label>WhatsApp</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 90000-0000"
            />
          </div>

          <div className="field">
            <label>Alguma observação? (opcional)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Confirmando…' : 'Confirmar horário'}
          </button>
        </form>
      )}

      <footer>Um espaço de escuta.</footer>
    </div>
  );
}
