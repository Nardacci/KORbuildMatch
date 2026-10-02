// KORbuild Match — Edge Function "enviar-avisos".
// Chamada a cada 10 minutos pelo pg_cron (supabase/agendamentos.sql), com o cabeçalho x-cron-secret.
// Segredos (Edge Functions → Secrets): CRON_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, SITE_URL.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos no Supabase.
import nodemailer from 'npm:nodemailer@6.9.16';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { criarHandler } from './lib.ts';

const env = (k: string, padrao = '') => Deno.env.get(k) ?? padrao;
const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const porta = Number(env('SMTP_PORT', '465'));
const smtp = nodemailer.createTransport({
  host: env('SMTP_HOST', 'smtp.hostinger.com'),
  port: porta,
  secure: porta === 465,  // Hostinger: 465 com SSL (as Edge Functions não abrem as portas 25 e 587)
  auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined,
});

Deno.serve(criarHandler({
  cronSecret: env('CRON_SECRET'),
  site: env('SITE_URL', 'https://korbuildmatch.com'),
  listar: async () => {
    const { data, error } = await sb.rpc('avisos_pendentes_email', { p_limite: 50, p_espera_min: 3 });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  marcar: async (ids) => {
    const { error } = await sb.rpc('marcar_avisos_enviados', { p_ids: ids });
    if (error) throw new Error(error.message);
  },
  enviar: async (email) => {
    await smtp.sendMail({ from: env('EMAIL_FROM', 'KORbuild Match <no-reply@getkolbuild.com>'), ...email });
  },
}));
