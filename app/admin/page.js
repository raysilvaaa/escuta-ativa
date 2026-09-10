'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

function formatDayDetailTitle(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [slots, setSlots] = useState([]);
  const [bookingsBySlot, setBookingsBySlot] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [blockError, setBlockError] = useState('');

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [blockRows, setBlockRows] = useState([{ start: '', end: '' }]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    const { data: slotData } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setSlots(slotData || []);

    const { data: bookingData } = await supabase.from('bookings').select('*');
    const bookingById = {};
    (bookingData || []).forEach((b) => { bookingById[b.id] = b; });
    setBookingsBySlot(bookingById);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError('E-mail ou senha incorretos.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleDeleteSlot(id) {
    await supabase.from('slots').delete().eq('id', id);
    loadData();
  }

  async function handleCancelBooking(bookingId) {
    await supabase.from('slots').update({ is_booked: false, booking_id: null }).eq('booking_id', bookingId);
    await supabase.from('bookings').delete().eq('id', bookingId);
    loadData();
  }

  function updateBlockRow(index, field, value) {
    setBlockRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addBlockRow() {
    setBlockRows((rows) => [...rows, { start: '', end: '' }]);
  }

  function removeBlockRow(index) {
    setBlockRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSaveBlocks() {
    setBlockError('');
    const validRows = blockRows.filter((r) => r.start && r.end);
    if (validRows.length === 0) return;

    for (const row of validRows) {
      if (timeToMinutes(row.end) <= timeToMinutes(row.start)) {
        setBlockError('O horário final precisa ser depois do inicial.');
        return;
      }
    }

    setSaving(true);
    const newSlots = [];
    for (const row of validRows) {
      let cur = timeToMinutes(row.start);
      const end = timeToMinutes(row.end);
      while (cur < end) {
        newSlots.push({
          date: selectedDate,
          start_time: minutesToTime(cur),
          end_time: minutesToTime(cur + 30),
        });
        cur += 30;
      }
    }
    await supabase.from('slots').insert(newSlots);
    setBlockRows([{ start: '', end: '' }]);
    setSaving(false);
    loadData();
  }

  const datesWithSlots = new Set(slots.map((s) => s.date));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDateStr(today);

  const calendarCells = [];
  for (let i = 0; i < startOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  function goToPrevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function goToNextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  const daySlots = slots
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Junta horários consecutivos da mesma reserva num único card
  const groupedSlots = [];
  daySlots.forEach((slot) => {
    const last = groupedSlots[groupedSlots.length - 1];
    if (slot.booking_id && last && last.bookingId === slot.booking_id && last.end === slot.start_time) {
      last.end = slot.end_time;
      last.slotIds.push(slot.id);
    } else {
      groupedSlots.push({
        start: slot.start_time,
        end: slot.end_time,
        bookingId: slot.booking_id,
        isBooked: slot.is_booked,
        slotIds: [slot.id],
      });
    }
  });

  if (checkingSession) return null;

  if (!session) {
    return (
      <div className="container">
        <div className="hero">
          <h1>Área do profissional</h1>
        </div>
        <form className="card" onSubmit={handleLogin} style={{ maxWidth: 380, margin: '0 auto' }}>
          <div className="field">
            <label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {loginError && <p className="error-text">{loginError}</p>}
          <button className="btn-primary">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Sua agenda</h1>
        <button className="link-btn" onClick={handleLogout}>Sair</button>
      </div>

      <div className="card">
        <div className="month-calendar">
          <div className="month-header">
            <button onClick={goToPrevMonth}>‹</button>
            <div className="month-title">
              {viewMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={goToNextMonth}>›</button>
          </div>

          <div className="month-grid">
            {WEEKDAY_LABELS.map((w, i) => (
              <div className="month-weekday" key={i}>{w}</div>
            ))}
            {calendarCells.map((d, i) => {
              if (d === null) return <div className="month-day empty" key={i} />;
              const dateStr = toDateStr(new Date(year, month, d));
              const isPast = dateStr < todayStr;
              const isSelected = dateStr === selectedDate;
              const hasSlots = datesWithSlots.has(dateStr);
              return (
                <button
                  key={i}
                  className={`month-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${hasSlots ? 'has-slots' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  {d}
                  {hasSlots && <span className="dot" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="day-detail">
          <div className="day-detail-title">{formatDayDetailTitle(selectedDate)}</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Abra um bloco de tempo livre — o sistema divide sozinho em intervalos de 30 min.
          </p>

          <div className="time-rows">
            {blockRows.map((row, i) => (
              <div className="time-row" key={i}>
                <select value={row.start} onChange={(e) => updateBlockRow(i, 'start', e.target.value)}>
                  <option value="">Início</option>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={row.end} onChange={(e) => updateBlockRow(i, 'end', e.target.value)}>
                  <option value="">Fim</option>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {blockRows.length > 1 && (
                  <button className="time-row-remove" onClick={() => removeBlockRow(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <button className="add-time-row-btn" onClick={addBlockRow}>+ adicionar outro bloco</button>

          {blockError && <p className="error-text">{blockError}</p>}

          <button className="btn-primary" onClick={handleSaveBlocks} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar horários deste dia'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 14 }}>Horários de {formatDayDetailTitle(selectedDate)}</h3>
        {groupedSlots.length === 0 && <p className="empty-state">Nenhum horário aberto neste dia.</p>}
        {groupedSlots.map((group) => {
          const booking = group.bookingId ? bookingsBySlot[group.bookingId] : null;
          const groupKey = group.slotIds.join('-');
          const isOpen = expandedId === groupKey;
          return (
            <div className={`slot-card ${group.isBooked ? 'reservado' : 'livre'}`} key={groupKey}>
              <div className="slot-card-header" onClick={() => setExpandedId(isOpen ? null : groupKey)}>
                <div>
                  <div className="slot-card-time">{group.start.slice(0, 5)}–{group.end.slice(0, 5)}</div>
                  {booking && <div className="slot-card-name">{booking.name}</div>}
                </div>
                <div className="slot-card-right">
                  <span className={`tag ${group.isBooked ? 'reservado' : 'livre'}`}>
                    {group.isBooked ? 'Reservado' : 'Livre'}
                  </span>
                  <span className={`slot-card-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                </div>
              </div>
              {isOpen && (
                <div className="slot-card-body">
                  {booking ? (
                    <>
                      <p>{booking.email}</p>
                      {booking.phone && <p>{booking.phone}</p>}
                      {booking.duration_minutes && <p>Duração: {booking.duration_minutes} min</p>}
                      <button className="link-btn" onClick={() => handleCancelBooking(group.bookingId)}>Cancelar reserva</button>
                    </>
                  ) : (
                    <button className="link-btn" onClick={() => handleDeleteSlot(group.slotIds[0])}>Remover horário</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
