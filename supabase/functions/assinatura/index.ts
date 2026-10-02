// KORbuild Match — Edge Function "assinatura" (Mercado Pago).
// Publicar com a verificação de JWT DESLIGADA: o Mercado Pago chama .../assinatura/webhook sem login,
// e a própria função confere o login do usuário nas outras ações.
// Segredos (Edge Functions → Secrets): MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, SITE_URL.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos no Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { criarHandler } from './lib.ts';

const env = (k: string, padrao = '') => Deno.env.get(k) ?? padrao;
const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

Deno.serve(criarHandler({
  mpToken: env('MP_ACCESS_TOKEN'),
  mpApi: env('MP_API_URL', 'https://api.mercadopago.com'),
  mpWebhookSecret: env('MP_WEBHOOK_SECRET'),
  site: env('SITE_URL', 'https://korbuildmatch.com'),
  banco: {
    usuarioDoToken: async (token) => {
      const { data, error } = await sb.auth.getUser(token);
      return error || !data.user ? null : { id: data.user.id, email: data.user.email ?? '' };
    },
    empresaDoDono: async (uid) => {
      const { data } = await sb.from('empresas').select('id, dono, nome').eq('dono', uid).maybeSingle();
      return data;
    },
    plano: async () => {
      const { data } = await sb.from('planos').select('preco, moeda').eq('id', 'essencial').maybeSingle();
      return data;
    },
    assinatura: async (empresaId) => {
      const { data } = await sb.from('assinaturas').select('*, empresas(dono)').eq('empresa_id', empresaId).maybeSingle();
      return data ? { ...data, dono: data.empresas?.dono } : null;
    },
    salvarAssinatura: async (empresaId, dados) => {
      const { error } = await sb.from('assinaturas').upsert({ empresa_id: empresaId, ...dados });
      if (error) throw new Error(error.message);
    },
    avisar: async (uid, titulo, texto) => {
      await sb.rpc('notificar', { p_user: uid, p_categoria: 'plano', p_titulo: titulo, p_texto: texto, p_link: 'plano.html' });
    },
  },
}));
