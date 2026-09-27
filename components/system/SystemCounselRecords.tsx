// SystemCounselRecords — 상담 기록
// 이유: 상담한 내용을 학생별로 남기고, 다음 상담 예약까지 이어지게 함
// 안정성 설계:
//  - 고치는 내용은 화면에만 두고 '저장' 버튼을 눌러야 데이터베이스에 들어감
//  - 저장하지 않은 내용이 있으면 창을 닫거나 탭을 옮길 때 경고
//  - 삭제는 학생 이름을 직접 입력해야 실행됨
//  - 예약된 상담은 시간이 지날 때까지 목록 맨 위에 다른 색으로 고정

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DateTimePick, { dateStrOf, todayStr, monthsLaterStr } from '@/components/system/DateTimePick';

type Mode = 'ani' | 'fine';

interface Record {
  id: number;
  created_at: string;
  mode: string;
  counseled_at: string;
  student_name: string;
  student_phone: string | null;
  school: string | null;
  grade: string | null;
  age: number | null;
  purpose: string | null;
  counselor: string | null;
  cause: string | null;
  process: string | null;
  result: string | null;
  next_reserved: boolean;
  next_at: string | null;
  next_reservation_id: number | null;
  from_reservation_id: number | null;
}

interface ReservationPick {
  id: number;
  student_name: string;
  phone: string | null;
  school: string | null;
  grade: number | null;
  age: number | null;
  mode: string | null;
  visitor_type: string | null;
  preferred_at: string | null;
  created_at: string;
}

const PURPOSES = [
  { key: 'admission', label: '입시' },
  { key: 'career',    label: '진로' },
  { key: 'tuition',   label: '원비' },
  { key: 'relation',  label: '관계' },
  { key: 'etc',       label: '기타' },
];

// 학년 — 초등(4·5·6학년)은 거의 받지 않아 뒤로 뺌
// '재학'은 대학생인 경우에 사용
const GRADES = ['1학년', '2학년', '3학년', '진행', '통과', '재학', '졸업', '4학년', '5학년', '6학년'];
const AGES = Array.from({ length: 21 }, (_, i) => i + 10); // 10~30세

// 학교는 줄임말·띄어쓰기 없이 풀네임으로 (예: 전주사대부속고등학교, 검정고시)
function schoolProblem(value: string): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;                                   // 비어 있으면 아직 확인하지 않음
  if (/\s/.test(value)) return '띄어쓰기 없이 붙여서 적어주세요';
  if (v === '검정고시') return null;
  if (/(초등학교|중학교|고등학교|예술고등학교|대학교)$/.test(v)) return null;
  if (/(초|중|고|여고|여중)$/.test(v)) return '줄이지 말고 풀네임으로 적어주세요 (예: 전주사대부속고등학교)';
  return '학교 풀네임 또는 검정고시로 적어주세요';
}

// 두 날짜 중 더 늦은 쪽 (다음 상담 일시의 최소 날짜 계산용)
function maxDate(a: string, b: string): string {
  return a && a > b ? a : b;
}

// 30분 단위로 맞춘 현재 시각
function nowRounded(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
  return toInputValue(d.toISOString());
}

