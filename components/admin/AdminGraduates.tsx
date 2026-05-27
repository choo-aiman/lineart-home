// AdminGraduates 수정
// 이유: category 값 high/employ로 수정 + 고입/임용 탭 추가

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Mode = 'ani' | 'fine' | 'high' | 'employ';
type Category = 'ani' | 'fine' | 'high' | 'employ';

interface Graduate {
  id: number;
  year: number;
  mode: string;
  category: Category;
  student_name: string;
  university: string;
  department: string;
  order: number | null;
}

function maskName(name: string): string {
  const n = name.trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + 'O';
  if (n.length === 3) return n[0] + 'O' + n[2];
  return n[0] + 'O'.repeat(n.length - 2) + n[n.length - 1];
}

const categoryColors: Record<string, { bg: string; color: string }> = {
  ani:    { bg: '#FFF0F4', color: '#993556' },
  fine:   { bg: '#ECEEF5', color: '#3C3489' },
  high:   { bg: '#FFF8E1', color: '#854F0B' },
  employ: { bg: '#E8F5E9', color: '#27500A' },
};

const categoryLabels: Record<string, string> = {
  ani:    '만화·애니',
  fine:   '회화',
  high:   '고입',
  employ: '임용',
};

const TAB_LIST = [
  { key: 'ani',    label: '만화·애니', color: '#FF1659' },
  { key: 'fine',   label: '회화',      color: '#515883' },
  { key: 'high',   label: '고입',      color: '#F59E0B' },
  { key: 'employ', label: '임용',      color: '#4CAF50' },
] as const;

function DragHandle() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', justifyContent: 'center', padding: '4px 6px', cursor: 'grab' }}>
      {[0,1,2].map((i) => (
        <div key={i} style={{ width: '14px', height: '2px', backgroundColor: '#ccc', borderRadius: '2px' }} />
      ))}
    </div>
  );
}

function SortableRow({
  graduate, mainColor, saving, saved, onUpdate, onSave, onDelete,
}: {
  graduate: Graduate;
  mainColor: string;
  saving: number | null;
  saved: number | null;
  onUpdate: (id: number, field: keyof Graduate, value: string) => void;
  onSave: (g: Graduate) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: graduate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? '#F5F5F5' : '#ffffff',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', border: '1px solid #E0E0E0', borderRadius: '6px',
    fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#1A1A1A',
    outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff',
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px 8px', borderBottom: '1px solid #F0F0F0', verticalAlign: 'middle',
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ ...tdStyle, width: '36px', textAlign: 'center' }}>
        <div {...attributes} {...listeners}><DragHandle /></div>
      </td>
      <td style={tdStyle}>
        <input type="text" value={graduate.student_name} onChange={(e) => onUpdate(graduate.id, 'student_name', e.target.value)} style={inputStyle} />
      </td>
      <td style={tdStyle}>
        <input type="text" value={graduate.university} onChange={(e) => onUpdate(graduate.id, 'university', e.target.value)} style={inputStyle} />
      </td>
      <td style={tdStyle}>
        <input type="text" value={graduate.department} onChange={(e) => onUpdate(graduate.id, 'department', e.target.value)} style={inputStyle} />
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', width: '60px' }}>
        <button onClick={() => onSave(graduate)} disabled={saving === graduate.id}
          style={{ padding: '5px 10px', backgroundColor: saved === graduate.id ? '#4CAF50' : mainColor, color: '#ffffff', border: 'none', borderRadius: '6px', fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 700, cursor: saving === graduate.id ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s', whiteSpace: 'nowrap' }}>
          {saving === graduate.id ? '...' : saved === graduate.id ? '✓' : '저장'}
        </button>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', width: '50px' }}>
        <button onClick={() => onDelete(graduate.id)}
          style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#FF1659', border: '1px solid #FF1659', borderRadius: '6px', fontFamily: "'Pretendard', sans-serif", fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          삭제
        </button>
      </td>
    </tr>
  );
}

