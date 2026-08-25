# Agenda de Escuta

Site de agendamento com duas visões:
- Visitante (`/`) — vê os horários livres e marca um.
- Profissional (`/admin`) — faz login, abre horários na agenda e vê quem marcou.

## Deploy

1. Crie um projeto no Supabase e rode o `supabase/schema.sql` no SQL Editor.
2. Crie um usuário em Authentication > Users (login do profissional).
3. Crie uma conta na Resend e gere uma API Key.
4. No Netlify, importe este repositório e configure as variáveis de ambiente
   (mesmos nomes do arquivo `.env.example`).
5. Publique o site.
