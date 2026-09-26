// AdminUsers 수정
// 이유: 접속 코드 → 구글 이메일 등록 방식, 직책 추가, 관리자 관리는 슈퍼어드민 전용
// 실제 수정 권한은 Supabase 보안 규칙(슈퍼어드민만 admin_users 수정 가능)이 막습니다.

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CurrentAdmin } from '@/lib/useAdmin';

interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  level: number;
  permissions: string;
  is_active: boolean;
  last_login: string | null;
}

// 'users'(관리자 관리)는 슈퍼어드민 전용이라 부여 목록에서 뺌
const PERMISSION_TABS = [
  { key: 'design',    label: '디자인 편집' },
  { key: 'lessons',   label: '수업안내' },
  { key: 'gallery',   label: '갤러리' },
  { key: 'board',     label: '문의·게시판' },
  { key: 'blog',      label: '블로그' },
  { key: 'graduates', label: '합격자' },
  { key: 'system',    label: '통합 운영' },
];

const ROLE_OPTIONS = ['원장', '부원장', '전임', '준전임', '보조'];

// 직책 위계 순으로 정렬 (같은 직책이면 먼저 등록한 사람이 위)
const ROLE_ORDER = ['원장', '부원장', '전임', '준전임', '보조'];
function roleRank(role: string | null): number {
  const i = ROLE_ORDER.indexOf((role ?? '').trim());
  return i === -1 ? ROLE_ORDER.length : i; // 직책이 없거나 목록에 없으면 맨 아래
}
function byRole(a: AdminUser, b: AdminUser): number {
  return roleRank(a.role) - roleRank(b.role) || a.id - b.id;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 5 * 60 * 1000) return '방금 전(5분내)';
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function explainError(message: string): string {
  if (message.includes('admin_users_email_key') || message.includes('duplicate')) return '이미 등록된 구글 메일이에요.';
  return message;
}

