"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

export function BannerHeader() {
  const router = useRouter()

  return (
    <div 
      className="w-full overflow-hidden cursor-pointer transition-opacity hover:opacity-95 relative z-10"
      style={{ background: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)' }}
      onClick={() => router.push('/')}
      title="Clique para voltar à home"
    >
      <picture>
        <source media="(max-width: 768px)" srcSet="/images/header_da_horta_mobile.png" />
        <Image
          src="/images/Header_da_horta.png"
          alt="Da Horta Distribuidor - Para seu restaurante, hotel ou mercado"
          width={1200}
          height={300}
          className="w-full h-auto max-h-[180px] md:max-h-[300px] object-contain object-center"
          priority
        />
      </picture>
    </div>
  )
}
