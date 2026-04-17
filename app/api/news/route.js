export const dynamic = 'force-dynamic'

const RSS_FEEDS = [
  'https://www3.nhk.or.jp/rss/news/cat0.xml',   // 主要
  'https://www3.nhk.or.jp/rss/news/cat7.xml',   // 暮らし
  'https://www3.nhk.or.jp/rss/news/cat3.xml',   // 科学・文化
]

async function fetchAllNews() {
  const items = []
  for (const url of RSS_FEEDS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, text/xml, */*',
        },
      })
      const xml = await res.text()
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
      for (const match of itemMatches) {
        const item = match[1]
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
        const link = item.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/)?.[1]
          ?? item.match(/<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/)?.[1] ?? ''
        const desc = item.match(/<description>(.*?)<\/description>/)?.[1] ?? ''
        if (title && link) items.push({ title, link, desc })
      }
    } catch (e) {
      console.error('RSS fetch error:', url, e.message)
    }
  }
  return items
}

export async function GET() {
  try {
    const news = await fetchAllNews()
    if (news.length === 0) {
      return Response.json({ error: 'RSSからニュースを取得できませんでした' }, { status: 500 })
    }

    const newsText = news.map((n, i) => `${i + 1}. ${n.title} [URL:${n.link}]`).join('\n')

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'You are a JSON API. Return ONLY a valid JSON array. No markdown, no explanation, no extra text.',
        messages: [{
          role: 'user',
          content: `以下のニュース一覧から、穏やかで日常的なものを最大8件選んでください。
政治・事件・事故・災害・経済・国際紛争は除外してください。
自然・動物・地域の取り組み・科学・文化・スポーツの明るい話題を優先してください。

${newsText}

各ニュースのURLはそのまま使ってください。
以下のJSON配列のみ返してください（他のテキスト一切不要）：
[{"id":"1","title":"タイトル","summary":"80文字以内の要約","category":"自然","emoji":"🌸","url":"元のURL","likes":0}]`
        }],
      }),
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSONが見つかりませんでした: ' + text.slice(0, 100))
    const articles = JSON.parse(jsonMatch[0])

    return Response.json({ articles })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