function toInputValue(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// 예약이 아직 지나지 않았는지 (지나면 고정 해제)
function isUpcoming(r: Record): boolean {
  return !!(r.next_reserved && r.next_at && new Date(r.next_at).getTime() > Date.now());
}

export default function SystemCounselRecords({ focusId }: { focusId?: number | null }) {
  const [mode, setMode] = useState<Mode>('ani');
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  // 상담 예약에 이미 등록된 건은 잠가두고, '예약 수정'을 눌러야 고칠 수 있음
  const [unlockedId, setUnlockedId] = useState<number | null>(null);
  const [staff, setStaff] = useState<string[]>([]);

  // 고치는 중인 내용 (저장 전) — 기록 id 별로 보관
  const [drafts, setDrafts] = useState<Partial<Record>>({});
  const [draftId, setDraftId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // 불러오기 창
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picks, setPicks] = useState<ReservationPick[]>([]);

  // 새 기록 만들기 패널
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPick, setNewPick] = useState<ReservationPick | null>(null);

  const dirty = draftId !== null && Object.keys(drafts).length > 0;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('counsel_records')
      .select('*')
      .eq('mode', mode)
      .order('counseled_at', { ascending: false });
    setLoading(false);
    if (error) {
      alert('불러오기 실패: ' + error.message);
      return;
    }
    setRecords(data ?? []);
  }, [mode]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // 상담 예약에서 '상담 기록으로 넘기기'로 들어온 경우 그 기록을 바로 열어줌
  useEffect(() => {
    if (!focusId) return;
    async function focus() {
      const { data } = await supabase.from('counsel_records').select('mode').eq('id', focusId).maybeSingle();
      if (data?.mode === 'ani' || data?.mode === 'fine') setMode(data.mode);
      setOpenId(focusId ?? null);
      setDraftId(focusId ?? null);
      setDrafts({});
    }
    focus();
  }, [focusId]);

  useEffect(() => {
    async function fetchStaff() {
      const { data } = await supabase.rpc('consult_staff');
      if (data) setStaff((data as { name: string; role: string }[]).map((s) => `${s.name}-${s.role}`));
    }
    fetchStaff();
  }, []);

  // 저장하지 않은 내용이 있으면 창을 닫을 때 경고
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function startEdit(id: number) {
    if (dirty && draftId !== id && !confirm('저장하지 않은 내용이 있어요. 그래도 다른 기록을 여시겠어요?')) return;
    setOpenId(openId === id ? null : id);
    setDraftId(id);
    setDrafts({});
  }

  function setField(key: keyof Record, value: unknown) {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  function valueOf(r: Record, key: keyof Record) {
    return draftId === r.id && key in drafts ? (drafts as never)[key] : r[key];
  }

  // 새 기록 만들기 — 팝업 대신 화면 안에서 이름을 찾거나 직접 입력
  async function openNewPanel() {
    setNewOpen(true);
    setNewName('');
    setNewPick(null);
    if (picks.length === 0) {
      const { data } = await supabase
        .from('consult_reservations')
        .select('id, student_name, phone, school, grade, age, mode, visitor_type, preferred_at, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      setPicks(data ?? []);
    }
  }

  async function createRecord() {
    const name = (newPick?.student_name ?? newName).trim();
    if (!name) return alert('학생 이름을 입력하거나 목록에서 골라주세요.');
    const { data, error } = await supabase
      .from('counsel_records')
      .insert({
        mode,
        student_name: name,
        counseled_at: new Date(nowRounded()).toISOString(),
        student_phone: newPick?.phone ?? null,
        school: newPick?.school ?? null,
        grade: newPick?.grade ? `${newPick.grade}학년` : null,
        age: newPick?.age ?? null,
        from_reservation_id: newPick?.id ?? null,
      })
      .select()
      .single();
    if (error) {
      alert('추가 실패: ' + error.message);
      return;
    }
    setNewOpen(false);
    await fetchRecords();
    setOpenId(data.id);
    setDraftId(data.id);
    setDrafts({});
  }

  async function saveRecord(r: Record) {
    if (draftId !== r.id || Object.keys(drafts).length === 0) {
      alert('바뀐 내용이 없어요.');
      return;
    }
    // 학교 이름이 줄임말이거나 띄어쓰기가 있으면 저장하지 않음
    const school = (valueOf(r, 'school') as string) ?? '';
    const problem = schoolProblem(school);
    if (problem) {
      alert(`학교 이름을 확인해주세요.\n${problem}\n\n예) 전주사대부속고등학교, 전주예술고등학교, 검정고시`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('counsel_records').update(drafts).eq('id', r.id);
    if (error) {
      setSaving(false);
      alert('저장 실패: ' + error.message + '\n(내용은 화면에 그대로 있으니 다시 저장해보세요)');
      return;
    }

    // 추후 상담 예약을 켜 두었으면 상담 예약 탭에도 자동으로 반영
    const merged = { ...r, ...drafts } as Record;
    const message = await syncReservation(r, merged);

    setSaving(false);
    setDrafts({});
    setDraftId(null);
    setUnlockedId(null); // 저장하면 다시 잠금
    await fetchRecords();
    if (message) alert(message);
  }

  // 상담 기록의 '추후 상담 예약'을 상담 예약 목록과 맞춰줌
  async function syncReservation(before: Record, after: Record): Promise<string | null> {
    // 예약을 켰고 일시가 있으면 → 새로 만들거나 기존 예약의 일시를 고침
    if (after.next_reserved && after.next_at) {
      if (before.next_reservation_id) {
        const { error } = await supabase
          .from('consult_reservations')
          .update({
            preferred_at: after.next_at,
            student_name: after.student_name,
            phone: after.student_phone,
            school: after.school,
            mode: after.mode,
          })
          .eq('id', before.next_reservation_id);
        if (error) return '저장은 됐지만 상담 예약 수정에 실패했어요: ' + error.message;
        return '저장했어요. 상담 예약의 일시도 함께 바꿨어요.';
      }

      const { data, error } = await supabase
        .from('consult_reservations')
        .insert({
          student_name: after.student_name,
          phone: after.student_phone,
          school: after.school,
          mode: after.mode,
          visitor_type: 'enrolled',
          preferred_at: after.next_at,
          channel: '상담 후 예약',
          status: 'confirmed',
          memo: `상담 기록(${formatDateTime(after.counseled_at)})에서 이어진 예약입니다.`,
        })
        .select()
        .single();
      if (error) return '저장은 됐지만 상담 예약 등록에 실패했어요: ' + error.message;

      await supabase.from('counsel_records').update({ next_reservation_id: data.id }).eq('id', before.id);
      return '저장했어요. 상담 예약 탭에도 예약이 등록됐어요.';
    }

    // 예약은 켰는데 일시를 안 정한 경우 안내
    if (after.next_reserved && !after.next_at) {
      return '저장했어요. 다음 상담 일시를 정하고 다시 저장하면 상담 예약에도 등록돼요.';
    }

    // 예약을 껐는데 이미 만든 예약이 있으면 → 어떻게 할지 물어봄
    if (!after.next_reserved && before.next_reservation_id) {
      if (confirm('추후 상담 예약을 껐어요.\n상담 예약 목록에 있는 이 예약도 "상담 취소"로 바꿀까요?')) {
        await supabase.from('consult_reservations').update({ status: 'canceled' }).eq('id', before.next_reservation_id);
        await supabase.from('counsel_records').update({ next_reservation_id: null }).eq('id', before.id);
        return '저장했어요. 상담 예약도 취소로 바꿨어요.';
      }
    }
    return null;
  }

  async function deleteRecord(r: Record) {
    const typed = prompt(
      `⚠️ 상담 기록을 삭제합니다.\n\n` +
      `학생: ${r.student_name}\n상담 일시: ${formatDateTime(r.counseled_at)}\n\n` +
      `되돌릴 수 없어요.\n\n정말 삭제하려면 학생 이름을 그대로 입력해주세요: ${r.student_name}`,
      '',
    );
    if (typed === null) return;
    if (typed.trim() !== r.student_name) return alert('이름이 달라서 삭제하지 않았어요.');
    const { error } = await supabase.from('counsel_records').delete().eq('id', r.id);
    if (error) alert('삭제 실패: ' + error.message);
    setDraftId(null);
    setDrafts({});
    fetchRecords();
  }

  // 상담 예약 목록에서 학생 정보 불러오기
  async function openPicker() {
    const { data, error } = await supabase
      .from('consult_reservations')
      .select('id, student_name, phone, school, grade, age, mode, visitor_type, preferred_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      alert('불러오기 실패: ' + error.message);
      return;
    }
    setPicks(data ?? []);
    setPickerOpen(true);
  }

  function applyPick(p: ReservationPick) {
    setDrafts((prev) => ({
      ...prev,
      student_name: p.student_name,
      student_phone: p.phone,
      school: p.school,
      grade: p.grade ? `${p.grade}학년` : null,
      age: p.age ?? null,
      from_reservation_id: p.id,
    }));
    setPickerOpen(false);
  }

  // 상담 기록은 상담한 날짜 최신순으로만 (예약 고정은 '상담 예약' 탭에서 함)
  const visible = useMemo(() => {
    const q = search.trim();
    return q ? records.filter((r) => r.student_name.includes(q)) : records;
  }, [records, search]);

  const label: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px',
  };
  const input: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#1A1A1A', outline: 'none',
    backgroundColor: '#ffffff', boxSizing: 'border-box',
  };
  const btn: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
  };

  const textArea = (r: Record, key: 'cause' | 'process' | 'result', title: string) => (
    <div>
      <span style={label}>{title}</span>
      <textarea
        value={(valueOf(r, key) as string) ?? ''}
        onChange={(e) => setField(key, e.target.value)}
        rows={4}
        placeholder={`${title}을(를) 적어주세요`}
        style={{ ...input, resize: 'vertical', lineHeight: 1.7, minHeight: '92px' }}
      />
    </div>
  );

  function recordCard(r: Record) {
    const open = openId === r.id;
    const upcoming = isUpcoming(r);
    const isDraft = draftId === r.id && Object.keys(drafts).length > 0;
    const nextReserved = Boolean(valueOf(r, 'next_reserved'));
    const locked = Boolean(r.next_reservation_id) && unlockedId !== r.id;

    return (
      <div
        key={r.id}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid ' + (open ? '#FF1659' : '#E0E0E0'),
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* 요약 줄 */}
        <button
          onClick={() => startEdit(r.id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px', backgroundColor: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap',
          }}
        >
          {/* 다음 상담이 잡혀 있으면 참고용으로만 표시 (고정은 '상담 예약' 탭에서) */}
          {upcoming && (
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
              다음 상담 {formatDateTime(r.next_at)}
            </span>
          )}
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>
            {r.student_name}
          </span>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555' }}>
            {formatDateTime(r.counseled_at)}
          </span>
          {r.purpose && (
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#555', backgroundColor: '#F5F5F5', padding: '3px 10px', borderRadius: '20px' }}>
              {PURPOSES.find((p) => p.key === r.purpose)?.label ?? r.purpose}
            </span>
          )}
          {r.counselor && (
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888' }}>{r.counselor}</span>
          )}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDraft && (
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: '#FF1659' }}>
                저장 안 됨
              </span>
            )}
            <span style={{ fontSize: '12px', color: '#888', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
          </span>
        </button>

        {open && (
          <div style={{ borderTop: '1px solid #F0F0F0', padding: '20px 18px', backgroundColor: '#FAFAFA' }}>
            {/* 첫째 줄 — 상담 일시 + 불러오기 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '300px', flex: '0 1 340px' }}>
                <span style={label}>상담 일시</span>
                <DateTimePick
                  value={(valueOf(r, 'counseled_at') as string) ?? null}
                  onChange={(iso) => setField('counseled_at', iso ?? r.counseled_at)}
                  inputStyle={input}
                />
              </div>
              <button onClick={openPicker} style={{ ...btn, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}>
                상담 예약에서 불러오기
              </button>
              <button
                onClick={() => alert('재원생 관리 기능을 만들면 여기에서 바로 불러올 수 있어요.\n지금은 준비 중이에요.')}
                style={{ ...btn, backgroundColor: '#ffffff', color: '#aaa', border: '1px solid #E0E0E0' }}
              >
                재원생에서 불러오기 (준비 중)
              </button>
            </div>

            {/* 둘째 줄 — 이름 · 학교 · 학년 · 나이 (칸마다 필요한 만큼만) */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 150px' }}>
                <span style={label}>이름</span>
                <input
                  value={(valueOf(r, 'student_name') as string) ?? ''}
                  onChange={(e) => setField('student_name', e.target.value)}
                  style={input}
                />
              </div>
              <div style={{ flex: '0 0 230px' }}>
                {(() => {
                  const school = (valueOf(r, 'school') as string) ?? '';
                  const problem = schoolProblem(school);
                  return (
                    <>
                      <span style={problem ? { ...label, color: '#FF1659', fontWeight: 700 } : label}>
                        학교명(띄어쓰기 없이){problem ? ` · ${problem}` : ''}
                      </span>
                      <input
                        value={school}
                        onChange={(e) => setField('school', e.target.value)}
                        placeholder="예: 전주사대부속고등학교 / 검정고시"
                        style={{
                          ...input,
                          border: problem ? '1px solid #FF1659' : '1px solid #E0E0E0',
                          backgroundColor: problem ? '#FFF0F4' : '#ffffff',
                        }}
                      />
                    </>
                  );
                })()}
              </div>
              {/* 학년과 나이는 따로 — 중·고생은 학년, 검정고시·N수생은 나이만 채워짐 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: '0 0 110px' }}>
                  <span style={label}>학년</span>
                  <select
                    value={(valueOf(r, 'grade') as string) ?? ''}
                    onChange={(e) => setField('grade', e.target.value || null)}
                    style={{ ...input, cursor: 'pointer' }}
                  >
                    <option value="">-</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    {(() => {
                      const g = (valueOf(r, 'grade') as string) ?? '';
                      return g && !GRADES.includes(g) ? <option value={g}>{g}</option> : null;
                    })()}
                  </select>
                </div>
                <div style={{ flex: '0 0 96px' }}>
                  <span style={label}>나이</span>
                  <select
                    value={valueOf(r, 'age') ? String(valueOf(r, 'age')) : ''}
                    onChange={(e) => setField('age', e.target.value ? Number(e.target.value) : null)}
                    style={{ ...input, cursor: 'pointer' }}
                  >
                    <option value="">-</option>
                    {AGES.map((a) => <option key={a} value={a}>{a}세</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 셋째 줄 — 연락처 · 상담 목적 · 상담 강사 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 160px' }}>
                <span style={label}>연락처</span>
                <input
                  value={(valueOf(r, 'student_phone') as string) ?? ''}
                  onChange={(e) => setField('student_phone', e.target.value)}
                  placeholder="010-0000-0000"
                  style={input}
                />
              </div>
              <div style={{ flex: '0 0 130px' }}>
                <span style={label}>상담 목적</span>
                <select
                  value={(valueOf(r, 'purpose') as string) ?? ''}
                  onChange={(e) => setField('purpose', e.target.value || null)}
                  style={{ ...input, cursor: 'pointer' }}
                >
                  <option value="">-</option>
                  {PURPOSES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ flex: '0 0 180px' }}>
                <span style={label}>상담 강사</span>
                <select
                  value={(valueOf(r, 'counselor') as string) ?? ''}
                  onChange={(e) => setField('counselor', e.target.value || null)}
                  style={{ ...input, cursor: 'pointer' }}
                >
                  <option value="">미지정</option>
                  {staff.map((s) => <option key={s} value={s}>{s}</option>)}
                  {r.counselor && !staff.includes(r.counselor) && <option value={r.counselor}>{r.counselor}</option>}
                </select>
              </div>
            </div>

            {/* 넷째 줄 — 원인 · 상담 과정 · 결과 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {textArea(r, 'cause', '원인')}
              {textArea(r, 'process', '상담 과정')}
              {textArea(r, 'result', '결과')}
            </div>

            {/* 셋째 줄 — 추후 상담 예약 (기본 닫힘) */}
            <div style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '16px', backgroundColor: '#ffffff', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: locked ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={nextReserved}
                  disabled={locked}
                  onChange={(e) => setField('next_reserved', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#FF1659', cursor: locked ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>
                  추후 상담 예약
                </span>
              </label>

              {nextReserved && (
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '300px' }}>
                    <span style={label}>다음 상담 일시</span>
                    <DateTimePick
                      value={(valueOf(r, 'next_at') as string) ?? null}
                      onChange={(iso) => setField('next_at', iso)}
                      // 상담한 날보다 이전은 고를 수 없고, 6개월 뒤까지만
                      min={maxDate(dateStrOf((valueOf(r, 'counseled_at') as string) ?? null), todayStr())}
                      max={monthsLaterStr(6)}
                      inputStyle={input}
                      disabled={locked}
                    />
                  </div>
                  {locked ? (
                    <>
                      <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#2E7D32', backgroundColor: '#E8F5E9', padding: '9px 14px', borderRadius: '8px' }}>
                        상담 예약에 등록됨 ✓
                      </span>
                      <button
                        onClick={() => setUnlockedId(r.id)}
                        style={{ ...btn, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}
                      >
                        예약 수정
                      </button>
                    </>
                  ) : r.next_reservation_id ? (
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#FF1659', backgroundColor: '#FFF0F4', padding: '9px 14px', borderRadius: '8px' }}>
                      수정 중 — 저장하면 상담 예약도 함께 바뀌어요
                    </span>
                  ) : (
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555', backgroundColor: '#F5F5F5', padding: '9px 14px', borderRadius: '8px' }}>
                      저장하면 상담 예약에도 자동 등록돼요
                    </span>
                  )}
                  <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa', flexBasis: '100%' }}>
                    예약을 잡으면 이 기록이 목록 맨 위에 노란색으로 고정돼요. 예약 시간이 지나면 자동으로 내려가요.
                    일시를 바꾸고 저장하면 상담 예약의 일시도 함께 바뀌어요.
                  </p>
                </div>
              )}
            </div>

            {/* 저장 · 삭제 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: isDraft ? '#FF1659' : '#aaa' }}>
                {isDraft ? '저장하지 않은 내용이 있어요. 저장을 눌러주세요.' : '마지막 저장 완료'}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => saveRecord(r)}
                  disabled={saving}
                  style={{ ...btn, backgroundColor: '#FF1659', color: '#ffffff', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => deleteRecord(r)}
                  style={{ ...btn, backgroundColor: 'transparent', color: '#FF1659', border: '1px solid #FF1659' }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          상담 기록
        </h2>
        <button onClick={() => (newOpen ? setNewOpen(false) : openNewPanel())} style={{ ...btn, backgroundColor: '#FF1659', color: '#ffffff' }}>
          {newOpen ? '닫기' : '+ 새 상담 기록'}
        </button>
      </div>

      {/* 새 상담 기록 만들기 — 이름을 직접 쓰거나 상담 예약에서 찾기 */}
      {newOpen && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #FF1659', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
            새 상담 기록 ({mode === 'ani' ? '애니' : '회화'})
          </p>
          <span style={label}>학생 이름</span>
          <input
            value={newPick ? newPick.student_name : newName}
            onChange={(e) => { setNewName(e.target.value); setNewPick(null); }}
            placeholder="이름을 입력하면 상담 예약에서 같은 이름을 찾아줘요"
            style={{ ...input, maxWidth: '360px' }}
          />

          {/* 이름으로 상담 예약 찾기 */}
          {(newName.trim() || newPick) && (
            <div style={{ marginTop: '12px' }}>
              {newPick ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#2E7D32', backgroundColor: '#E8F5E9', padding: '6px 12px', borderRadius: '8px' }}>
                    {newPick.student_name} · {newPick.phone ?? '연락처 없음'} · {newPick.school ?? '학교 미입력'} 정보를 가져와요
                  </span>
                  <button onClick={() => { setNewPick(null); setNewName(''); }} style={{ ...btn, backgroundColor: 'transparent', color: '#888', border: '1px solid #E0E0E0', fontSize: '12px', padding: '6px 12px' }}>
                    선택 해제
                  </button>
                </div>
              ) : (
                (() => {
                  const q = newName.trim();
                  const found = picks.filter((p) => p.student_name.includes(q)).slice(0, 6);
                  if (found.length === 0) {
                    return (
                      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa' }}>
                        상담 예약에 같은 이름이 없어요. 이대로 새로 만들 수 있어요.
                      </p>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '520px' }}>
                      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>상담 예약에서 찾은 학생 (누르면 정보를 가져와요)</p>
                      {found.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setNewPick(p)}
                          style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', backgroundColor: '#FAFAFA', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#1A1A1A' }}
                        >
                          {p.student_name}
                          <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>
                            {p.visitor_type === 'enrolled' ? '재원생' : '신규'} · {p.mode === 'fine' ? '회화' : '애니'} · {p.phone ?? '-'} · 희망 {formatDateTime(p.preferred_at)}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={createRecord} style={{ ...btn, backgroundColor: '#FF1659', color: '#ffffff' }}>
              상담 기록 만들기
            </button>
            <button onClick={() => setNewOpen(false)} style={{ ...btn, backgroundColor: 'transparent', color: '#888', border: '1px solid #E0E0E0' }}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 전공 구분 + 이름 검색 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F0F0F0', borderRadius: '10px', padding: '4px' }}>
          {(['ani', 'fine'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (dirty && !confirm('저장하지 않은 내용이 있어요. 그래도 옮기시겠어요?')) return;
                setDrafts({}); setDraftId(null); setOpenId(null); setMode(m);
              }}
              style={{
                ...btn, fontSize: '13px', padding: '6px 18px',
                backgroundColor: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? (m === 'ani' ? '#FF1659' : '#515883') : '#888',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'ani' ? '애니' : '회화'}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="학생 이름으로 찾기 (예: 홍길동 또는 홍길동_3기)"
          style={{ ...input, maxWidth: '320px' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ ...btn, backgroundColor: 'transparent', color: '#888', border: '1px solid #E0E0E0' }}>
            검색 지우기
          </button>
        )}
      </div>

      {loading && <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', padding: '20px' }}>불러오는 중...</p>}

      {!loading && visible.length === 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#aaa' }}>
            {search ? '찾는 이름의 상담 기록이 없어요' : '아직 상담 기록이 없어요. 오른쪽 위 + 버튼으로 시작하세요'}
          </p>
        </div>
      )}


      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visible.map(recordCard)}
      </div>

      {/* 불러오기 창 */}
      {pickerOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPickerOpen(false); }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '70vh', overflowY: 'auto' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
              상담 예약에서 불러오기
            </p>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              고르면 이름·연락처·학교·학년이 채워져요. (저장을 눌러야 반영돼요)
            </p>
            {picks.length === 0 && (
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#aaa' }}>불러올 상담 예약이 없어요.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {picks.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPick(p)}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E0E0E0', backgroundColor: '#ffffff', cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>
                    {p.student_name}
                  </span>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                    {p.visitor_type === 'enrolled' ? '재원생' : '신규'} · {p.mode === 'fine' ? '회화' : '애니'} · {p.phone ?? '연락처 없음'} · {formatDateTime(p.preferred_at)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPickerOpen(false)}
              style={{ ...btn, marginTop: '16px', backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
