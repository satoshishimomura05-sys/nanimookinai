export const dynamic = 'force-dynamic'
export const revalidate = 3600

const FEEDS = [
  { url: 'https://www3.nhk.or.jp/rss/news/cat7.xml', lang: 'ja', source: 'NHK' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat3.xml', lang: 'ja', source: 'NHK' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat4.xml', lang: 'ja', source: 'NHK' },
  { url: 'https://www.goodnewsnetwork.org/feed/', lang: 'en', source: 'Good News Network' },
  { url: 'https://www.positive.news/feed/', lang: 'en', source: 'Positive.News' },
  { url: 'https://www.thisiscolossal.com/feed/', lang: 'en', source: 'Colossal' },
  { url: 'https://www.dezeen.com/feed/', lang: 'en', source: 'Dezeen' },
  { url: 'https://bijutsutecho.com/rss', lang: 'ja', source: '美術手帖' },
]

async function fetchFeeds() {
  const items = []
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, text/xml, */*',
        },
      })
      const xml = await res.text()
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
      for (const match of itemMatches) {
        const item = match[1]
        const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? ''
        const link = item.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/)?.[1]
          ?? item.match(/<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/)?.[1] ?? ''
        const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]
          ?.replace(/<[^>]+>/g, '').trim().slice(0, 200) ?? ''
        const image =
          item.match(/<media:content[^>]*url="([^"]+)"[^>]*type="image[^"]*"/)?.[1]
          ?? item.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1]
          ?? item.match(/<media:content[^>]*url="([^"]+)"/)?.[1]
          ?? item.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/)?.[1]
          ?? item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image[^"]*"/)?.[1]
          ?? item.match(/<img[^>]*src="([^"]+)"/)?.[1]
          ?? ''
        if (title && link) items.push({ title, link, desc, image, source: feed.source, lang: feed.lang })
      }
    } catch (e) {
      console.error('Feed error:', feed.url, e.message)
    }
  }
  return items
}

export async function GET() {
  try {
    const allNews = await fetchFeeds()
    if (allNews.length === 0) {
      return Response.json({ error: 'ニュースを取得できませんでした' }, { status: 500 })
    }

    const jaNews = allNews.filter(n => n.lang === 'ja').slice(0, 20)
    const enNews = allNews.filter(n => n.lang === 'en').slice(0, 20)

    const jaText = jaNews.map((n, i) => `${i + 1}. [${n.source}] ${n.title}`).join('\n')
    const enText = enNews.map((n, i) => `${i + 1}. [${n.source}] ${n.title} | ${n.desc?.slice(0, 80)}`).join('\n')

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'You are a JSON API. Return ONLY a valid JSON array. No markdown, no explanation, no extra text before or after the array.',
        messages: [{
          role: 'user',
          content: `以下のニュースから穏やかでポジティブなものを合計20件選んでください。
日本語12件・英語8件を目安にしてください。
政治・事件・事故・災害・経済悪化・紛争は除外してください。
スポーツ・自然・動物・アート・デザイン・ファッション・科学・文化・地域の話題を優先してください。

【日本語ニュース】
${jaText}

【英語ニュース（日本語に翻訳して使用）】
${enText}

以下のJSON配列のみ返してください。urlとsourceは必ず元データから正確に使用してください：
[{"id":"1","title":"タイトル（英語は日本語訳）","summary":"100文字以内の要約","category":"アート","source":"Colossal","url":"記事のURL","image":"","likes":0}]`
        }],
      }),
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSONが見つかりませんでした: ' + text.slice(0, 100))
    const articles = JSON.parse(jsonMatch[0])

    const enriched = articles.map((a) => {
      const original = allNews.find(n => n.link === a.url)
        ?? allNews.find(n => a.title && n.title && n.title.slice(0, 8) === a.title.slice(0, 8))
      return {
        ...a,
        url: original?.link ?? a.url,
        image: original?.image ?? '',
      }
    })

    return Response.json({ articles: enriched })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