export default function AdminGraduates() {
  const [tab, setTab] = useState<Mode>('ani');
  const currentTab = TAB_LIST.find((t) => t.key === tab)!;
  const mainColor = currentTab.color;

  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);

  const [newName, setNewName] = useState('');
  const [newUniversity, setNewUniversity] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('ani');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchYears(); }, [tab]);
  useEffect(() => { fetchGraduates(); }, [tab, selectedYear]);

  async function fetchYears() {
    // 고입/임용은 category로 조회, 애니/회화는 mode로 조회
    let query = supabase.from('graduates').select('year');
    if (tab === 'high' || tab === 'employ') {
      query = query.eq('category', tab);
    } else {
      query = query.eq('mode', tab).in('category', ['ani', 'fine']);
    }
    const { data } = await query.order('year', { ascending: false });
    if (data) {
      const uniqueYears = [...new Set(data.map((r) => r.year))];
      setYears(uniqueYears);
      if (uniqueYears.length > 0) setSelectedYear(uniqueYears[0]);
    }
  }

  async function fetchGraduates() {
    setLoading(true);
    let query = supabase.from('graduates').select('*').eq('year', selectedYear);
    if (tab === 'high' || tab === 'employ') {
      query = query.eq('category', tab);
    } else {
      query = query.eq('mode', tab).in('category', ['ani', 'fine']);
    }
    const { data } = await query.order('category').order('id');
    if (data) setGraduates(data);
    setLoading(false);
  }

  function updateGraduate(id: number, field: keyof Graduate, value: string) {
    setGraduates((prev) => prev.map((g) => g.id === id ? { ...g, [field]: value } : g));
  }

  async function saveGraduate(g: Graduate) {
    setSaving(g.id);
    const { error } = await supabase.from('graduates').update({ student_name: g.student_name, university: g.university, department: g.department, category: g.category }).eq('id', g.id);
    if (error) alert('저장 실패: ' + error.message);
    setSaving(null); setSaved(g.id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function saveAll() {
    setSavingAll(true);
    for (let i = 0; i < graduates.length; i++) {
      const g = graduates[i];
      await supabase.from('graduates').update({ student_name: g.student_name, university: g.university, department: g.department, category: g.category, order: i + 1 }).eq('id', g.id);
    }
    setSavingAll(false); setSavedAll(true);
    setTimeout(() => setSavedAll(false), 2000);
  }

  async function addGraduate() {
    if (!newName.trim() || !newUniversity.trim() || !newDepartment.trim()) {
      alert('이름, 대학교, 학과를 모두 입력해주세요.');
      return;
    }
    setAdding(true);
    // mode 결정: 고입/임용은 ani로 기본 설정
    const insertMode = (newCategory === 'high' || newCategory === 'employ') ? 'ani' : newCategory;
    const { error } = await supabase.from('graduates').insert({
      mode: insertMode,
      year: newYear,
      category: newCategory,
      student_name: maskName(newName),
      university: newUniversity.trim(),
      department: newDepartment.trim(),
      order: graduates.length + 1,
    });
    if (error) { alert('추가 실패: ' + error.message); setAdding(false); return; }
    setNewName(''); setNewUniversity(''); setNewDepartment('');
    setAdding(false); setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    if (!years.includes(newYear)) setYears((prev) => [...prev, newYear].sort((a, b) => b - a));
    setSelectedYear(newYear);
    fetchGraduates();
  }

  async function deleteGraduate(id: number) {
    if (!confirm('이 합격자를 삭제할까요?')) return;
    await supabase.from('graduates').delete().eq('id', id);
    fetchGraduates();
  }

  async function handleDragEnd(event: DragEndEvent, category: string) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const catList = graduates.filter((g) => g.category === category);
    const oldIndex = catList.findIndex((g) => g.id === active.id);
    const newIndex = catList.findIndex((g) => g.id === over.id);
    const newCatList = arrayMove(catList, oldIndex, newIndex);
    const otherList = graduates.filter((g) => g.category !== category);
    setGraduates([...otherList, ...newCatList]);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #E0E0E0', borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#1A1A1A',
    outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600,
    color: '#888', marginBottom: '4px', display: 'block',
  };

  const sectionBox: React.CSSProperties = {
    backgroundColor: '#ffffff', border: '1px solid #E0E0E0',
    borderRadius: '12px', padding: '20px', marginBottom: '16px',
  };

  const thStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 700,
    color: '#888', padding: '8px 10px', backgroundColor: '#F5F5F5', textAlign: 'left' as const,
  };

  const grouped = graduates.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {} as Record<string, Graduate[]>);

  const visibleCategories = tab === 'high' ? ['high'] :
    tab === 'employ' ? ['employ'] :
    tab === 'ani' ? ['ani'] : ['fine'];

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>합격자 관리</h2>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
          {TAB_LIST.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: tab === t.key ? '#ffffff' : 'transparent', color: tab === t.key ? '#1A1A1A' : '#888', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 합격자 추가 */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>합격자 추가</h3>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          ⚠️ 이름을 실명으로 입력하면 자동으로 가운데 글자가 O으로 변환돼요. 예) 홍길동 → 홍O동 / 김지현아 → 김OO아
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 100px 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>연도</label>
            <input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} style={{ ...inputStyle, padding: '8px 6px' }} min={2000} max={2099} />
          </div>
          <div>
            <label style={labelStyle}>분류</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Category)} style={{ ...inputStyle, padding: '8px 6px' }}>
              <option value="ani">만화·애니</option>
              <option value="fine">회화</option>
              <option value="high">고입</option>
              <option value="employ">임용</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              학생 이름
              {newName && <span style={{ color: mainColor, marginLeft: '6px' }}>→ {maskName(newName)}</span>}
            </label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} placeholder="홍길동 (실명 입력)" />
          </div>
          <div>
            <label style={labelStyle}>대학교</label>
            <input type="text" value={newUniversity} onChange={(e) => setNewUniversity(e.target.value)} style={inputStyle} placeholder="홍익대학교" />
          </div>
          <div>
            <label style={labelStyle}>학과</label>
            <input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGraduate()} style={inputStyle} placeholder="만화애니메이션학과" />
          </div>
        </div>
        <button onClick={addGraduate} disabled={adding}
          style={{ padding: '10px 24px', backgroundColor: added ? '#4CAF50' : mainColor, color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }}>
          {adding ? '추가 중...' : added ? '추가 완료 ✓' : '합격자 추가'}
        </button>
      </div>

      {/* 합격자 목록 */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
              {selectedYear}년 합격자 목록
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 500, color: '#888', marginLeft: '8px' }}>총 {graduates.length}명</span>
            </h3>
            <button onClick={saveAll} disabled={savingAll}
              style={{ padding: '6px 16px', backgroundColor: savedAll ? '#4CAF50' : mainColor, color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, cursor: savingAll ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s', whiteSpace: 'nowrap' }}>
              {savingAll ? '저장 중...' : savedAll ? '저장 완료 ✓' : '전체 저장'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {years.map((y) => (
              <button key={y} onClick={() => setSelectedYear(y)}
                style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, backgroundColor: selectedYear === y ? mainColor : '#F5F5F5', color: selectedYear === y ? '#ffffff' : '#888', transition: 'all 0.15s' }}>
                {y}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px' }}>불러오는 중...</p>
        ) : graduates.length === 0 ? (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px' }}>{selectedYear}년 합격자가 없어요</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {visibleCategories.map((cat) => {
              const list = grouped[cat];
              if (!list || list.length === 0) return null;
              const catColor = categoryColors[cat];
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#F9F9F9', borderRadius: '8px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, backgroundColor: catColor.bg, color: catColor.color, padding: '3px 10px', borderRadius: '20px' }}>
                      {categoryLabels[cat]}
                    </span>
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>{list.length}명</span>
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa', marginLeft: '4px' }}>핸들을 드래그해서 순서 변경</span>
                  </div>
                  <div style={{ border: '1px solid #F0F0F0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: '36px' }}></th>
                          <th style={{ ...thStyle, width: '120px' }}>
                            학생 이름
                            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: '#aaa', fontWeight: 400, display: 'block' }}>실명 입력 시 가운데 O 변환</span>
                          </th>
                          <th style={thStyle}>대학교</th>
                          <th style={thStyle}>학과</th>
                          <th style={{ ...thStyle, width: '60px' }}>저장</th>
                          <th style={{ ...thStyle, width: '50px' }}>삭제</th>
                        </tr>
                      </thead>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, cat)}>
                        <SortableContext items={list.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                          <tbody>
                            {list.map((g) => (
                              <SortableRow key={g.id} graduate={g} mainColor={mainColor} saving={saving} saved={saved} onUpdate={updateGraduate} onSave={saveGraduate} onDelete={deleteGraduate} />
                            ))}
                          </tbody>
                        </SortableContext>
                      </DndContext>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}