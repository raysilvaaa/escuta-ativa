'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

const DURATION_MIN = 30;

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [slots, setSlots] = useState([]);
  const [bookingsBySlot, setBookingsBySlot] = useState({});
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);

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

  async function handleAddSlot(e) {
    e.preventDefault();
    if (!newDate || !newTime) return;
    setSaving(true);
    const endTime = addMinutes(newTime, DURATION_MIN);
    await supabase.from('slots').insert({
      date: newDate,
      start_time: newTime,
      end_time: endTime,
    });
    setNewTime('');
    setSaving(false);
    loadData();
  }

  async function handleDeleteSlot(id) {
    await supabase.from('slots').delete().eq('id', id);
    loadData();
  }

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
        <h3 style={{ marginBottom: 16 }}>Abrir novo horário</h3>
        <form className="inline-form" onSubmit={handleAddSlot}>
          <div className="field">
            <label>Data</label>
            <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Início</label>
            <input type="time" required value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </form>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Cada sessão dura {DURATION_MIN} minutos — o fim é calculado automaticamente.
        </p>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 14 }}>Horários</h3>
        {slots.length === 0 && <p className="empty-state">Nenhum horário criado ainda.</p>}
        {slots.map((slot) => {
          const booking = bookingsBySlot[slot.id];
          return (
            <div className="slot-row" key={slot.id}>
              <div>
                <strong>{formatDateLabel(slot.date)}</strong> · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                {booking && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {booking.name} · {booking.email}{booking.phone ? ` · ${booking.phone}` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`tag ${slot.is_booked ? 'reservado' : 'livre'}`}>
                  {slot.is_booked ? 'Reservado' : 'Livre'}
                </span>
                {!slot.is_booked && (
                  <button className="link-btn" onClick={() => handleDeleteSlot(slot.id)}>Remover</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
