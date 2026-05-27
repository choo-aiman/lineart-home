// AdminGraduates 컴포넌트 생성
// 이유: 합격자 관리 — 연도별/모드별 합격자 추가/삭제

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';
type Category = 'ani' | 'fine' | '고입' | '임용';

interface Graduate {
  id: number;
  year: number;
  mode: Mode;
  category: Category;
  student_name: string;
  university: string;
  department: string;
}

export default function AdminGraduates() {
  const [mode, setMode] = useState<Mode>('ani');
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // 새 합격자 입력 상태
  const [newName, setNewName] = useState('');
  const [newUniversity, setNewUniversity] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('ani');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchYears();
  }, [mode]);

  useEffect(() => {
    fetchGraduates();
  }, [mode, selectedYear]);

  async function fetchYears() {
    const { data } = await supabase
      .from('graduates')
      .select('year')
      .eq('mode', mode)
      .order('year', { ascending: false });
    if (data) {
      const uniqueYears = [...new Set(data.map((r) => r.year))];
      setYears(uniqueYears);
      if (uniqueYears.length > 0) setSelectedYear(uniqueYears[0]);
    }
  }

  async function fetchGraduates() {
    setLoading(true);
    const { data } = await supabase
      .from('graduates')
      .select('*')
      .eq('mode', mode)
      .eq('year', selectedYear)
      .order('category');
    if (data) setGraduates(data);
    setLoading(false);
  }

  async function addGraduate() {
    if (!newName.trim() || !newUniversity.trim() || !newDepartment.trim()) {
      alert('이름, 대학교, 학과를 모두 입력해주세요.');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('graduates').insert({
      mode,
      year: newYear,
      category: newCategory,
      student_name: newName.trim(),
      university: newUniversity.trim(),
      department: newDepartment.trim(),
    });
    if (error) {
      alert('추가 실패: ' + error.message);
      setAdding(false);
      return;
    }
    setNewName('');
    setNewUniversity('');
    setNewDepartment('');
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // 연도 목록 갱신
    if (!years.includes(newYear)) {
      setYears((prev) => [...prev, newYear].sort((a, b) => b - a));
    }
    setSelectedYear(newYear);
    fetchGraduates();
  }

  async function deleteGraduate(id: number) {
    if (!confirm('이 합격자를 삭제할까요?')) return;
    await supabase.from('graduates').delete().eq('id', id);
    fetchGraduates();
  }

  const categoryColors: Record<string, { bg: string; color: string }> = {
    ani:  { bg: '#FFF0F4', color: '#FF1659' },
    fine: { bg: '#ECEEF5', color: '#515883' },
    '고입': { bg: '#FFF8E1', color: '#F59E0B' },
    '임용': { bg: '#E8F5E9', color: '#4CAF50' },
  };

  const categoryLabels: Record<string, string> = {
    ani: '만화·애니',
    fine: '회화',
    '고입': '고입',
    '임용': '임용',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    marginBottom: '4px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionBox: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  };

  // 카테고리별 그룹핑
  const grouped = graduates.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {} as Record<string, Graduate[]>);

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          합격자 관리
        </h2>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
          {(['ani', 'fine'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? '#1A1A1A' : '#888',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'ani' ? '만화·애니' : '회화'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 합격자 추가 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
          합격자 추가
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {/* 연도 */}
          <div>
            <label style={labelStyle}>연도</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(Number(e.target.value))}
              style={inputStyle}
              min={2000}
              max={2099}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label style={labelStyle}>분류</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Category)}
              style={inputStyle}
            >
              <option value="ani">만화·애니</option>
              <option value="fine">회화</option>
              <option value="고입">고입</option>
              <option value="임용">임용</option>
            </select>
          </div>

          {/* 이름 */}
          <div>
            <label style={labelStyle}>학생 이름</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={inputStyle}
              placeholder="홍OO"
            />
          </div>

          {/* 대학교 */}
          <div>
            <label style={labelStyle}>대학교</label>
            <input
              type="text"
              value={newUniversity}
              onChange={(e) => setNewUniversity(e.target.value)}
              style={inputStyle}
              placeholder="홍익대학교"
            />
          </div>

          {/* 학과 */}
          <div>
            <label style={labelStyle}>학과</label>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGraduate()}
              style={inputStyle}
              placeholder="만화애니메이션학과"
            />
          </div>
        </div>

        <button
          onClick={addGraduate}
          disabled={adding}
          style={{
            padding: '10px 24px',
            backgroundColor: added ? '#4CAF50' : mainColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            cursor: adding ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {adding ? '추가 중...' : added ? '추가 완료 ✓' : '합격자 추가'}
        </button>
      </div>

      {/* ── 연도별 합격자 목록 ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
            합격자 목록
          </h3>
          {/* 연도 선택 탭 */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: selectedYear === y ? mainColor : '#F5F5F5',
                  color: selectedYear === y ? '#ffffff' : '#888',
                  transition: 'all 0.15s',
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px' }}>
            불러오는 중...
          </p>
        ) : graduates.length === 0 ? (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px' }}>
            {selectedYear}년 합격자가 없어요
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(['ani', 'fine', '고입', '임용'] as Category[]).map((cat) => {
              const list = grouped[cat];
              if (!list || list.length === 0) return null;
              const catColor = categoryColors[cat];
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: catColor.bg,
                        color: catColor.color,
                        padding: '3px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      {categoryLabels[cat]}
                    </span>
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                      {list.length}명
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                    {list.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #F0F0F0',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>
                            {g.student_name}
                          </span>
                          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                            {g.university} {g.department}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteGraduate(g.id)}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: 'transparent',
                            color: '#FF1659',
                            border: '1px solid #FF1659',
                            borderRadius: '6px',
                            fontFamily: "'Pretendard', sans-serif",
                            fontSize: '11px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginLeft: '8px',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
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