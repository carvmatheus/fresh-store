/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Redirects para compatibilidade com rotas antigas (.html)
  // Transparente para usuários que ainda usam links antigos
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/login.html',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register.html',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/carrinho.html',
        destination: '/carrinho',
        permanent: true,
      },
      {
        source: '/cliente.html',
        destination: '/cliente',
        permanent: true,
      },
      {
        source: '/admin.html',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin-dashboard.html',
        destination: '/admin',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
