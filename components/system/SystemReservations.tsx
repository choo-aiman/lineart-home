// SystemReservations — 상담예약 관리
// 이유: 통합 운영 시스템의 첫 기능. 상담 신청을 받아 일정과 진행 상태를 관리
// 목록은 한 줄 요약 + 펼치기(아코디언) 구조 — 표를 가로로 늘리지 않고 내용을 충분히 보여주기 위함
// 펼친 내용의 순서는 방문자가 보는 신청 폼과 같게 맞춤
// 데이터는 Supabase 의 consult_reservations 표 ('통합 운영' 권한자만 접근 가능)

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Reservation {
  id: number;
  created_at: string;
  visitor_type: string | null;
  student_name: string;
  phone: string | null;
  student_type: string | null;
  grade: number | null;
  age: number | null;
  purpose: string | null;
  guardian: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
  mode: string | null;
  preferred_at: string | null;
  channel: string | null;
  status: string;
  assigned_to: string | null;
  memo: string | null;
}

// key 는 데이터베이스에 저장된 값이라 그대로 두고, 보이는 이름만 바꿈
const STATUS = [
  { key: 'new',       label: '예약 대기', color: '#FF1659', bg: '#FFF0F4' },
  { key: 'confirmed', label: '예약 확정', color: '#1565C0', bg: '#E8F1FB' },
  { key: 'canceled',  label: '상담 취소', color: '#888888', bg: '#F0F0F0' },
  { key: 'done',      label: '상담 완료', color: '#2E7D32', bg: '#E8F5E9' },
];

const CHANNELS = ['홈페이지', '전화', '방문', '인스타그램', '지인 소개'];

const STUDENT_TYPE_LABEL: Record<string, string> = {
  middle: '중학생', high: '고등학생', ged: '검정고시', retake: 'N수생', etc: '기타',
};
const PURPOSES = [
  { key: 'highschool', label: '고등학교 입시' },
  { key: 'university', label: '대학교 입시' },
  { key: 'hobby',      label: '취미' },
];
const STUDENT_TYPES = [
  { key: 'middle', label: '중학생' },
  { key: 'high',   label: '고등학생' },
  { key: 'ged',    label: '검정고시' },
  { key: 'retake', label: 'N수생' },
  { key: 'etc',    label: '기타' },
];
const AGE_OPTIONS = Array.from({ length: 21 }, (_, i) => ({ key: String(i + 10), label: `${i + 10}세` }));

const PURPOSE_LABEL: Record<string, string> = {
  highschool: '고등학교 입시', university: '대학교 입시', hobby: '취미',
};

function statusOf(key: string) {
  return STATUS.find((s) => s.key === key) ?? STATUS[0];
}

function visitorLabel(r: Reservation): string {
  return r.visitor_type === 'enrolled' ? '재원생' : '신규생';
}

function studentInfo(r: Reservation): string {
  const type = r.student_type ? STUDENT_TYPE_LABEL[r.student_type] ?? r.student_type : '';
  const detail = r.grade ? `${r.grade}학년` : r.age ? `${r.age}세` : '';
  return [type, detail].filter(Boolean).join(' ') || '-';
}

function guardianInfo(r: Reservation): string {
  if (r.guardian !== 'with') return r.guardian === 'alone' ? '혼자 방문' : '-';
  const name = [r.guardian_name, r.guardian_relation && `(${r.guardian_relation})`].filter(Boolean).join(' ');
  return ['보호자 동반', name, r.guardian_phone].filter(Boolean).join(' · ');
}

