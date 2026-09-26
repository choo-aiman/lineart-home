// 상담 신청 페이지 (방문자용)
// 이유: 사이트 안에서 신청받고, 그 내용이 어드민 '상담예약 관리'에 바로 쌓이도록 함
// 신청 내용은 consult_reservations 표에 '신규' 상태로 저장됨 (읽기는 관리자만 가능)
// 신청 완료 문구는 관리자(상담예약 관리 > 설정)에서 고칠 수 있음

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { supabase } from '@/lib/supabase';

const DEFAULT_DONE_MESSAGE =
  '상담 신청이 접수됐습니다.\n\n남겨주신 연락처로 학원에서 확인 후 연락드릴게요.\n급하신 경우 063-283-7771 로 전화 주세요.';

// 상담 가능 시간: 오전 10시 ~ 오후 9시, 30분 단위
function buildTimeOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let h = 10; h <= 21; h += 1) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break; // 오후 9시까지
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const ampm = h < 12 ? '오전' : '오후';
      const h12 = h <= 12 ? h : h - 12;
      out.push({ value, label: `${ampm} ${h12}:${String(m).padStart(2, '0')}` });
    }
  }
  return out;
}

const TIME_OPTIONS = buildTimeOptions();

// 학생 구분과, 구분에 따라 물어볼 학년 / 나이 범위
const STUDENT_TYPES = [
  { key: 'middle', label: '중학생',  ask: 'grade' as const },
  { key: 'high',   label: '고등학생', ask: 'grade' as const },
  { key: 'ged',    label: '검정고시', ask: 'age' as const, min: 14, max: 30 },
  { key: 'retake', label: 'N수생',   ask: 'age' as const, min: 20, max: 30 },
  { key: 'etc',    label: '기타',    ask: 'age' as const, min: 10, max: 30 },
];

const PURPOSES = [
  { key: 'highschool', label: '고등학교 입시' },
  { key: 'university', label: '대학교 입시' },
  { key: 'hobby',      label: '취미' },
];

const RELATIONS = ['모', '부', '기타'];

function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

