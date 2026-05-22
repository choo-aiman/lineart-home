// ContactSection 수정
// 이유: 문의 작성 시 애니/회화 분류 필수 선택 추가

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ContactCard {
  id: number;
  order: number;
  title: string;
  content: string;
  button_label: string;
  button_url: string;
}

interface Post {
  id: number;
  created_at: string;
  mode: string;
  title: string;
  content: string;
  nickname: string;
  password: string;
  admin_reply: string | null;
  is_replied: boolean;
  is_secret: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function ContactSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [cards, setCards] = useState<ContactCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState('게시글 올릴때 게재되면 임의 삭제가 불가능합니다.');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [checkPw, setCheckPw] = useState('');
  const [checkError, setCheckError] = useState('');

  const [newMode, setNewMode] = useState<'ani' | 'fine' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    fetchCards();
    fetchPosts();
    fetchNotice();
  }, []);

  async function fetchCards() {
    const { data } = await supabase
      .from('contact_cards')
      .select('*')
      .order('order');
    if (data) setCards(data);
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('board_posts')
      .select('id, created_at, mode, title, nickname, is_replied, admin_reply, content, password, is_secret')
      .order('created_at', { ascending: false });
    if (error) alert('불러오기 실패: ' + error.message);
    if (data) setPosts(data);
  }

  async function fetchNotice() {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('mode', 'ani')
      .eq('section', 'contact')
      .eq('key', 'notice')
      .single();
    if (data) setNotice(data.value);
  }

  async function submitPost() {
    if (!newMode) {
      alert('만화·애니 또는 회화를 선택해주세요.');
      return;
    }
    if (!newTitle.trim() || !newContent.trim() || !newNickname.trim() || !newPassword.trim()) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    if (newPassword.length !== 4 || isNaN(Number(newPassword))) {
      alert('비밀번호는 숫자 4자리로 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('board_posts').insert({
      mode: newMode,
      title: newTitle.trim(),
      content: newContent.trim(),
      nickname: newNickname.trim(),
      password: newPassword,
      is_replied: false,
      is_secret: newIsSecret,
    });
    if (error) {
      alert('등록 실패: ' + error.message);
      setSubmitting(false);
      return;
    }
    setNewMode(null);
    setNewTitle('');
    setNewContent('');
    setNewNickname('');
    setNewPassword('');
    setNewIsSecret(false);
    setShowForm(false);
    setSubmitting(false);
    setSubmitDone(true);
    setTimeout(() => setSubmitDone(false), 3000);
    fetchPosts();
  }

  function handleExpand(post: Post) {
    if (expandedId === post.id) {
      setExpandedId(null);
      setCheckingId(null);
      setCheckPw('');
      setCheckError('');
      return;
    }
    if (post.is_secret) {
      setCheckingId(post.id);
      setExpandedId(null);
      setCheckPw('');
      setCheckError('');
      return;
    }
    if (!post.admin_reply) {
      setCheckingId(post.id);
      setExpandedId(null);
      setCheckPw('');
      setCheckError('');
    } else {
      setExpandedId(post.id);
      setCheckingId(null);
    }
  }

  function handleCheckPw(post: Post) {
    if (checkPw === post.password) {
      setExpandedId(post.id);
      setCheckingId(null);
      setCheckPw('');
      setCheckError('');
    } else {
      setCheckError('비밀번호가 틀렸어요.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '14px',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <section id="문의" className="w-full bg-white">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 4vw 60px' }}>

        {/* ── 상담 문의 ── */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            상담 문의
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            빠른 답변은 <span style={{ textDecoration: 'underline' }}>전화 또는 상담 신청 페이지</span>로 문의해주세요 &nbsp;*애니·회화 공통
          </p>
        </div>

        {/* 상담 카드 */}
        {cards.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
              gap: '16px',
              marginBottom: '48px',
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                style={{
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  textAlign: 'center',
                  minHeight: '120px',
                }}
              >
                <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888' }}>
                  {card.title}
                </p>
                {card.content && (
                  <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(16px, 1.2vw, 22px)', fontWeight: 900, color: '#1A1A1A' }}>
                    {card.content}
                  </p>
                )}
                {card.button_label && card.button_url && (
                  <a
                    href={card.button_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 20px',
                      backgroundColor: 'transparent',
                      color: mainColor,
                      border: `1px solid ${mainColor}`,
                      borderRadius: '8px',
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {card.button_label} →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid #F0F0F0', marginBottom: '48px' }} />

        {/* ── 문의 게시판 ── */}
        <div>
          <div className="mb-4">
            <h2
              className="font-black text-[#1A1A1A] mb-2"
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
            >
              문의 게시판
            </h2>
            <p
              className="text-[#888]"
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
            >
              닉네임과 비밀번호만으로 글을 작성할 수 있어요 (회원가입 불필요)
            </p>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', marginTop: '8px' }}>
              총 <strong style={{ color: '#1A1A1A' }}>{posts.length}</strong> 개의 문의
            </p>
          </div>

          {/* 글쓰기 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: showForm ? 'transparent' : mainColor,
                color: showForm ? mainColor : '#ffffff',
                border: `1px solid ${mainColor}`,
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {showForm ? '취소' : '문의 작성하기'}
            </button>
          </div>

          {/* 글쓰기 폼 */}
          {showForm && (
            <div
              style={{
                border: `1px solid ${mainColor}`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                backgroundColor: isAni ? '#FFF0F4' : '#ECEEF5',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* ── 제목 ── */}
<div>
  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', display: 'block' }}>제목</label>
  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={inputStyle} placeholder="문의 제목을 입력해주세요" />
</div>

{/* ── 내용 ── */}
<div>
  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', display: 'block' }}>내용</label>
  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} placeholder="문의 내용을 입력해주세요" />
</div>

{/* ── 분류 + 닉네임 + 비번 + 비밀글 한 줄 ── */}
<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
  {/* 분류 선택 */}
  <div>
    <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', display: 'block' }}>
      분류 <span style={{ color: '#FF1659' }}>*필수</span>
    </label>
    <div style={{ display: 'flex', gap: '6px' }}>
      {(['ani', 'fine'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setNewMode(m)}
          style={{
            padding: '10px 14px',
            border: `2px solid ${newMode === m ? (m === 'ani' ? '#FF1659' : '#515883') : '#E0E0E0'}`,
            borderRadius: '8px',
            backgroundColor: newMode === m ? (m === 'ani' ? '#FFF0F4' : '#ECEEF5') : '#ffffff',
            color: newMode === m ? (m === 'ani' ? '#FF1659' : '#515883') : '#888',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {m === 'ani' ? '만화·애니' : '회화'}
        </button>
      ))}
    </div>
  </div>

  {/* 닉네임 */}
  <div>
    <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', display: 'block' }}>닉네임</label>
    <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} style={inputStyle} placeholder="닉네임" />
  </div>

  {/* 비밀번호 */}
  <div>
    <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', display: 'block' }}>비밀번호 (숫자 4자리)</label>
    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="1234" maxLength={4} />
  </div>

  {/* 비밀글 토글 */}
  <div>
    <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', display: 'block' }}>공개 여부</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
      <button
        type="button"
        onClick={() => setNewIsSecret(!newIsSecret)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: newIsSecret ? mainColor : '#E0E0E0',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: newIsSecret ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            transition: 'left 0.2s',
          }}
        />
      </button>
      <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {newIsSecret ? '🔒 비밀글' : '공개글'}
      </span>
    </div>
  </div>
</div>
                {/* 안내문구 */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FFF8E1',
                    borderRadius: '8px',
                    border: '1px solid #FFE082',
                  }}
                >
                  <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', margin: 0 }}>
                    ⚠️ {notice}
                  </p>
                </div>

                <button
                  onClick={submitPost}
                  disabled={submitting}
                  style={{
                    padding: '12px',
                    backgroundColor: mainColor,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? '등록 중...' : '문의 등록하기'}
                </button>
              </div>
            </div>
          )}

          {submitDone && (
            <div style={{ padding: '16px', backgroundColor: '#E8F5E9', borderRadius: '8px', marginBottom: '16px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#4CAF50', fontWeight: 600 }}>
              ✓ 문의가 등록되었어요! 빠른 시일 내에 답변드릴게요.
            </div>
          )}

          {/* 게시글 목록 */}
          <div style={{ border: '1px solid #E0E0E0', borderRadius: '12px', overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 80px',
                backgroundColor: '#F5F5F5',
                padding: '12px 20px',
                borderBottom: '1px solid #E0E0E0',
              }}
            >
              {['제목', '분류', '작성자', '날짜'].map((h) => (
                <span key={h} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#555' }}>{h}</span>
              ))}
            </div>

            {posts.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#aaa' }}>
                아직 문의가 없어요
              </div>
            )}

            {posts.map((post) => (
              <div key={post.id}>
                <div
                  onClick={() => handleExpand(post)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 120px 80px',
                    padding: '14px 20px',
                    borderBottom: '1px solid #F0F0F0',
                    cursor: 'pointer',
                    backgroundColor: expandedId === post.id ? (post.mode === 'ani' ? '#FFF0F4' : '#ECEEF5') : '#ffffff',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#1A1A1A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {post.is_secret && <span style={{ fontSize: '12px' }}>🔒</span>}
                    {post.is_replied && <span style={{ color: '#4CAF50' }}>✓</span>}
                    {post.is_secret ? '비밀글입니다' : post.title}
                  </span>
                  <span>
                    <span
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 700,
                        color: post.mode === 'ani' ? '#FF1659' : '#ffffff',
                        backgroundColor: post.mode === 'ani' ? '#FFF0F4' : '#515883',
                        padding: '3px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      {post.mode === 'ani' ? '만화·애니' : '회화'}
                    </span>
                  </span>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888' }}>
                    {post.nickname.length > 5 ? post.nickname.slice(0, 5) + '...' : post.nickname}
                  </span>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888' }}>
                    {formatDate(post.created_at)}
                  </span>
                </div>

                {checkingId === post.id && (
                  <div style={{ padding: '16px 20px', backgroundColor: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                      {post.is_secret ? '🔒 비밀글이에요. 비밀번호를 입력해주세요.' : '비밀번호를 입력하면 내용을 확인할 수 있어요'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        value={checkPw}
                        onChange={(e) => setCheckPw(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckPw(post)}
                        maxLength={4}
                        placeholder="숫자 4자리"
                        style={{ ...inputStyle, width: '160px' }}
                      />
                      <button
                        onClick={() => handleCheckPw(post)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: post.mode === 'ani' ? '#FF1659' : '#515883',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontFamily: "'Pretendard', sans-serif",
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        확인
                      </button>
                    </div>
                    {checkError && <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#FF1659', marginTop: '6px' }}>{checkError}</p>}
                  </div>
                )}

                {expandedId === post.id && (
                  <div style={{ padding: '20px', backgroundColor: post.mode === 'ani' ? '#FFF0F4' : '#ECEEF5', borderBottom: '1px solid #E0E0E0' }}>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#333', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: post.admin_reply ? '20px' : 0 }}>
                      {post.content}
                    </p>
                    {post.admin_reply && (
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          padding: '16px',
                          borderLeft: `4px solid ${post.mode === 'ani' ? '#FF1659' : '#515883'}`,
                        }}
                      >
                        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: post.mode === 'ani' ? '#FF1659' : '#515883', marginBottom: '8px' }}>
                          라인아트 답변
                        </p>
                        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#333', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                          {post.admin_reply}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}