export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rssRes = await fetch('https://www3.nhk.or.jp/rss/news/cat0.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, text/xml, */*',
      },
    })
    const status = rssRes.status
    const text = await rssRes.text()
    const itemCount = (text.match(/<item>/g) || []).length
const firstTitle = text.match(/<item>[\s\S]*?<title>(.*?)<\/title>/)?.[1] ?? null

    return Response.json({
      status,
      length: text.length,
      itemCount,
      firstTitle,
      preview: text.slice(0, 2000),
    })
  } catch (e) {
    return Response.json({ error: e.message })
  }
}