function modeLabel(r: Reservation): string {
  if (!r.mode) return '-';
  return r.mode === 'fine' ? '회화' : '만화·애니';
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function toInputValue(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SystemReservations() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<number | null>(null);
  const [staff, setStaff] = useState<{ label: string }[]>([]);

  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState('');
  const [msgSaving, setMsgSaving] = useState(false);
  const [msgSaved, setMsgSaved] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchMessage();
    fetchStaff();
  }, []);

  // 담당 강사 후보 (원장 · 전임 · 준전임)
  async function fetchStaff() {
    const { data, error } = await supabase.rpc('consult_staff');
    if (error || !data) return;
    setStaff((data as { name: string; role: string }[]).map((s) => ({
      label: `${s.name}-${s.role}`,
    })));
  }

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('consult_reservations')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      alert('불러오기 실패: ' + error.message);
      return;
    }
    setItems(data ?? []);
  }

  // 방문자가 신청을 마쳤을 때 보이는 팝업 문구
  async function fetchMessage() {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'consult_submit_message')
      .maybeSingle();
    setMessage(data?.value ?? '');
  }

  async function saveMessage() {
    setMsgSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'consult_submit_message', value: message }, { onConflict: 'key' });
    setMsgSaving(false);
    if (error) {
      alert('저장 실패: ' + error.message);
      return;
    }
    setMsgSaved(true);
    setTimeout(() => setMsgSaved(false), 2000);
  }

  async function updateItem(item: Reservation, values: Partial<Reservation>) {
    const { error } = await supabase.from('consult_reservations').update(values).eq('id', item.id);
    if (error) alert('저장 실패: ' + error.message);
    fetchItems();
  }

  async function handleDelete(item: Reservation) {
    const typed = prompt(
      `⚠️ 상담 예약을 삭제합니다.\n\n` +
      `이름: ${item.student_name}\n연락처: ${item.phone ?? '-'}\n신청일: ${formatDateTime(item.created_at)}\n\n` +
      `되돌릴 수 없어요. 취소된 건이면 삭제 대신 상태를 '취소'로 바꾸는 걸 권해요.\n\n` +
      `정말 삭제하려면 이름을 그대로 입력해주세요: ${item.student_name}`,
      '',
    );
    if (typed === null) return;
    if (typed.trim() !== item.student_name) {
      alert('이름이 달라서 삭제하지 않았어요.');
      return;
    }
    const { error } = await supabase.from('consult_reservations').delete().eq('id', item.id);
    if (error) alert('삭제 실패: ' + error.message);
    fetchItems();
  }

  // 엑셀에서 열 수 있는 CSV 로 내려받기 (백업 겸 보고용)
  function handleExport() {
    const header = ['신청일', '구분', '이름', '연락처', '학생구분', '목적', '분야', '보호자', '관계', '보호자 연락처', '희망일시', '경로', '상태', '담당', '문의내용'];
    const rows = filtered.map((r) => [
      formatDateTime(r.created_at),
      visitorLabel(r),
      r.student_name,
      r.phone ?? '',
      studentInfo(r),
      r.purpose ? PURPOSE_LABEL[r.purpose] ?? r.purpose : '',
      r.mode ? modeLabel(r) : '',
      r.guardian === 'with' ? `동반 ${r.guardian_name ?? ''}`.trim() : r.guardian === 'alone' ? '혼자' : '',
      r.guardian_relation ?? '',
      r.guardian_phone ?? '',
      formatDateTime(r.preferred_at),
      r.channel ?? '',
      statusOf(r.status).label,
      r.assigned_to ?? '',
      (r.memo ?? '').replace(/\r?\n/g, ' '),
    ]);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((line) => line.map((v) => escape(String(v))).join(',')).join('\r\n');
    // 엑셀에서 한글이 깨지지 않도록 BOM 추가
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `상담예약_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const counts = STATUS.map((s) => ({ ...s, n: items.filter((i) => i.status === s.key).length }));

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#1A1A1A',
    outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box',
  };
  const btnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
  };
  const fieldLabel: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888',
    display: 'block', marginBottom: '4px',
  };
  const fieldValue: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#1A1A1A', fontWeight: 500,
  };

  // 상담 중에 바로 고칠 수 있도록 모든 항목을 입력칸으로 제공
  // 글자 칸 (고치고 다른 곳을 누르면 저장)
  const editText = (
    label: string,
    value: string,
    onSave: (v: string | null) => void,
    placeholder?: string,
    required = false,
  ) => {
    const missing = required && !value;
    return (
      <div>
        <span style={missing ? { ...fieldLabel, color: '#FF1659', fontWeight: 700 } : fieldLabel}>
          {label}{missing && ' · 비어 있음'}
        </span>
        <input
          key={value}
          defaultValue={value}
          placeholder={missing ? '입력이 필요해요' : placeholder}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== value) onSave(v || null);
          }}
          style={{
            ...inputStyle, width: '100%',
            border: missing ? '1px solid #FF1659' : '1px solid #E0E0E0',
            backgroundColor: missing ? '#FFF0F4' : '#ffffff',
          }}
        />
      </div>
    );
  };

  // 고르는 칸 (고르는 즉시 저장)
  const editSelect = (
    label: string,
    value: string,
    options: { key: string; label: string }[],
    onSave: (v: string) => void,
    allowEmpty = false,
    required = false,
  ) => {
    // 상담 종류를 바꾸면 해당 없던 항목이 비어 있게 됨 → 빨갛게 표시해서 바로 알아채도록
    const missing = required && !value;
    return (
      <div>
        <span style={missing ? { ...fieldLabel, color: '#FF1659', fontWeight: 700 } : fieldLabel}>
          {label}{missing && ' · 비어 있음'}
        </span>
        <select
          value={value}
          onChange={(e) => onSave(e.target.value)}
          style={{
            ...inputStyle, width: '100%', cursor: 'pointer',
            border: missing ? '1px solid #FF1659' : '1px solid #E0E0E0',
            backgroundColor: missing ? '#FFF0F4' : '#ffffff',
            color: missing ? '#FF1659' : '#1A1A1A',
          }}
        >
          {allowEmpty && <option value="">{missing ? '선택해주세요' : '-'}</option>}
          {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>
    );
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
            상담예약 관리
          </h2>
          <button
            onClick={() => setShowSettings((v) => !v)}
            title="신청 완료 문구 설정"
            aria-label="설정"
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid ' + (showSettings ? '#FF1659' : '#E0E0E0'),
              backgroundColor: showSettings ? '#FFF0F4' : '#ffffff',
              cursor: 'pointer', fontSize: '15px', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ⚙
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}>
            엑셀로 내보내기
          </button>
          <button
            onClick={() => window.open('/consult', '_blank', 'noopener')}
            title="방문자에게 보이는 상담 신청 양식을 새 창에서 엽니다"
            style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}
          >
            상담 신청 폼 보기
          </button>
        </div>
      </div>

      {/* 설정 — 신청 완료 팝업 문구 */}
      {showSettings && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
            신청 완료 팝업 문구
          </p>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.6 }}>
            방문자가 상담 신청하기를 누르면 이 문구가 팝업으로 나와요. 줄바꿈도 그대로 보여요.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={saveMessage}
              disabled={msgSaving}
              style={{ ...btnStyle, backgroundColor: msgSaved ? '#4CAF50' : '#FF1659', color: '#ffffff', opacity: msgSaving ? 0.7 : 1 }}
            >
              {msgSaving ? '저장 중...' : msgSaved ? '저장 완료 ✓' : '저장'}
            </button>
            <button
              onClick={() => window.open('/consult', '_blank', 'noopener')}
              style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0' }}
            >
              폼에서 확인
            </button>
          </div>
        </div>
      )}

      {/* 상태별 개수 + 필터 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...btnStyle, fontSize: '12px', padding: '6px 14px',
            backgroundColor: filter === 'all' ? '#333333' : '#ffffff',
            color: filter === 'all' ? '#ffffff' : '#555',
            border: '1px solid ' + (filter === 'all' ? '#333333' : '#E0E0E0'),
          }}
        >
          전체 {items.length}
        </button>
        {counts.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            style={{
              ...btnStyle, fontSize: '12px', padding: '6px 14px',
              backgroundColor: filter === s.key ? s.color : '#ffffff',
              color: filter === s.key ? '#ffffff' : '#555',
              border: '1px solid ' + (filter === s.key ? s.color : '#E0E0E0'),
            }}
          >
            {s.label} {s.n}
          </button>
        ))}
      </div>

      {/* 목록 — 한 줄 요약, 누르면 펼쳐짐 */}
      {loading && (
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', padding: '20px' }}>불러오는 중...</p>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#aaa' }}>
            {items.length === 0 ? '아직 등록된 상담 예약이 없어요' : '이 상태의 예약이 없어요'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((item) => {
          const s = statusOf(item.status);
          const open = openId === item.id;
          const enrolled = item.visitor_type === 'enrolled';
          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid ' + (open ? s.color : '#E0E0E0'),
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* 요약 줄 */}
              <button
                onClick={() => setOpenId(open ? null : item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px 18px', backgroundColor: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap',
                }}
              >
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: s.color, backgroundColor: s.bg, padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>
                  {item.student_name}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: enrolled ? '#2E7D32' : '#888', backgroundColor: enrolled ? '#E8F5E9' : '#F5F5F5', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {visitorLabel(item)}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555' }}>
                  {item.phone ?? '연락처 없음'}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888' }}>
                  희망 {formatDateTime(item.preferred_at)}
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa' }}>
                    {formatDateTime(item.created_at)} 신청
                  </span>
                  <span style={{ fontSize: '12px', color: '#888', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                </span>
              </button>

              {/* 펼친 내용 — 순서는 신청 폼과 동일 */}
              {open && (
                <div style={{ borderTop: '1px solid #F0F0F0', padding: '20px 18px', backgroundColor: '#FAFAFA' }}>
                  {/* 신청 내용 — 전화로 확인하면서 바로 고칠 수 있음 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {editSelect('상담 종류', item.visitor_type ?? 'new', [
                      { key: 'new', label: '신규 상담' },
                      { key: 'enrolled', label: '재원생 상담' },
                    ], (v) => updateItem(item, { visitor_type: v }))}

                    {editSelect(enrolled ? '반 구분' : '희망 분야', item.mode ?? 'ani', [
                      { key: 'ani', label: enrolled ? '애니반' : '만화·애니' },
                      { key: 'fine', label: enrolled ? '회화반' : '회화' },
                    ], (v) => updateItem(item, { mode: v }))}

                    {editText('이름', item.student_name, (v) => {
                      if (!v) return alert('이름은 비워둘 수 없어요.');
                      updateItem(item, { student_name: v });
                    })}

                    {editText('연락처', item.phone ?? '', (v) => updateItem(item, { phone: v }), '010-0000-0000', true)}

                  </div>

                  {/* 둘째 줄 — 학생 구분부터 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {!enrolled && editSelect('학생 구분', item.student_type ?? '', STUDENT_TYPES, (v) => {
                      // 구분을 바꾸면 학년/나이는 비움 (중·고는 학년, 나머지는 나이를 씀)
                      updateItem(item, { student_type: v || null, grade: null, age: null });
                    }, true, true)}

                    {!enrolled && (item.student_type === 'middle' || item.student_type === 'high') &&
                      editSelect('학년', item.grade ? String(item.grade) : '', [1, 2, 3].map((g) => ({ key: String(g), label: `${g}학년` })),
                        (v) => updateItem(item, { grade: v ? Number(v) : null }), true, true)}

                    {!enrolled && item.student_type && item.student_type !== 'middle' && item.student_type !== 'high' &&
                      editSelect('나이', item.age ? String(item.age) : '', AGE_OPTIONS,
                        (v) => updateItem(item, { age: v ? Number(v) : null }), true, true)}

                    {!enrolled && editSelect('상담 목적', item.purpose ?? '', PURPOSES,
                      (v) => updateItem(item, { purpose: v || null }), true, true)}

                  </div>

                  {/* 셋째 줄 — 보호자부터 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {editSelect('보호자 동반', item.guardian ?? '', [
                      { key: 'with', label: '보호자 동반' },
                      { key: 'alone', label: '혼자 방문' },
                    ], (v) => updateItem(item, { guardian: v || null }), true, true)}

                    {item.guardian === 'with' && editText('보호자 성함', item.guardian_name ?? '', (v) => updateItem(item, { guardian_name: v }), undefined, true)}
                    {item.guardian === 'with' && editSelect('관계', item.guardian_relation ?? '', ['모', '부', '기타'].map((r) => ({ key: r, label: r })),
                      (v) => updateItem(item, { guardian_relation: v || null }), true, true)}
                    {item.guardian === 'with' && editText('보호자 연락처', item.guardian_phone ?? '', (v) => updateItem(item, { guardian_phone: v }), '010-0000-0000', true)}
                  </div>

                  {/* 관리자가 고치는 항목 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={fieldLabel}>희망 상담 일시</span>
                      <input
                        type="datetime-local"
                        defaultValue={toInputValue(item.preferred_at)}
                        onBlur={(e) => {
                          const next = e.target.value ? new Date(e.target.value).toISOString() : null;
                          if (next !== item.preferred_at) updateItem(item, { preferred_at: next });
                        }}
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                    <div>
                      <span style={fieldLabel}>상태</span>
                      <select
                        value={item.status}
                        onChange={(e) => updateItem(item, { status: e.target.value })}
                        style={{ ...inputStyle, width: '100%', fontWeight: 700, color: s.color, backgroundColor: s.bg, border: 'none', cursor: 'pointer' }}
                      >
                        {STATUS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={fieldLabel}>담당 강사</span>
                      <select
                        value={item.assigned_to ?? ''}
                        onChange={(e) => updateItem(item, { assigned_to: e.target.value || null })}
                        style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                      >
                        <option value="">미지정</option>
                        {/* 관리자 관리에서 직책이 원장·전임·준전임인 사람만 나옴 */}
                        {staff.map((s) => (
                          <option key={s.label} value={s.label}>{s.label}</option>
                        ))}
                        {/* 예전에 지정했는데 지금 목록에 없는 이름도 그대로 보이도록 */}
                        {item.assigned_to && !staff.some((s) => s.label === item.assigned_to) && (
                          <option value={item.assigned_to}>{item.assigned_to}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <span style={fieldLabel}>신청 경로</span>
                      <input
                        list="channel-options"
                        defaultValue={item.channel ?? ''}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v !== item.channel) updateItem(item, { channel: v });
                        }}
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                  </div>

                  <span style={fieldLabel}>문의 내용 · 상담 메모</span>
                  <textarea
                    defaultValue={item.memo ?? ''}
                    rows={4}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || null;
                      if (v !== item.memo) updateItem(item, { memo: v });
                    }}
                    style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.7 }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>
                      칸을 고치고 다른 곳을 클릭하면 저장돼요.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* 상담 기록 기능을 만들 때 이 버튼에서 바로 기록이 생성되도록 연결 예정 */}
                      <button
                        onClick={() => alert('상담 기록 기능을 만들면, 이 버튼으로 이 예약이 상담 기록 맨 위에 자동으로 추가돼요.\n지금은 준비 중이에요.')}
                        style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#555', border: '1px solid #E0E0E0', fontSize: '12px', padding: '6px 14px' }}
                      >
                        상담 기록으로 넘기기 (준비 중)
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        style={{ ...btnStyle, backgroundColor: 'transparent', color: '#FF1659', border: '1px solid #FF1659', fontSize: '12px', padding: '6px 14px' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <datalist id="channel-options">
        {CHANNELS.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}
