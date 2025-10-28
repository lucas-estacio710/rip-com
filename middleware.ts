import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 🚨 MIDDLEWARE TEMPORARIAMENTE DESABILITADO PARA RESOLVER COOKIES CORROMPIDOS
  // Permitir tudo passar sem verificação
  console.log('⚠️ MIDDLEWARE DESABILITADO - Permitindo acesso:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
