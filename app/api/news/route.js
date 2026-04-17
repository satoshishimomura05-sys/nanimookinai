export const dynamic = 'force-dynamic'

const NHK_RSS_URL = 'https://www3.nhk.or.jp/rss/news/cat0.xml'

async function fetchNHKNews() {
  const res = await fetch(NHK_RSS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, text/xml, */*',
    },
  })
  const xml = await res.text()
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const item = match[1]
    const title = item.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]
      ?? item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? ''
    const desc = item.match(/<description>(.*?)<\/description>/)?.[1] ?? ''
    if (title) items.push({ title, link, desc })
  }
  return items
}

export async function GET() {
  try {
    const news = await fetchNHKNews()
    if (news.length === 0) {
      return Response.json({ error: 'RSSからニュースを取得できませんでした' }, { status: 500 })
    }

    const newsText = news.map((n, i) => `${i + 1}. ${n.title}`).join('\n')

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
        system: 'You are a JSON API. Return ONLY valid JSON array, no markdown, no explanation.',
        messages: [{
          role: 'user',
          content: `以下のニュース一覧から、穏やかでポジティブなものを最大8件選んでください。

${newsText}

以下のJSON配列のみ返してください：
[{"id":"1","title":"タイトル","summary":"80文字以内の要約","category":"自然","emoji":"🌸","url":"${news[0]?.link}","likes":0}]`
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
