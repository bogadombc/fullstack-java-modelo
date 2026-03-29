const MAPA_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

export function escapeHtml(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor).replace(/[&"'<>]/g, (caractere) => MAPA_ESCAPE[caractere]);
}
