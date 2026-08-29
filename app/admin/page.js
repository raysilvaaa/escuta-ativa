'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2 horas', value: 120 },
];

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
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

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [timeRows, setTimeRows] = useState([{ time: '', duration: 30 }]);

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
    const map = {};
    (bookingData || []).forEach((b) => { map[b.slot_id] = b; });
    setBookingsBySlot(map);
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

  async function handleCancelBooking(slotId) {
    await supabase.from('bookings').delete().eq('slot_id', slotId);
    await supabase.from('slots').update({ is_booked: false }).eq('id', slotId);
    loadData();
  }

  function updateTimeRow(index, field, value) {
    setTimeRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addTimeRow() {
    setTimeRows((rows) => [...rows, { time: '', duration: 30 }]);
  }

  function removeTimeRow(index) {
    setTimeRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSaveDay() {
    const validRows = timeRows.filter((r) => r.time);
    if (validRows.length === 0) return;
    setSaving(true);
    for (const row of validRows) {
      const endTime = addMinutes(row.time, Number(row.duration));
      await supabase.from('slots').insert({
        date: selectedDate,
        start_time: row.time,
        end_time: endTime,
      });
    }
    setTimeRows([{ time: '', duration: 30 }]);
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

          <div className="time-rows">
            {timeRows.map((row, i) => (
              <div className="time-row" key={i}>
                <input
                  type="time"
                  step="1800"
                  value={row.time}
                  onChange={(e) => updateTimeRow(i, 'time', e.target.value)}
                />
                <select
                  value={row.duration}
                  onChange={(e) => updateTimeRow(i, 'duration', e.target.value)}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {timeRows.length > 1 && (
                  <button className="time-row-remove" onClick={() => removeTimeRow(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <button className="add-time-row-btn" onClick={addTimeRow}>+ adicionar outro horário</button>

          <button className="btn-primary" onClick={handleSaveDay} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar horários deste dia'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 14 }}>Horários de {formatDayDetailTitle(selectedDate)}</h3>
        {daySlots.length === 0 && <p className="empty-state">Nenhum horário aberto neste dia.</p>}
        {daySlots.map((slot) => {
          const booking = bookingsBySlot[slot.id];
          const isOpen = expandedId === slot.id;
          return (
            <div className={`slot-card ${slot.is_booked ? 'reservado' : 'livre'}`} key={slot.id}>
              <div className="slot-card-header" onClick={() => setExpandedId(isOpen ? null : slot.id)}>
                <div>
                  <div className="slot-card-time">{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</div>
                  {booking && <div className="slot-card-name">{booking.name}</div>}
                </div>
                <div className="slot-card-right">
                  <span className={`tag ${slot.is_booked ? 'reservado' : 'livre'}`}>
                    {slot.is_booked ? 'Reservado' : 'Livre'}
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
                      <button className="link-btn" onClick={() => handleCancelBooking(slot.id)}>Cancelar reserva</button>
                    </>
                  ) : (
                    <button className="link-btn" onClick={() => handleDeleteSlot(slot.id)}>Remover horário</button>
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
