// KORbuild Match — e-mails de aviso (lógica testável, sem dependências externas).
// Junta os avisos ainda não vistos de cada pessoa num e-mail só e marca como enviados.

export type Aviso = { id: number; categoria: string; titulo: string; texto: string | null; link: string | null };
export type Pendente = { user_id: string; email: string; nome: string; avisos: Aviso[] };
export type Email = { to: string; subject: string; html: string; text: string };

export type Deps = {
  cronSecret: string;
  site: string;                                   // ex.: https://korbuildmatch.com
  listar: () => Promise<Pendente[]>;              // rpc avisos_pendentes_email
  marcar: (ids: number[]) => Promise<void>;       // rpc marcar_avisos_enviados
  enviar: (email: Email) => Promise<void>;        // SMTP
};

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function linkAbsoluto(site: string, link: string | null): string {
  const base = site.replace(/\/+$/, '') + '/app/';
  if (!link) return base + 'notificacoes.html';
  if (/^https?:\/\//.test(link)) return link;
  return base + link.replace(/^\/+/, '');
}

export function montarEmail(p: Pendente, site: string): Email {
  const primeiro = (p.nome || '').split(' ')[0] || 'Olá';
  const n = p.avisos.length;
  const subject = n === 1 ? p.avisos[0].titulo + ' · KORbuild Match' : 'Você tem ' + n + ' avisos no KORbuild Match';
  const itens = p.avisos.slice(0, 10);
  const linhas = itens.map((a) =>
    '<tr><td style="padding:14px 0;border-bottom:1px solid #E3E8EF;">' +
      '<a href="' + esc(linkAbsoluto(site, a.link)) + '" style="color:#0A1628;text-decoration:none;">' +
        '<div style="font-size:15px;font-weight:800;line-height:22px;">' + esc(a.titulo) + '</div>' +
        (a.texto ? '<div style="font-size:14px;line-height:21px;color:#3A485C;">' + esc(a.texto) + '</div>' : '') +
      '</a></td></tr>').join('');
  const mais = n > itens.length ? '<p style="margin:12px 0 0;font-size:13px;color:#66748A;">E mais ' + (n - itens.length) + ' no app.</p>' : '';
  const html =
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + esc(subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background-color:#F3F6FA;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">' +
    '<div style="display:none;max-height:0;overflow:hidden;">' + esc(itens[0]?.titulo ?? '') + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F6FA;padding:32px 16px;"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E3E8EF;">' +
      '<tr><td style="padding:24px 40px;text-align:center;background-color:#0A1628;">' +
        '<span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:9px;background-color:#C6F432;color:#0A1628;font-weight:800;font-size:18px;vertical-align:middle;">&#10003;</span>' +
        '<span style="font-size:17px;font-weight:800;color:#FFFFFF;vertical-align:middle;padding-left:8px;">KORbuild <span style="color:#C6F432;">Match</span></span></td></tr>' +
      '<tr><td style="padding:32px 40px 8px;">' +
        '<h1 style="margin:0 0 6px;font-size:21px;line-height:28px;color:#0A1628;font-weight:800;">Olá, ' + esc(primeiro) + '!</h1>' +
        '<p style="margin:0 0 8px;font-size:15px;line-height:23px;color:#3A485C;">' + (n === 1 ? 'Você tem um aviso novo:' : 'Você tem ' + n + ' avisos novos:') + '</p>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + linhas + '</table>' + mais +
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 28px;"><tr><td style="border-radius:12px;background-color:#C6F432;">' +
          '<a href="' + esc(linkAbsoluto(site, itens.length === 1 ? itens[0].link : 'notificacoes.html')) + '" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:800;color:#0A1628;text-decoration:none;border-radius:12px;">' +
          (itens.length === 1 ? 'Abrir no KORbuild Match' : 'Ver todos os avisos') + ' &rarr;</a></td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="padding:20px 40px;background-color:#F3F6FA;border-top:1px solid #E3E8EF;text-align:center;">' +
        '<p style="margin:0 0 4px;font-size:12px;color:#8391A5;">Para escolher o que receber por e-mail, abra <a href="' + esc(linkAbsoluto(site, 'notificacoes.html#prefs')) + '" style="color:#1F4FD8;">Avisos → Como receber</a>.</p>' +
        '<p style="margin:0;font-size:12px;color:#8391A5;">KORbuild Match</p></td></tr>' +
    '</table></td></tr></table></body></html>';
  const text = 'Olá, ' + primeiro + '!\n\n' + itens.map((a) => '• ' + a.titulo + (a.texto ? '\n  ' + a.texto : '') + '\n  ' + linkAbsoluto(site, a.link)).join('\n\n') +
    (n > itens.length ? '\n\nE mais ' + (n - itens.length) + ' no app.' : '') + '\n\nEscolha o que receber por e-mail em: ' + linkAbsoluto(site, 'notificacoes.html#prefs') + '\n';
  return { to: p.email, subject, html, text };
}

export async function processar(deps: Deps): Promise<{ pessoas: number; enviados: number; falhas: number }> {
  const pendentes = await deps.listar();
  let enviados = 0, falhas = 0;
  for (const p of pendentes) {
    try {
      await deps.enviar(montarEmail(p, deps.site));
      await deps.marcar(p.avisos.map((a) => a.id));
      enviados++;
    } catch (e) {
      falhas++;
      console.error('Falha ao enviar para', p.user_id, e instanceof Error ? e.message : e);
    }
  }
  return { pessoas: pendentes.length, enviados, falhas };
}

export function criarHandler(deps: Deps): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (!deps.cronSecret || req.headers.get('x-cron-secret') !== deps.cronSecret) {
      return new Response(JSON.stringify({ erro: 'Não autorizado' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const r = await processar(deps);
    return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } });
  };
}
