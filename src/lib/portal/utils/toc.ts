export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Tach cac heading h2/h3 (co id) tu body_html de build muc luc.
 * Vi du: <h2 id="ket_luan">Ket Luan</h2> -> { id: 'ket_luan', text: 'Ket Luan', level: 2 }
 */
export function extractToc(html: string): TocItem[] {
  if (!html) return [];

  const regex = /<h([23])[^>]*id=["']([^"']+)["'][^>]*>(.*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    items.push({ id, text, level });
  }

  return items;
}