export default function AdminUsers({ currentAdmin }: { currentAdmin: CurrentAdmin }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  const isSuper = currentAdmin.level === 1;

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('admin_users')
      .select('id, name, email, role, level, permissions, is_active, last_login')
      .order('id');
    if (data) setUsers([...data].sort(byRole));
  }

  async function updateUser(user: AdminUser, values: Partial<AdminUser>) {
    const { error } = await supabase.from('admin_users').update(values).eq('id', user.id);
    if (error) alert('저장 실패: ' + explainError(error.message));
    fetchUsers();
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

    await updateUser(user, { permissions: updated.join(',') });
  }

  async function toggleActive(user: AdminUser) {
    if (!isSuper) return;
    if (user.level === 1) return;
    await updateUser(user, { is_active: !user.is_active });
  }

  async function editEmail(user: AdminUser) {
    if (!isSuper || user.level === 1) return;
    const input = prompt(`${user.name} 님의 구글 메일`, user.email ?? '');
    if (input === null) return;
    const email = input.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      alert('메일 주소 형식이 올바르지 않아요.');
      return;
    }
    await updateUser(user, { email });
  }

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase();
    if (!newName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    // 구글 메일은 나중에 '메일 등록 필요'를 눌러 채워도 됨
    if (email && !EMAIL_PATTERN.test(email)) {
      alert('메일 주소 형식이 올바르지 않아요. (예: hong@gmail.com)');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('admin_users').insert({
      name: newName.trim(),
      email: email || null,
      role: newRole.trim() || null,
      level: 2,
      permissions: '',
      is_active: true,
    });
    setSaving(false);
    if (error) {
      alert('추가 실패: ' + explainError(error.message));
      return;
    }
    setNewName('');
    setNewEmail('');
    setNewRole('');
    setShowAddForm(false);
    fetchUsers();
  }

  async function handleDelete(user: AdminUser) {
    if (user.level === 1) {
      alert('슈퍼어드민은 삭제할 수 없어요.');
      return;
    }
    // 실수 방지: 누구를 지우는지 보여주고, 이름을 직접 입력해야 삭제됨
    const warning =
      `⚠️ 관리자 계정을 삭제합니다.\n\n` +
      `이름: ${user.name}\n` +
      `직책: ${user.role ?? '-'}\n` +
      `구글 메일: ${user.email ?? '(미등록)'}\n\n` +
      `삭제하면 이 사람은 관리자 화면에 들어올 수 없고, 권한 설정도 사라져요. 되돌릴 수 없어요.\n` +
      `잠시 못 들어오게만 하려면 취소하고 '상태' 스위치를 눌러 꺼두세요.\n\n` +
      `정말 삭제하려면 아래에 이름을 그대로 입력해주세요: ${user.name}`;
    const typed = prompt(warning, '');
    if (typed === null) return;
    if (typed.trim() !== user.name) {
      alert('이름이 달라서 삭제하지 않았어요.');
      return;
    }
    const { error } = await supabase.from('admin_users').delete().eq('id', user.id);
    if (error) alert('삭제 실패: ' + explainError(error.message));
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

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px',
    color: '#1A1A1A',
    outline: 'none',
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
              placeholder="예: 홍길동"
              style={{ ...inputStyle, width: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>구글 메일</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="예: hong@gmail.com"
              style={{ ...inputStyle, width: '220px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>직책</label>
            <input
              list="admin-role-options"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="선택 또는 입력"
              style={{ ...inputStyle, width: '140px' }}
            />
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

      <datalist id="admin-role-options">
        {ROLE_OPTIONS.map((r) => <option key={r} value={r} />)}
      </datalist>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
          <thead>
            <tr>
              <th style={thStyle}>이름</th>
              <th style={thStyle}>직책</th>
              <th style={thStyle}>구글 메일</th>
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
                  <td style={tdStyle}>
                    {isSuper ? (
                      <input
                        defaultValue={user.name}
                        placeholder="이름"
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (!name) {
                            e.target.value = user.name;
                            return;
                          }
                          if (name !== user.name) updateUser(user, { name });
                        }}
                        style={{ ...inputStyle, width: '100px', padding: '4px 8px', fontSize: '13px' }}
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isSuper ? (
                      <input
                        list="admin-role-options"
                        defaultValue={user.role ?? ''}
                        placeholder="직책"
                        onBlur={(e) => {
                          const role = e.target.value.trim() || null;
                          if (role !== (user.role ?? null)) updateUser(user, { role });
                        }}
                        style={{ ...inputStyle, width: '76px', padding: '4px 8px', fontSize: '12px' }}
                      />
                    ) : (
                      user.role ?? '-'
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>
                    {isSuper && user.level !== 1 ? (
                      <button
                        onClick={() => editEmail(user)}
                        style={{
                          fontFamily: "'Pretendard', sans-serif",
                          fontSize: '12px',
                          color: user.email ? '#555' : '#FF1659',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {user.email ?? '메일 등록 필요'}
                      </button>
                    ) : (
                      <span style={{ color: '#888' }}>{user.email ?? '-'}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {/* 자리를 아끼려고 동그라미 표시. 저장된 값(레벨 1·2)은 그대로임 */}
                    <span
                      title={user.level === 1 ? '슈퍼어드민' : '어드민'}
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: user.level === 1 ? '#FF1659' : '#4CAF50',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {user.level === 1 ? 'SA' : 'A'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {/* 3개씩 2줄로 고르게 배치 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '5px', minWidth: '330px' }}>
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
                              padding: '4px 4px',
                              borderRadius: '20px',
                              border: hasPermission ? '1px solid #FF1659' : '1px solid #E0E0E0',
                              backgroundColor: hasPermission ? '#FF1659' : 'transparent',
                              color: hasPermission ? '#ffffff' : '#aaa',
                              cursor: isClickable ? 'pointer' : 'default',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {/* 켜짐 = 활성(로그인 가능), 꺼짐 = 비활성 */}
                    <span
                      title={user.is_active ? '활성 (누르면 차단)' : '비활성 (누르면 허용)'}
                      onClick={() => toggleActive(user)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: '38px',
                        height: '22px',
                        borderRadius: '11px',
                        padding: '2px',
                        backgroundColor: user.is_active ? '#4CAF50' : '#D0D0D0',
                        cursor: isSuper && user.level !== 1 ? 'pointer' : 'default',
                        opacity: user.level === 1 ? 0.5 : 1,
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          transform: user.is_active ? 'translateX(16px)' : 'translateX(0)',
                          transition: 'transform 0.15s',
                        }}
                      />
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#888', fontSize: '12px' }}>
                    {formatLastLogin(user.last_login)}
                  </td>
                  {isSuper && (
                    <td style={tdStyle}>
                      {user.level !== 1 && (
                        <button
                          onClick={() => handleDelete(user)}
                          title="삭제"
                          aria-label={`${user.name} 삭제`}
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            backgroundColor: 'transparent',
                            color: '#FF1659',
                            border: '1px solid #FF1659',
                            borderRadius: '6px',
                            fontFamily: "'Pretendard', sans-serif",
                            fontSize: '13px',
                            lineHeight: 1,
                            cursor: 'pointer',
                          }}
                        >
                          ×
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
