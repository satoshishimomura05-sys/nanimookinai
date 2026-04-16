const likes = {}

export async function POST(request) {
  const { articleId } = await request.json()
  likes[articleId] = (likes[articleId] || 0) + 1
  return Response.json({ likes: likes[articleId] })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get('articleId')
  return Response.json({ likes: likes[articleId] || 0 })
}
