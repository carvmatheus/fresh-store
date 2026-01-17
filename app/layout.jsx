import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Da Horta Distribuidor",
  description: "Fornecimento de produtos frescos para restaurantes, hotéis e mercados",
  icons: {
    icon: "/images/icone-tomate-dahorta.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} font-sans antialiased bg-gray-50`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
