import './globals.css'

export const metadata = {
  title: '何も起きないニュース',
  description: '今日も世界では、静かないいことが起きています。',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
