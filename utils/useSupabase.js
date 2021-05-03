import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY,
)

const useSupabase = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [session, setSession] = useState(supabase.auth.session())

  supabase.auth.onAuthStateChange(async (_event, session) => {
    setSession(session)
  })

  useEffect(async () => {
    const getCurrentUser = async () => {
      if (session?.user.id) {
        const { data: currentUser } = await supabase.from('user').select('*').eq('id', session.user.id)

        if (currentUser.length) {
          const foundUser = currentUser[0]
          const sub = await supabase
            .from(`user:id=eq.${foundUser.id}`)
            .on('UPDATE', ({ new: newUser }) => {
              setCurrentUser(newUser)
            })
            .subscribe()
          return foundUser
        } else {
          return null
        }
      }

      return null
    }

    const newCurrentUser = await getCurrentUser()
    setCurrentUser(newCurrentUser)
  }, [session])

  return { currentUser, session, supabase }
}

export default useSupabase;