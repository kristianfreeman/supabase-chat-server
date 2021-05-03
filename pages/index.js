import Head from 'next/head'
import Auth from '../components/auth'
import Chat from '../components/chat'
import styles from '../styles/Home.module.css'

import { useEffect, useState } from 'react'

export default function Home({ currentUser, session, supabase }) {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!session)
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {loggedIn ? <Chat currentUser={currentUser} session={session} supabase={supabase} /> : <Auth supabase={supabase} />}
      </main>
    </div>
  )
}
