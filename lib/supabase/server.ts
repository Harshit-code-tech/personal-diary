import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type CookieStore = Awaited<ReturnType<typeof cookies>>

export const createClient = async () => {
  const cookieStore = await cookies()
  const cookieStorePromise = Promise.resolve(cookieStore) as Promise<CookieStore> & CookieStore

  // Provide a promise-like cookie store while keeping sync accessors available.
  cookieStorePromise.get = cookieStore.get.bind(cookieStore)
  cookieStorePromise.getAll = cookieStore.getAll.bind(cookieStore)
  cookieStorePromise.has = cookieStore.has.bind(cookieStore)

  return createServerComponentClient({
    cookies: () => cookieStorePromise,
  })
}
