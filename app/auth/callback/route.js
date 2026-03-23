import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/analyze'

  if (code) {
    // Create the redirect response first so we can set cookies directly on it
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return response

    const msg = encodeURIComponent(error.message || error.code || JSON.stringify(error))
    console.error('[auth/callback] exchangeCodeForSession failed:', JSON.stringify(error))
    return NextResponse.redirect(`${origin}/analyze?auth_error=true&err=${msg}`)
  }

  return NextResponse.redirect(`${origin}/analyze?auth_error=true&err=no_code`)
}
