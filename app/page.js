'use client'
import { useEffect, useState } from 'react'

const CATEGORY_COLORS = {
  '自然': { bg: '#E1F5EE', color: '#0F6E56' },
  '動物': { bg: '#FAEEDA', color: '#854F0B' },
  '人・地域': { bg: '#EEEDFE', color: '#534AB7' },
  '科学': { bg: '#E6F1FB', color: '#185FA5' },
  '文化': { bg: '#FAECE7', color: '#993C1D' },
  '食': { bg: '#EAF3DE', color: '#3B6D11' },
}

function ArticleCard({ article, onLike }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(article.likes || 0)
  const catStyle = CATEGORY_COLORS[article.category] || { bg: '#f0f0f0', color: '#555' }

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setCount(c => c + 1)
    try {
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id })
      })
    } catch (e) {}
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>{article.emoji}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 999,
          background: catStyle.bg,
          color: catStyle.color,
        }}>{article.category}</span>
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: '#1a1a1a' }}>
        {article.title}
      </h2>
      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
        {article.summary}
      </p>
      <button
        onClick={handleLike}
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 999,
          border: liked ? '1px solid #1D9E75' : '1px solid #ddd',
          background: liked ? '#E1F5EE' : '#fff',
          color: liked ? '#0F6E56' : '#888',
          fontSize: 13,
          cursor: liked ? 'default' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {liked ? '👍' : '👍'} いいね！ {count > 0 && <span style={{ fontWeight: 500 }}>{count}</span>}
      </button>
    </div>
  )
}

export default function Home() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('')
  const [activeCategory, setActiveCategory] = useState('すべて')

  const categories = ['すべて', '自然', '動物', '人・地域', '科学', '文化', '食']

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles)
        setUpdatedAt(data.updatedAt)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'すべて'
    ? articles
    : articles.filter(a => a.category === activeCategory)

  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8f5' }}>
      {/* ヘッダー */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ padding: '14px 0 10px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>何も起きないニュース</h1>
              <span style={{ fontSize: 12, color: '#888' }}>{dateStr}</span>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>今日も世界では、静かないいことが起きています。</p>
          </div>
          {/* カテゴリナビ */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 0', overflowX: 'auto' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 999,
                  border: activeCategory === cat ? '1px solid #1D9E75' : '1px solid #ddd',
                  background: activeCategory === cat ? '#E1F5EE' : '#fff',
                  color: activeCategory === cat ? '#0F6E56' : '#666',
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: activeCategory === cat ? 500 : 400,
                }}
              >{cat}</button>
            ))}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            <p style={{ fontSize: 16 }}>今日のニュースを集めています...</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>少しだけお待ちください</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              {filtered.length}件のニュース
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}>
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* フッター */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 16px',
        marginTop: 32,
        borderTop: '1px solid #e8e8e8',
        color: '#aaa',
        fontSize: 12,
      }}>
        <p>何も起きないニュース — 毎日更新</p>
        <p style={{ marginTop: 4 }}>劇的なことは何もありません。それでいいのです。</p>
      </footer>
    </div>
  )
}
