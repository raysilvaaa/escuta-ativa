import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { Resend } from 'resend';

export async function POST(req) {
  const { slotId, name, email, phone, notes } = await req.json();

  if (!slotId || !name || !email) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: slot, error: slotError } = await db
    .from('slots')
    .select('*')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Horário não encontrado.' }, { status: 404 });
  }
  if (slot.is_booked) {
    return NextResponse.json(
      { error: 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.' },
      { status: 409 }
    );
  }

  const { error: updateError } = await db
    .from('slots')
    .update({ is_booked: true })
    .eq('id', slotId)
    .eq('is_booked', false);

  if (updateError) {
    return NextResponse.json({ error: 'Não foi possível reservar o horário.' }, { status: 500 });
  }

  const { error: bookingError } = await db
    .from('bookings')
    .insert({ slot_id: slotId, name, email, phone, notes });

  if (bookingError) {
    await db.from('slots').update({ is_booked: false }).eq('id', slotId);
    return NextResponse.json({ error: 'Não foi possível concluir o agendamento.' }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const dateLabel = new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR', {
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
          <p><strong>${dateLabel} às ${slot.start_time.slice(0, 5)}</strong></p>
          <p>Qualquer dúvida, é só responder este e-mail.</p>
        `,
      });
    } catch (e) {
      console.error('Falha ao enviar e-mail de confirmação:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
