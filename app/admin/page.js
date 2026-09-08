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
    const booking = bookingsBySlot[slotId];
    if (booking) {
      await supabase.from('slots').update({ is_booked: false, booking_id: null }).eq('booking_id', booking.id);
      await supabase.from('bookings').delete().eq('id', booking.id);
    } else {
      await supabase.from('slots').update({ is_booked: false }).eq('id', slotId);
    }
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
  for (let d = 1; d 
