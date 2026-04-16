export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
        messages: [
          {
            role: 'user',
            content: `今日の日付は${new Date().toLocaleDateString('ja-JP')}です。
世界や日本で起きた「穏やかないいこと」「静かな前進」「小さな幸せ」に関するニュースを8本、日本語で生成してください。

以下のルールを守ってください：
- 劇的な感動や大きな事件ではなく、日常の中のそっと嬉しいこと
- 「何も起きなかった」ような穏やかさが漂う内容
- カテゴリは「自然」「動物」「人・地域」「科学」「文化」「食」のどれか

必ずこのJSON形式のみで返してください（他のテキスト不要）:
[
  {
    "id": "1",
    "title": "記事タイトル（30文字以内）",
    "summary": "本文の要約（80文字以内）",
    "category": "カテゴリ名",
    "emoji": "絵文字1文字",
    "likes": 0
  }
]`
          }
        ]
      }),
      })

    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const articles = JSON.parse(clean)

    return Response.json({ articles, updatedAt: new Date().toISOString() })
  } catch (e) {
    // フォールバック記事
    return Response.json({
      articles: [
        { id: '1', title: '川沿いの桜が今年も静かに咲いた', summary: '誰に知らせるでもなく、今年も桜が咲きました。地元の人たちがお弁当を持って集まりました。', category: '自然', emoji: '🌸', likes: 12 },
        { id: '2', title: '保護猫カフェに今月も里親が見つかった', summary: '名古屋の保護猫カフェで、今月も3匹の猫が新しい家族のもとへ。スタッフは静かに喜んでいます。', category: '動物', emoji: '🐱', likes: 34 },
        { id: '3', title: '離島の図書館に本が1000冊届いた', summary: '全国からの寄付で、長崎の小さな島の図書館が充実しました。島の子どもたちが喜んでいます。', category: '人・地域', emoji: '📚', likes: 28 },
        { id: '4', title: '80歳の元教師が今日も畑を耕した', summary: '岩手の農村で、退職後も毎朝畑に出る元教師の話。「体が動く限り」と笑います。', category: '人・地域', emoji: '🌱', likes: 45 },
        { id: '5', title: '絶滅危惧種のトキが今年も巣立った', summary: '新潟でトキの巣立ちが確認されました。今年は4羽。保護活動が少しずつ実を結んでいます。', category: '自然', emoji: '🦢', likes: 19 },
        { id: '6', title: '商店街の豆腐屋が創業100年を迎えた', summary: '大阪の下町で100年続く豆腐屋。四代目の店主は「特別なことは何もない」と話します。', category: '食', emoji: '🫙', likes: 67 },
        { id: '7', title: '小学生が作った俳句が全国誌に載った', summary: '北海道の小学3年生が詠んだ「雪解けや 長靴の中 春のにおい」が入選しました。', category: '文化', emoji: '✍️', likes: 23 },
        { id: '8', title: 'ミツバチの個体数が回復傾向に', summary: '農林水産省の調査で、国内のミツバチが昨年比で微増していることがわかりました。', category: '科学', emoji: '🐝', likes: 15 },
      ],
      updatedAt: new Date().toISOString()
    })
  }
}
