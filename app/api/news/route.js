export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // NHKのRSSを取得
    const rssUrl = 'https://www3.nhk.or.jp/rss/news/cat0.xml'
    const rssRes = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store'
    })

    if (!rssRes.ok) {
      throw new Error(`RSS fetch failed: ${rssRes.status}`)
    }

    const xml = await rssRes.text()
    
    // RSSをパース
    const items = []
    const regex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = regex.exec(xml)) !== null) {
      const item = match[1]
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/)
      const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<guid>(.*?)<\/guid>/)
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim()
        })
      }
    }

    if (items.length === 0) {
      throw new Error('No items found in RSS')
    }

    // Claudeでフィルタリング
    const newsText = items.slice(0, 20).map((item, i) =>
      `${i + 1}. ${item.title} | ${item.link}`
    ).join('\n')

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
         content: `Return ONLY a JSON array, no other text. Select up to 8 positive/calm news from this list and return as JSON:\n\n${newsText}\n\nJSON format:\n[{"id":"1","title":"タイトル","summary":"要約80文字以内","category":"自然","emoji":"🌸","url":"URL","likes":0}]`,
        }]
      })
    })

    const apiData = await apiRes.json()
    
    if (apiData.error) {
      throw new Error(`API error: ${apiData.error.message}`)
    }

    const text = apiData.content[0].text
const jsonStr = text.match(/\[[\s\S]*?\](?=\s*$)/)?.[0] || text.match(/\[[\s\S]*\]/)?.[0]
if (!jsonStr) throw new Error('No JSON found')
const articles = JSON.parse(jsonStr)

    return Response.json({ articles, updatedAt: new Date().toISOString() })

  } catch (e) {
    console.error('News API Error:', e.message)
    // エラー時はフォールバック記事を返す
    return Response.json({
      articles: [
        { id: '1', title: '川沿いの桜が今年も静かに咲いた', summary: '誰に知らせるでもなく、今年も桜が咲きました。地元の人たちがお弁当を持って集まりました。', category: '自然', emoji: '🌸', url: '', likes: 12 },
        { id: '2', title: '保護猫カフェに今月も里親が見つかった', summary: '名古屋の保護猫カフェで、今月も3匹の猫が新しい家族のもとへ。スタッフは静かに喜んでいます。', category: '動物', emoji: '🐱', url: '', likes: 34 },
        { id: '3', title: '離島の図書館に本が1000冊届いた', summary: '全国からの寄付で、長崎の小さな島の図書館が充実しました。島の子どもたちが喜んでいます。', category: '人・地域', emoji: '📚', url: '', likes: 28 },
        { id: '4', title: '80歳の元教師が今日も畑を耕した', summary: '岩手の農村で、退職後も毎朝畑に出る元教師の話。「体が動く限り」と笑います。', category: '人・地域', emoji: '🌱', url: '', likes: 45 },
        { id: '5', title: '絶滅危惧種のトキが今年も巣立った', summary: '新潟でトキの巣立ちが確認されました。今年は4羽。保護活動が少しずつ実を結んでいます。', category: '自然', emoji: '🦢', url: '', likes: 19 },
        { id: '6', title: '商店街の豆腐屋が創業100年を迎えた', summary: '大阪の下町で100年続く豆腐屋。四代目の店主は「特別なことは何もない」と話します。', category: '食', emoji: '🫙', url: '', likes: 67 },
        { id: '7', title: '小学生が作った俳句が全国誌に載った', summary: '北海道の小学3年生が詠んだ俳句が入選しました。', category: '文化', emoji: '✍️', url: '', likes: 23 },
        { id: '8', title: 'ミツバチの個体数が回復傾向に', summary: '農林水産省の調査で、国内のミツバチが昨年比で微増していることがわかりました。', category: '科学', emoji: '🐝', url: '', likes: 15 },
      ],
      updatedAt: new Date().toISOString(),
      error: e.message
    })
  }
}
