export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'URLが必要です' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })

    if (!res.ok) {
      return Response.json({ error: `取得失敗: HTTP ${res.status}` }, { status: res.status })
    }

    const html = await res.text()

    // NHKの記事本文を抽出
    const bodyMatch = html.match(/<div class="content--detail-body">([\s\S]*?)<\/div>/)?.[1]
      ?? html.match(/<section class="content--body">([\s\S]*?)<\/section>/)?.[1]
      ?? html.match(/<div class="article-body">([\s\S]*?)<\/div>/)?.[1]

    if (!bodyMatch) {
      return Response.json({ error: '本文が見つかりませんでした', htmlLength: html.length })
    }

    // HTMLタグを除去してテキストだけ取り出す
    const text = bodyMatch.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    return Response.json({ success: true, text, length: text.length })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
