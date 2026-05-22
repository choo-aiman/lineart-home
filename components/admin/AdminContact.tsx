// AdminContact 컴포넌트 생성
// 이유: 문의·게시판 관리 — 문의글 확인/답변/삭제 + 상담카드 관리 + 안내문구 수정

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Post {
  id: number;
  created_at: string;
  mode: string;
  title: string;
  content: string;
  nickname: string;
  admin_reply: string | null;
  is_replied: boolean;
  is_secret: boolean;
}

interface ContactCard {
  id: number;
  order: number;
  title: string;
  content: string;
  button_label: string;
  button_url: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function AdminContact() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cards, setCards] = useState<ContactCard[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeId, setNoticeId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [savingReply, setSavingReply] = useState<number | null>(null);
  const [savedReply, setSavedReply] = useState<number | null>(null);
  const [savingNotice, setSavingNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [savingCard, setSavingCard] = useState<number | null>(null);
  const [savedCard, setSavedCard] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');

  useEffect(() => {
    fetchPosts();
    fetchCards();
    fetchNotice();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setPosts(data);
      const replies: Record<number, string> = {};
      data.forEach((p) => { replies[p.id] = p.admin_reply ?? ''; });
      setReplyText(replies);
    }
  }

  async function fetchCards() {
    const { data } = await supabase
      .from('contact_cards')
      .select('*')
      .order('order');
    if (data) setCards(data);
  }

  async function fetchNotice() {
    const { data } = await supabase
      .from('site_content')
      .select('id, value')
      .eq('mode', 'ani')
      .eq('section', 'contact')
      .eq('key', 'notice')
      .single();
    if (data) {
      setNotice(data.value);
      setNoticeId(data.id);
    }
  }

  async function saveReply(post: Post) {
    setSavingReply(post.id);
    const reply = replyText[post.id] ?? '';
    const { error } = await supabase
      .from('board_posts')
      .update({
        admin_reply: reply,
        is_replied: reply.trim().length > 0,
      })
      .eq('id', post.id);
    if (error) alert('저장 실패: ' + error.message);
    setSavingReply(null);
    setSavedReply(post.id);
    setTimeout(() => setSavedReply(null), 2000);
    fetchPosts();
  }

  async function deletePost(id: number) {
    if (!confirm('이 문의를 삭제할까요?')) return;
    await supabase.from('board_posts').delete().eq('id', id);
    fetchPosts();
  }

  async function saveNotice() {
    if (!noticeId) return;
    setSavingNotice(true);
    await supabase.from('site_content').update({ value: notice }).eq('id', noticeId);
    setSavingNotice(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }

  function updateCard(id: number, field: keyof ContactCard, value: string) {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }

  async function saveCard(card: ContactCard) {
    setSavingCard(card.id);
    const { error } = await supabase
      .from('contact_cards')
      .update({
        title: card.title,
        content: card.content,
        button_label: card.button_label,
        button_url: card.button_url,
        order: Number(card.order),
      })
      .eq('id', card.id);
    if (error) alert('저장 실패: ' + error.message);
    setSavingCard(null);
    setSavedCard(card.id);
    setTimeout(() => setSavedCard(null), 2000);
  }

  async function addCard() {
    const newOrder = cards.length + 1;
    const { data } = await supabase
      .from('contact_cards')
      .insert({ order: newOrder, title: '새 카드', content: '', button_label: '', button_url: '' })
      .select()
      .single();
    if (data) setCards((prev) => [...prev, data]);
  }

  async function deleteCard(id: number) {
    if (!confirm('이 카드를 삭제할까요?')) return;
    await supabase.from('contact_cards').delete().eq('id', id);
    fetchCards();
  }

  const filteredPosts = posts.filter((p) => {
    if (filter === 'pending') return !p.is_replied;
    if (filter === 'replied') return p.is_replied;
    return true;
  });

  const pendingCount = posts.filter((p) => !p.is_replied).length;

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

  return (
    <div>
      <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A', marginBottom: '24px' }}>
        문의·게시판 관리
      </h2>

      {/* ── 문의 게시판 ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
              문의 게시판
            </h3>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              총 {posts.length}개 ·
              <span style={{ color: '#FF1659', fontWeight: 700 }}> 미답변 {pendingCount}개</span>
            </p>
          </div>

          {/* 필터 */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
            {([['all', '전체'], ['pending', '미답변'], ['replied', '답변완료']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filter === key ? '#ffffff' : 'transparent',
                  color: filter === key ? '#1A1A1A' : '#888',
                  boxShadow: filter === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {label}
                {key === 'pending' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: '4px',
                    backgroundColor: '#FF1659',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredPosts.length === 0 && (
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px' }}>
              문의가 없어요
            </p>
          )}
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              style={{
                border: `1px solid ${post.is_replied ? '#E0E0E0' : '#FF1659'}`,
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              {/* 게시글 헤더 */}
              <div
                onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 70px 50px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: expandedId === post.id ? '#F5F5F5' : '#ffffff',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {post.is_secret && '🔒'}
                  {post.title}
                </span>
                <span
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: post.mode === 'ani' ? '#FF1659' : '#ffffff',
                    backgroundColor: post.mode === 'ani' ? '#FFF0F4' : '#515883',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    textAlign: 'center',
                  }}
                >
                  {post.mode === 'ani' ? '만화·애니' : '회화'}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                  {post.nickname}
                </span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                  {formatDate(post.created_at)}
                </span>
                <span
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: post.is_replied ? '#4CAF50' : '#FF1659',
                    backgroundColor: post.is_replied ? '#E8F5E9' : '#FFF0F4',
                    padding: '2px 6px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {post.is_replied ? '답변완료' : '미답변'}
                </span>
              </div>

              {/* 게시글 본문 + 답변 */}
              {expandedId === post.id && (
                <div style={{ padding: '16px', borderTop: '1px solid #F0F0F0', backgroundColor: '#FAFAFA' }}>
                  {/* 문의 내용 */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px' }}>문의 내용</p>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#333', lineHeight: 1.8, whiteSpace: 'pre-line', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                      {post.content}
                    </p>
                  </div>

                  {/* 답변 작성 */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', display: 'block' }}>
                      어드민 답변
                    </label>
                    <textarea
                      value={replyText[post.id] ?? ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="답변을 입력해주세요..."
                    />
                  </div>

                  {/* 저장 + 삭제 버튼 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        padding: '7px 14px',
                        backgroundColor: 'transparent',
                        color: '#FF1659',
                        border: '1px solid #FF1659',
                        borderRadius: '8px',
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => saveReply(post)}
                      disabled={savingReply === post.id}
                      style={{
                        padding: '7px 16px',
                        backgroundColor: savedReply === post.id ? '#4CAF50' : '#FF1659',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: savingReply === post.id ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s',
                      }}
                    >
                      {savingReply === post.id ? '저장 중...' : savedReply === post.id ? '저장 완료 ✓' : '답변 저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 상담 카드 관리 ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
            상담 카드 관리
          </h3>
          <button
            onClick={addCard}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF1659',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + 카드 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map((card) => (
            <div key={card.id} style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '16px' }}>
              {/* 제목 + 내용 한 줄 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '3px', display: 'block' }}>카드 제목</label>
                  <input type="text" value={card.title} onChange={(e) => updateCard(card.id, 'title', e.target.value)} style={inputStyle} placeholder="전화 문의" />
                </div>
                <div>
                  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '3px', display: 'block' }}>카드 내용</label>
                  <input type="text" value={card.content} onChange={(e) => updateCard(card.id, 'content', e.target.value)} style={inputStyle} placeholder="063-283-7771" />
                </div>
              </div>

              {/* 버튼 라벨 + URL 한 줄 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '3px', display: 'block' }}>버튼 라벨</label>
                  <input type="text" value={card.button_label} onChange={(e) => updateCard(card.id, 'button_label', e.target.value)} style={inputStyle} placeholder="상담 일정 잡기" />
                </div>
                <div>
                  <label style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '3px', display: 'block' }}>버튼 URL</label>
                  <input type="text" value={card.button_url} onChange={(e) => updateCard(card.id, 'button_url', e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>
              </div>

              {/* 저장 + 삭제 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => deleteCard(card.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#FF1659',
                    border: '1px solid #FF1659',
                    borderRadius: '8px',
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
                <button
                  onClick={() => saveCard(card)}
                  disabled={savingCard === card.id}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: savedCard === card.id ? '#4CAF50' : '#FF1659',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: savingCard === card.id ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                >
                  {savingCard === card.id ? '저장 중...' : savedCard === card.id ? '저장 완료 ✓' : '저장'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 안내문구 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
          게시판 안내문구
        </h3>
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="게시글 관련 안내문구를 입력해주세요"
        />
        <button
          onClick={saveNotice}
          disabled={savingNotice}
          style={{
            marginTop: '10px',
            padding: '10px 24px',
            backgroundColor: savedNotice ? '#4CAF50' : '#FF1659',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            cursor: savingNotice ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {savingNotice ? '저장 중...' : savedNotice ? '저장 완료 ✓' : '저장'}
        </button>
      </div>
    </div>
  );
}