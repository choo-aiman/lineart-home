// AdminUsers 수정
// 이유: +- 버튼 호버 핑크 효과 + 입력 필드 텍스트 색상 진하게

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: number;
  code: string;
  name: string;
  level: number;
  permissions: string;
  is_active: boolean;
  last_login: string | null;
  failed_attempts: number;
  locked_until: string | null;
}

const PERMISSION_TABS = [
  { key: 'users',     label: '관리자' },
  { key: 'design',    label: '홈&소개 디자인' },
  { key: 'lessons',   label: '수업안내' },
  { key: 'gallery',   label: '갤러리' },
  { key: 'board',     label: '문의·게시판' },
  { key: 'blog',      label: '블로그' },
  { key: 'graduates', label: '합격자' },
];

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 5 * 60 * 1000) return '방금 전(5분내)';
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function AdminUsers({ currentAdmin }: { currentAdmin: AdminUser }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLevel, setNewLevel] = useState(2);
  const [saving, setSaving] = useState(false);

  const isSuper = currentAdmin.level === 1;

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('id');
    if (data) setUsers(data);
  }

  async function togglePermission(user: AdminUser, permKey: string) {
    if (!isSuper) return;
    if (user.level === 1) return;

    const current = user.permissions === 'all'
      ? PERMISSION_TABS.map((t) => t.key)
      : user.permissions?.split(',').map((p) => p.trim()).filter(Boolean) ?? [];

    const updated = current.includes(permKey)
      ? current.filter((p) => p !== permKey)
      : [...current, permKey];

    await supabase.from('admin_users').update({ permissions: updated.join(',') }).eq('id', user.id);
    fetchUsers();
  }

  async function toggleActive(user: AdminUser) {
    if (!isSuper) return;
    await supabase.from('admin_users').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchUsers();
  }

  async function handleAdd() {
    if (!newName.trim() || !newCode.trim()) return;
    setSaving(true);
    await supabase.from('admin_users').insert({
      name: newName.trim(),
      code: newCode.trim(),
      level: newLevel,
      permissions: '',
      is_active: true,
      failed_attempts: 0,
    });
    setNewName('');
    setNewCode('');
    setNewLevel(2);
    setShowAddForm(false);
    setSaving(false);
    fetchUsers();
  }

  async function handleDelete(user: AdminUser) {
    if (user.level === 1) {
      alert('슈퍼어드민은 삭제할 수 없어요.');
      return;
    }
    if (!confirm(`${user.name} 계정을 삭제할까요?`)) return;
    await supabase.from('admin_users').delete().eq('id', user.id);
    fetchUsers();
  }

  const thStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: '#444444',
    padding: '14px 16px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px',
    color: '#1A1A1A',
    padding: '14px 16px',
    borderBottom: '1px solid #F0F0F0',
    verticalAlign: 'middle',
  };

  const iconBtnStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    backgroundColor: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    color: '#1A1A1A',
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          관리자 관리
        </h2>
        {isSuper && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowAddForm(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF1659';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#FF1659';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#1A1A1A';
                e.currentTarget.style.borderColor = '#E0E0E0';
              }}
              style={iconBtnStyle}
            >
              +
            </button>
            <button
              onClick={() => {
                const target = users.find((u) => u.level !== 1);
                if (target) handleDelete(target);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF1659';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#FF1659';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#1A1A1A';
                e.currentTarget.style.borderColor = '#E0E0E0';
              }}
              style={iconBtnStyle}
            >
              −
            </button>
          </div>
        )}
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>이름</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 강사-홍길동"
              style={{
                padding: '8px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                width: '160px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>접속 코드</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="예: ani-hong-admin5"
              style={{
                padding: '8px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                width: '180px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>레벨</label>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            >
              <option value={2}>Lv.2 어드민</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{
              padding: '8px 20px',
              backgroundColor: '#FF1659',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '저장 중...' : '추가'}
          </button>
          <button
            onClick={() => setShowAddForm(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={thStyle}>이름</th>
              <th style={thStyle}>코드</th>
              <th style={thStyle}>레벨</th>
              <th style={thStyle}>권한(슈퍼어드민만 어드민에게 부여)</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>최근접속</th>
              {isSuper && <th style={thStyle}>삭제</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const perms = user.level === 1
                ? PERMISSION_TABS.map((t) => t.key)
                : user.permissions === 'all'
                  ? PERMISSION_TABS.map((t) => t.key)
                  : user.permissions?.split(',').map((p) => p.trim()).filter(Boolean) ?? [];

              return (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={{ ...tdStyle, color: '#888', fontSize: '12px' }}>{user.code}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 700,
                        color: user.level === 1 ? '#FF1659' : '#ffffff',
                        backgroundColor: user.level === 1 ? '#FFF0F4' : '#4CAF50',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.level === 1 ? 'Lv.1 슈퍼어드민' : 'Lv.2 어드민'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {PERMISSION_TABS.map((tab) => {
                        const hasPermission = perms.includes(tab.key);
                        const isClickable = isSuper && user.level !== 1;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => isClickable && togglePermission(user, tab.key)}
                            style={{
                              fontFamily: "'Pretendard', sans-serif",
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: hasPermission ? 'none' : '1px solid #E0E0E0',
                              backgroundColor: hasPermission ? '#FF1659' : 'transparent',
                              color: hasPermission ? '#ffffff' : '#aaa',
                              cursor: isClickable ? 'pointer' : 'default',
                              transition: 'all 0.15s',
                            }}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isSuper ? 'pointer' : 'default' }}
                      onClick={() => isSuper && toggleActive(user)}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: user.is_active ? '#4CAF50' : '#FF1659',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555' }}>
                        {user.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#888', fontSize: '12px' }}>
                    {formatLastLogin(user.last_login)}
                  </td>
                  {isSuper && (
                    <td style={tdStyle}>
                      {user.level !== 1 && (
                        <button
                          onClick={() => handleDelete(user)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            color: '#FF1659',
                            border: '1px solid #FF1659',
                            borderRadius: '6px',
                            fontFamily: "'Pretendard', sans-serif",
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}