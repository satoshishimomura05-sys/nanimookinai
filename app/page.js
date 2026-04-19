'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('すべて')

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['すべて', '自然', '動物', '人・地域', '科学', '文化', 'スポーツ']
  const filtered = activeCategory === 'すべて'
    ? articles
    : articles.filter(a => a.category === activeCategory)

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#fff', minHeight: '100vh' }}>

      {/* ヘッダー */}
      <header style={{ borderBottom: '1px solid #e5e5e5', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>何も起きないニュース</span>
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <div style={{ background: '#f9f6f0', borderBottom: '1px solid #e5e5e5', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 15, color: '#666', margin: 0, fontStyle: 'italic' }}>
            今日も世界では、静かないいことが起きています。
          </p>
        </div>
      </div>

      {/* カテゴリ */}
      <div style={{ borderBottom: '1px solid #e5e5e5', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 20px', fontSize: 13, fontWeight: 500,
                color: activeCategory === cat ? '#1a1a1a' : '#888',
                borderBottom: activeCategory === cat ? '2px solid #1a1a1a' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* メイン */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontSize: 15 }}>
            ニュースを読み込んでいます...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontSize: 15 }}>
            該当するニュースがありません
          </div>
        ) : (
          <>
            {/* トップ記事（1件目） */}
            {filtered[0] && (
              
                href={filtered[0].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none', marginBottom: 48 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: filtered[0].image ? '1fr 1fr' : '1fr', gap: 40, alignItems: 'center' }}>
                  {filtered[0].image && (
                    <img
                      src={filtered[0].image}
                      alt={filtered[0].title}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4 }}
                    />
                  )}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                      {filtered[0].source || filtered[0].category}
                    </span>
                    <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
                      {filtered[0].title}
                    </h2>
                    <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, margin: 0, fontFamily: 'sans-serif' }}>
                      {filtered[0].summary}
                    </p>
                  </div>
                </div>
              </a>
            )}

            {/* 区切り線 */}
            {filtered.length > 1 && <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', marginBottom: 48 }} />}

            {/* 残りの記事グリッド */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 40 }}>
              {filtered.slice(1).map(article => (
                
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4, marginBottom: 16 }}
                    />
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                    {article.source || article.category}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, margin: '8px 0 10px', letterSpacing: '-0.3px' }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0, fontFamily: 'sans-serif' }}>
                    {article.summary}
                  </p>
                </a>
              ))}
            </div>
          </>
        )}
      </main>

      {/* フッター */}
      <footer style={{ borderTop: '1px solid #e5e5e5', padding: '32px 24px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>何も起きないニュース</span>
          <span style={{ fontSize: 12, color: '#999', fontFamily: 'sans-serif' }}>劇的なことは何もありません。それでいいのです。</span>
        </div>
      </footer>

    </div>
  )
}
