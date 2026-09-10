'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const DURATION_OPTIONS = [
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1 hora e 30', value: 90 },
];

function formatTime(t) {
  return t.slice(0, 5);
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60) % 24).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function dayParts(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return {
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
    daynum: date.getDate(),
    month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
  };
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

const DAYS_PER_PAGE = 3;

export default function Agendamento() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(30);
  const [selected, setSelected] = useState(null); // { date, startSlot, chain: [slots] }
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    setSelected(null);
  }, [duration]);

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

  const neededBlocks = duration / 30;

  // Agrupa por data, e pra cada data acha quais horários de início têm blocos
  // consecutivos livres suficientes pra cobrir a duração escolhida.
  const grouped = {};
  const byDate = slots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  Object.entries(byDate).forEach(([date, daySlots]) => {
    const sorted = [...daySlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const byStart = {};
    sorted.forEach((s) => { byStart[s.start_time.slice(0, 5)] = s; });


    const validStarts = [];
    sorted.forEach((s) => {
      const chain = [];
      let cur = timeToMinutes(s.start_time);
      let ok = true;
      for (let i = 0; i < neededBlocks; i++) {
        const t = minutesToTime(cur);
        const found = byStart[t];
        if (!found) { ok = false; break; }
        chain.push(found);
        cur += 30;
      }
      if (ok) validStarts.push({ startSlot: s, chain });
    });

    if (validStarts.length > 0) grouped[date] = validStarts;
  });

  const uniqueDates = Object.keys(grouped);
  const visibleDates = uniqueDates.slice(page * DAYS_PER_PAGE, page * DAYS_PER_PAGE + DAYS_PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * DAYS_PER_PAGE < uniqueDates.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotIds: selected.chain.map((s) => s.id),
        durationMinutes: duration,
        ...form,
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error || 'Não foi possível concluir o agendamento. Tente novamente.');
      loadSlots();
      return;
    }
    setBooked(selected);
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (booked) {
    const lastSlot = booked.chain[booked.chain.length - 1];
    const message = encodeURIComponent(
      `Olá! Marquei um horário de escuta no dia ${formatDateLabel(booked.startSlot.date)} às ${formatTime(booked.startSlot.start_time)} (${duration} min). Gostaria de combinar o pagamento.`
    );
    return (
      <div className="container">
        <div className="confirmation">
          <div className="wave">
            {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
          </div>
          <h2>Horário reservado</h2>
          <p>
            {formatDateLabel(booked.startSlot.date)} às {formatTime(booked.startSlot.start_time)}–{formatTime(lastSlot.end_time)}.
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
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-title">
        <h1>Agendamento</h1>
      </div>

      <div className="field" style={{ marginBottom: 24 }}>
        <label>Duração da sessão</label>
        <select
          value={duration}
          onChange={(e) => { setDuration(Number(e.target.value)); setPage(0); }}
          style={{
            width: '100%',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '11px 13px',
            fontSize: '0.98rem',
            fontFamily: 'inherit',
            background: '#fff',
          }}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="empty-state">Carregando horários…</p>}

      {!loading && uniqueDates.length === 0 && (
        <p className="empty-state">Nenhum horário disponível para essa duração no momento.</p>
      )}

      {!loading && uniqueDates.length > 0 && (
        <>
          <div className="calendar-nav">
            <button disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>‹</button>
            <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>

          <div className="day-columns">
            {visibleDates.map((date) => {
              const parts = dayParts(date);
              return (
                <div className="day-column" key={date}>
                  <div className="day-column-header">
                    <div className="weekday">{parts.weekday}</div>
                    <div className="daynum">{parts.daynum}</div>
                    <div className="month">{parts.month}</div>
                  </div>
                  {grouped[date].map(({ startSlot, chain }) => (
                    <button
                      key={startSlot.id}
                      className={`slot-btn ${selected?.startSlot.id === startSlot.id ? 'selected' : ''}`}
                      onClick={() => setSelected({ date, startSlot, chain })}
                    >
                      {formatTime(startSlot.start_time)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <form className="card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 18 }}>
            {formatDateLabel(selected.date)} às {formatTime(selected.startSlot.start_time)} ({duration} min)
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
          <p className="privacy-note">Seus dados serão utilizados apenas para o agendamento do atendimento.</p>
        </form>
      )}
    </div>
  );
}