// 오늘 날짜 (지난 날짜는 고를 수 없게 하려고)
function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ConsultForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'fine' ? 'fine' : 'ani';
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();

  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [form, setForm] = useState({
    visitor_type: 'new', // new = 신규생, enrolled = 재원생
    field: initialMode,
    student_name: '',
    phone: '',
    student_type: '',
    grade: '',
    age: '',
    purpose: '',
    guardian: 'with',
    guardian_name: '',
    guardian_relation: '모',
    guardian_phone: '',
    date: '',
    time: '',
    memo: '',
  });
  const [agree, setAgree] = useState(false);
  const [trap, setTrap] = useState(''); // 덫 칸 (화면에 보이지 않음)
  const [saving, setSaving] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  // 신청 완료 문구 미리 불러두기 (관리자가 고칠 수 있는 값)
  const [message, setMessage] = useState(DEFAULT_DONE_MESSAGE);
  useEffect(() => {
    async function fetchMessage() {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'consult_submit_message')
        .maybeSingle();
      if (data?.value) setMessage(data.value);
    }
    fetchMessage();
  }, []);

  const typeInfo = STUDENT_TYPES.find((t) => t.key === form.student_type);
  const todayStr = todayString();
  // 재원생은 이미 학원에서 정보를 알고 있어 최소 항목만 받음
  const isNewStudent = form.visitor_type === 'new';

  async function submit() {
    if (!form.student_name.trim()) return alert('이름을 입력해주세요.');
    if (!form.phone.trim()) return alert('연락처를 입력해주세요. 확인 후 연락드릴 수 있어요.');
    if (isNewStudent && !form.student_type) return alert('학생 구분을 선택해주세요.');
    if (isNewStudent && typeInfo?.ask === 'grade' && !form.grade) return alert('학년을 선택해주세요.');
    if (isNewStudent && typeInfo?.ask === 'age' && !form.age) return alert('나이를 선택해주세요.');
    if (isNewStudent && !form.purpose) return alert('상담 목적을 선택해주세요.');
    if (form.guardian === 'with' && !form.guardian_name.trim()) return alert('보호자 성함을 입력해주세요.');
    if (form.guardian === 'with' && !form.guardian_phone.trim()) return alert('보호자 연락처를 입력해주세요.');
    if (!agree) return alert('개인정보 수집·이용에 동의해주세요.');

    // 덫 칸: 사람 눈에 보이지 않는 칸이라 비어 있는 게 정상.
    // 자동 프로그램은 모든 칸을 채우는 습성이 있어서, 값이 있으면 조용히 무시함
    if (trap) {
      setDoneMessage(message);
      return;
    }

    // 날짜와 시간을 합쳐서 저장 (둘 다 골랐을 때만)
    let preferredAt: string | null = null;
    if (form.date && form.time) {
      const dt = new Date(`${form.date}T${form.time}:00`);
      if (!Number.isNaN(dt.getTime())) preferredAt = dt.toISOString();
    }

    setSaving(true);
    const { error } = await supabase.from('consult_reservations').insert({
      visitor_type: form.visitor_type,
      student_name: form.student_name.trim(),
      phone: form.phone.trim(),
      mode: form.field,
      student_type: isNewStudent ? form.student_type : null,
      grade: isNewStudent && typeInfo?.ask === 'grade' && form.grade ? Number(form.grade) : null,
      age: isNewStudent && typeInfo?.ask === 'age' && form.age ? Number(form.age) : null,
      purpose: isNewStudent ? form.purpose : null,
      guardian: form.guardian,
      guardian_name: form.guardian === 'with' ? form.guardian_name.trim() : null,
      guardian_relation: form.guardian === 'with' ? form.guardian_relation : null,
      guardian_phone: form.guardian === 'with' ? form.guardian_phone.trim() : null,
      preferred_at: preferredAt,
      channel: '홈페이지',
      status: 'new',
      memo: form.memo.trim() || null,
    });
    setSaving(false);

    if (error) {
      // 같은 번호로 하루 5건을 넘긴 경우
      if (error.message.includes('DAILY_LIMIT_REACHED')) {
        alert('오늘은 이 연락처로 더 신청할 수 없어요.\n이미 접수된 신청을 확인 중이에요. 급하시면 063-283-7771 로 전화해주세요.');
        return;
      }
      alert('신청에 실패했어요. 잠시 후 다시 시도하거나 063-283-7771 로 전화해주세요.\n(' + error.message + ')');
      return;
    }
    setDoneMessage(message);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600,
    color: '#555', display: 'block', marginBottom: '6px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #E0E0E0', borderRadius: '10px',
    fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: '#1A1A1A',
    outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff',
  };

  // 작은 선택 버튼들 (구분 / 학년 / 나이 / 목적)
  const chips = (
    options: { key: string; label: string }[],
    value: string,
    onPick: (key: string) => void,
  ) => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            style={{
              padding: '9px 16px', borderRadius: '20px',
              border: `1px solid ${selected ? mainColor : '#E0E0E0'}`,
              backgroundColor: selected ? mainColor : '#ffffff',
              color: selected ? '#ffffff' : '#888',
              fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  // 선택 버튼 2개짜리 공통 모양 (분야 / 보호자 동반)
  const choice = (
    options: { key: string; label: string; color?: string }[],
    value: string,
    onPick: (key: string) => void,
  ) => (
    <div style={{ display: 'flex', gap: '10px' }}>
      {options.map((o) => {
        const selected = value === o.key;
        const color = o.color ?? mainColor;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              border: `1px solid ${selected ? color : '#E0E0E0'}`,
              backgroundColor: selected ? color : '#ffffff',
              color: selected ? '#ffffff' : '#888',
              fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Nav mode={mode} setMode={setMode} />

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 20px 80px' }}>
        <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(24px, 2vw, 32px)', fontWeight: 900, color: '#1A1A1A', marginBottom: '8px' }}>
          상담 신청
        </h1>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: '#888', lineHeight: 1.7, marginBottom: '36px' }}>
          아래 내용을 남겨주시면 학원에서 확인 후 연락드려요. 1분이면 끝나요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>상담 종류 *</label>
            {choice(
              [
                { key: 'new', label: '신규 상담' },
                { key: 'enrolled', label: '재원생 상담' },
              ],
              form.visitor_type,
              (key) => setForm({ ...form, visitor_type: key }),
            )}
            {!isNewStudent && (
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
                라인아트 미술학원 재원생은 몇 가지만 간단히 적어주세요.
              </p>
            )}
          </div>

          <div>
            {/* 신규는 '희망 분야', 재원생은 다니고 있는 '반 구분' */}
            <label style={labelStyle}>{isNewStudent ? '희망 분야 *' : '반 구분 *'}</label>
            {choice(
              [
                { key: 'ani', label: isNewStudent ? '만화·애니' : '애니반', color: '#FF1659' },
                { key: 'fine', label: isNewStudent ? '회화' : '회화반', color: '#515883' },
              ],
              form.field,
              (key) => { setForm({ ...form, field: key }); setMode(key); },
            )}
          </div>

          <div>
            <label style={labelStyle}>이름 *</label>
            <input
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
              placeholder="예: 홍길동"
              maxLength={40}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>연락처 *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
              maxLength={30}
              style={inputStyle}
            />
          </div>

          {isNewStudent && (
          <div>
            <label style={labelStyle}>학생 구분 *</label>
            {chips(
              STUDENT_TYPES.map((t) => ({ key: t.key, label: t.label })),
              form.student_type,
              (key) => setForm({ ...form, student_type: key, grade: '', age: '' }),
            )}

            {/* 중·고등학생은 학년, 나머지는 나이 */}
            {typeInfo?.ask === 'grade' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#888' }}>학년 *</label>
                {chips(
                  [1, 2, 3].map((g) => ({ key: String(g), label: `${g}학년` })),
                  form.grade,
                  (key) => setForm({ ...form, grade: key }),
                )}
              </div>
            )}
            {typeInfo?.ask === 'age' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#888' }}>나이 *</label>
                {chips(
                  range(typeInfo.min ?? 10, typeInfo.max ?? 30).map((a) => ({ key: String(a), label: `${a}세` })),
                  form.age,
                  (key) => setForm({ ...form, age: key }),
                )}
              </div>
            )}
          </div>
          )}

          {isNewStudent && (
            <div>
              <label style={labelStyle}>상담 목적 *</label>
              {chips(PURPOSES, form.purpose, (key) => setForm({ ...form, purpose: key }))}
            </div>
          )}

          <div>
            <label style={labelStyle}>보호자 동반 여부 *</label>
            {choice(
              [
                { key: 'with', label: '보호자 동반' },
                { key: 'alone', label: '혼자 방문' },
              ],
              form.guardian,
              (key) => setForm({ ...form, guardian: key }),
            )}

            {/* 보호자가 함께 오시는 경우에만 */}
            {form.guardian === 'with' && (
              <div style={{ marginTop: '14px', padding: '16px', border: '1px solid #F0F0F0', borderRadius: '10px', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px', color: '#888' }}>보호자 성함 *</label>
                  <input
                    value={form.guardian_name}
                    onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                    placeholder="예: 홍부모"
                    maxLength={40}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px', color: '#888' }}>관계 *</label>
                  {chips(
                    RELATIONS.map((r) => ({ key: r, label: r })),
                    form.guardian_relation,
                    (key) => setForm({ ...form, guardian_relation: key }),
                  )}
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px', color: '#888' }}>보호자 연락처 *</label>
                  <input
                    type="tel"
                    value={form.guardian_phone}
                    onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                    placeholder="010-0000-0000"
                    maxLength={30}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>희망 상담 일시</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={form.date}
                min={todayStr}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                // 칸 아무 데나 눌러도 달력이 열리도록 (달력 아이콘만 눌러야 하는 불편 해소)
                onClick={(e) => e.currentTarget.showPicker?.()}
                onFocus={(e) => e.currentTarget.showPicker?.()}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
              />
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
              >
                <option value="">시간 선택</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
              상담 가능 시간은 오전 10시 ~ 오후 9시예요.
            </p>
          </div>

          <div>
            <label style={labelStyle}>문의 내용</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="궁금한 점이나 현재 상황을 자유롭게 적어주세요."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* 덫 칸 — 사람에게는 보이지 않음 (자동 신청 프로그램 거르기용) */}
          <input
            type="text"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: mainColor, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
              상담 안내를 위해 이름과 연락처를 수집하는 데 동의합니다. 수집한 정보는 상담 목적으로만 쓰고, 요청하시면 삭제해 드려요.{' '}
              <a href="/privacy" target="_blank" style={{ color: mainColor, textDecoration: 'underline' }}>개인정보처리방침</a>
            </span>
          </label>

          <button
            onClick={submit}
            disabled={saving}
            style={{
              width: '100%', padding: '16px', marginTop: '8px',
              backgroundColor: mainColor, color: '#ffffff', border: 'none', borderRadius: '10px',
              fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '신청 중...' : '상담 신청하기'}
          </button>

          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', textAlign: 'center' }}>
            전화 상담도 가능해요 · <strong>063-283-7771</strong>
          </p>
        </div>
      </div>

      {/* 신청 완료 팝업 — 문구는 관리자에서 수정 가능 */}
      {doneMessage !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 32px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: '#1A1A1A', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: '28px' }}>
              {doneMessage}
            </p>
            <button
              onClick={() => router.push(`/?mode=${mode}`)}
              style={{ width: '100%', padding: '14px', backgroundColor: mainColor, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ConsultPage() {
  return (
    <Suspense>
      <ConsultForm />
    </Suspense>
  );
}
