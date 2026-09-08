import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { Resend } from 'resend';

export async function POST(req) {
  const { slotIds, durationMinutes, name, email, phone, notes } = await req.json();

  if (!slotIds || slotIds.length === 0 || !name || !email) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Confere se todos os horários da sequência ainda estão livres
  const { data: slotsData, error: slotsError } = await db
    .from('slots')
    .select('*')
    .in('id', slotIds);

  if (slotsError || !slotsData || slotsData.length !== slotIds.length) {
    return NextResponse.json({ error: 'Horário não encontrado.' }, { status: 404 });
  }
  if (slotsData.some((s) => s.is_booked)) {
    return NextResponse.json(
      { error: 'Um dos horários dessa sequência acabou de ser reservado. Escolha outro.' },
      { status: 409 }
    );
  }

  const sorted = [...slotsData].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const firstSlot = sorted[0];

  // Cria o agendamento
  const { data: bookingData, error: bookingError } = await db
    .from('bookings')
    .insert({ slot_id: firstSlot.id, name, email, phone, notes, duration_minutes: durationMinutes || 30 })
    .select()
    .single();

  if (bookingError || !bookingData) {
    return NextResponse.json({ error: 'Não foi possível concluir o agendamento.' }, { status: 500 });
  }

  // Marca todos os horários da sequência como reservados
  const { error: updateError } = await db
    .from('slots')
    .update({ is_booked: true, booking_id: bookingData.id })
    .in('id', slotIds)
    .eq('is_booked', false);

  if (updateError) {
    await db.from('bookings').delete().eq('id', bookingData.id);
    return NextResponse.json({ error: 'Não foi possível reservar o horário.' }, { status: 500 });
  }

  // Envia e-mail de confirmação (não bloqueia a resposta se falhar)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const lastSlot = sorted[sorted.length - 1];
      const dateLabel = new Date(firstSlot.date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: email,
        subject: 'Seu horário de escuta está confirmado',
        html: `
          <p>Olá, ${name}.</p>
          <p>Seu horário foi reservado com sucesso:</p>
          <p><strong>${dateLabel}, ${firstSlot.start_time.slice(0, 5)}–${lastSlot.end_time.slice(0, 5)}</strong></p>
          <p>Qualquer dúvida, é só responder este e-mail.</p>
        `,
      });
    } catch (e) {
      console.error('Falha ao enviar e-mail de confirmação:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
