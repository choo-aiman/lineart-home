// DateTimePick — 날짜 + 시간(30분 단위) 고르기
// 이유: 학원 운영 기능 전체에서 시간을 30분 단위로만 잡도록 통일
//       (상담 가능 시간: 오전 10시 ~ 오후 9시)

'use client';

// 오전 10:00 ~ 오후 9:00, 30분 단위
export const TIME_OPTIONS = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 10; h <= 21; h += 1) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const ampm = h < 12 ? '오전' : '오후';
      const h12 = h <= 12 ? h : h - 12;
      out.push({ value, label: `${ampm} ${h12}:${String(m).padStart(2, '0')}` });
    }
  }
  return out;
})();

const pad = (n: number) => String(n).padStart(2, '0');

export function dateStrOf(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeStrOf(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // 30분 단위로 맞춰서 보여줌
  const m = d.getMinutes() < 15 ? 0 : d.getMinutes() < 45 ? 30 : 0;
  const h = d.getMinutes() >= 45 ? d.getHours() + 1 : d.getHours();
  return `${pad(Math.min(h, 21))}:${pad(m)}`;
}

export function combine(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// 오늘 날짜 문자열
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// n개월 뒤 날짜 문자열
export function monthsLaterStr(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DateTimePick({
  value,
  onChange,
  min,
  max,
  inputStyle,
  disabled = false,
}: {
  value: string | null;              // ISO 문자열
  onChange: (iso: string | null) => void;
  min?: string;                      // YYYY-MM-DD
  max?: string;                      // YYYY-MM-DD
  inputStyle: React.CSSProperties;
  disabled?: boolean;                // 잠금 (예약 확정 후 등)
}) {
  const date = dateStrOf(value);
  const time = timeStrOf(value);

  // 잠겼을 때는 회색으로 보이게
  const lockedStyle: React.CSSProperties = disabled
    ? { backgroundColor: '#F0F0F0', color: '#888', cursor: 'not-allowed' }
    : { cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="date"
        value={date}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(combine(e.target.value, time || '10:00'))}
        onClick={(e) => { if (!disabled) e.currentTarget.showPicker?.(); }}
        onFocus={(e) => { if (!disabled) e.currentTarget.showPicker?.(); }}
        style={{ ...inputStyle, flex: 1, ...lockedStyle }}
      />
      <select
        value={time}
        disabled={disabled}
        onChange={(e) => onChange(combine(date || todayStr(), e.target.value))}
        style={{ ...inputStyle, flex: 1, ...lockedStyle }}
      >
        <option value="">시간</option>
        {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
    </div>
  );
}
