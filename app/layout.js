// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ข้อมูลหุ้น ARM Holdings',
  description: 'แอปพลิเคชันแสดงราคาและค่า RSI ของหุ้น ARM Holdings',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${inter.className} bg-gray-100 min-h-screen`}>{children}</body>
    </html>
  )
}