'use client';

import { useState, useRef } from 'react';

export default function OCRScanner({ onExtracted }: { onExtracted: (data: { merchant?: string; amount?: number; currency?: string; date?: string; cardLast4?: string; rawText: string; confidence: number }) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (!f.type.startsWith('image/') || f.size > 8 * 1024 * 1024) {
      alert('Only JPEG/PNG/WebP up to 8MB');
      return;
    }
    const url = URL.createObjectURL(f);
    setPreview(url);
    setLoading(true);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(f, 'eng+fra+ara', { logger: (m: { status: string; progress?: number }) => { if (m.status === 'recognizing text') console.log(m.progress); } });
      setText(result.data.text);
      setConfidence(result.data.confidence);
      const amountMatch = result.data.text.match(/(?:TOTAL|TOTAL TTC|NET À PAYER|AMOUNT DUE|المجموع|المبلغ الإجمالي)[:\s]*([\d\s]+[.,]\d{2})/i);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.').replace(/\s/g, '')) : undefined;
      const last4Match = result.data.text.match(/(?:ending|•••|\*{4}|carte)[:\s]*(\d{4})/i);
      const cardLast4 = last4Match ? last4Match[1] : undefined;
      onExtracted({ amount, cardLast4, rawText: result.data.text, confidence: result.data.confidence / 100 });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{ border: '1px solid #1e242c', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button onClick={() => inputRef.current?.click()} style={{ padding: '8px 14px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: '#7d8794', font: '500 12px IBM Plex Mono, monospace' }}>SELECT IMAGE</button>
      {preview && <img src={preview} alt="preview" style={{ maxWidth: 200, borderRadius: 4, border: '1px solid #1e242c' }} />}
      {loading && <div style={{ color: '#7d8794', font: '400 11px IBM Plex Mono, monospace' }}>Processing OCR...</div>}
      {text && (
        <div style={{ background: '#0f1318', padding: 10, borderRadius: 4, maxHeight: 150, overflowY: 'auto', font: '11px IBM Plex Mono, monospace', color: '#7d8794' }}>{text}</div>
      )}
      {confidence > 0 && <div style={{ color: '#7d8794', font: '400 10px IBM Plex Mono, monospace' }}>Confidence: {confidence.toFixed(1)}%</div>}
    </div>
  );
}
