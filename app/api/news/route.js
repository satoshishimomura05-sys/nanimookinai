export const dynamic = 'force-dynamic'

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const text = await res.text()
    return text
  } catch (e) {
    return null
  }
}

function parseRSS(xml) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const content = match[1]
    const title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || content.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = content.match(/<link>(.*?)<\/link>/)?.[1]
      || content.match(/<guid>(.*?)<\/guid>/)?.[1] || ''
    if (title) items.push({ title: title.trim(), link: link.trim() })
  }
  return items.slice(0, 30)
}

export async function GET() {
  try {
    const feeds = [
      'https://www3.nhk.or.jp/rss/news/cat0.xml',
      'https://www3.nhk.or.jp/rss/news/cat1.xml',
      'https://www3.nhk.or.jp/rss/news/cat3.xml',
      'https://www3.nhk.or.jp/rss/news/cat5.xml',
    ]

    const allItems = []
    for (const feed of feeds) {
      const xml = await fetchRSS(feed)
      if (xml) {
        const items = parseRSS(xml)
        allItems.push(...items)
      }
    }

    if (allItems.length === 0) throw new Error('No RSS items')

    const newsText = allItems.slice(0, 30).map((item, i) =>
      `${i + 1}. タイトル:${item.title} URL:${item.link}`
    ).join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `以下は今日の実際のニュース一覧です。この中から「穏やかないいこと」「静かな前進」「暗くない話題」に該当するものを最大8本選んでください。

選定基準：
- 災害・事故・犯罪・政治対立・経済不安などネガティブなものは除外
- 科学的発見・自然・動物・地域の取り組み・文化・食・人の温かい話などを優先
- 「何も起きなかった」ような穏やかさがあるもの

ニュース一覧：
${newsText}

必ずこのJSON形式のみで返してください（他のテキスト不要）:
[
  {
    "id": "1",
    "title": "元のタイトルをそのまま使用",
    "summary": "内容を80文字以内で要約",
    "category": "自然/動物/人・地域/科学/文化/食 のどれか",
    "emoji": "絵文字1文字",
    "url": "元記事のURL",
    "likes": 0
  }
]`
        }]
      })
    })

    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const articles = JSON.parse(clean)

    return Response.json({ articles, updatedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Error:', e)
    return Response.json({
      articles: [
        { id: '1', title: 'ニュースを読み込んでいます', summary: '少し時間をおいてから再度アクセスしてください。', category: '自然', emoji: '🌿', url: '', likes: 0 },
      ],
      updatedAt: new Date().toISOString()
    })
  }
}
