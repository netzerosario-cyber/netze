// ============================================================
// lib/share.ts — Utilidad para compartir propiedades
// Usa la Web Share API nativa en mobile, clipboard en desktop
// ============================================================

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/**
 * Intenta compartir usando la Web Share API (mobile nativo).
 * Fallback: copia el link al portapapeles y devuelve true.
 */
export async function shareProperty(payload: SharePayload): Promise<'shared' | 'copied' | 'error'> {
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return 'shared';
    }
    await navigator.clipboard.writeText(payload.url);
    return 'copied';
  } catch {
    return 'error';
  }
}

export function buildSharePayload(address: string, priceLabel: string, id: number): SharePayload {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/propiedad/${id}`
    : `/propiedad/${id}`;

  return {
    title: `${address} — ${priceLabel} | Netze`,
    text: `Mirá esta propiedad en Netze: ${address} por ${priceLabel}`,
    url,
  };
}
