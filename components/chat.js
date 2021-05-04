import { useEffect, useRef, useState } from 'react'

import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

import styles from '../styles/Chat.module.css'

const Chat = ({ currentUser, session, supabase }) => {
  if (!currentUser) return null

  const [messages, setMessages] = useState([])
  const [editingUsername, setEditingUsername] = useState(false)
  const [users, setUsers] = useState({})
  const message = useRef("")
  const newUsername = useRef(currentUser.username)

  useEffect(async () => {
    const getMessages = async () => {
      const {
        data: initialMessages,
        error
      } = await supabase
        .from('message')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)


      setMessages(initialMessages)
    }

    await getMessages()

    const setupMessagesSubscription = async () => {
      await supabase
        .from('message')
        .on("INSERT", ({ new: newMessage }) => setMessages(prevMessages => [].concat(prevMessages, [newMessage])))
        .subscribe()
    }

    await setupMessagesSubscription()

    const setupUsersSubscription = async () => {
      await supabase
        .from('user')
        .on("UPDATE", ({ new: newUser }) => {
          setUsers(users => {
            if (users[newUser.id]) {
              return Object.assign({}, users, { [newUser.id]: newUser })
            } else {
              return users
            }
          })
        })
        .subscribe()
    }

    await setupUsersSubscription()
  }, [])

  const getUsersFromSupabase = async (users, userIds) => {
    const usersToGet = Array.from(userIds).filter(userId => !users[userId])
    if (Object.keys(users).length && !usersToGet.length) return users
    try {
      const { data } = await supabase
        .from('user')
        .select('id, username')
        .in('id', usersToGet)
      const newUsers = {}
      data.forEach(user => (newUsers[user.id] = user))
      return Object.assign({}, users, newUsers)
    } catch (err) {
      console.log(err)
      return users
    }
  }

  useEffect(async () => {
    async function getUsers() {
      const userIds = new Set(messages.map(message => message.user_id))
      const newUsers = await getUsersFromSupabase(users, userIds)
      setUsers(newUsers)
    }

    await getUsers()

    window.scrollTo(0, document.body.scrollHeight);
  }, [messages])

  const sendMessage = async evt => {
    evt.preventDefault()

    try {
      const content = message.current.value

      await supabase
        .from("message")
        .insert([
          { content, user_id: session.user.id }
        ])

      message.current.value = ""
    } catch (err) {
      console.log(err)
    }
  }

  const username = user_id => {
    const user = users[user_id]
    return user ? user.username : session.user.email.split("@")[0]
  }

  const setUsername = async evt => {
    evt.preventDefault()

    try {
      const username = newUsername.current.value

      await supabase
        .from("user")
        .insert([
          { ...currentUser, username }
        ], { upsert: true })

      newUsername.current.value = ""
      setEditingUsername(false)
    } catch (err) {
      console.log("Something went wrong")
    }
  }

  const signout = () => {
    supabase.auth.signOut()
    window.location.reload()
  }

  if (process.env.NEXT_PUBLIC_ENV == "development") {
    console.log({
      currentUser,
      messages,
      session,
      supabase,
      users
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Supabase Chat</h1>
          <p>
            Welcome, {currentUser.username ? currentUser.username : session.user.email}
          </p>
        </div>
        <div className={styles.settings}>
          {editingUsername ?
            <form onSubmit={setUsername}>
              <input type="text" required ref={newUsername} placeholder="New username" />
              <button type="submit">Set username</button>
            </form>
            : (
              <>
                <div>
                  <button onClick={() => setEditingUsername(true)}>Update username</button>
                </div>
                <div>
                  <button onClick={signout}>Log out</button>
                </div>
              </>
            )}
        </div>
      </div>

      <div className={styles.container}>
        {messages.map(message =>
          <div key={message.id} className={styles.messageContainer}>
            <span className={styles.user}>{username(message.user_id)}</span> - <span>{message.created_at}</span>
            <ReactMarkdown
              remarkPlugins={[gfm]}
              linkTarget={"_blank"}
              children={message.content}
            />
          </div>
        )}

      </div>
      <form className={styles.chat} onSubmit={sendMessage}>
        <input className={styles.messageInput} required type="text" placeholder="Write your message" ref={message} />
        <button className={styles.submit} type="submit">Send</button>
      </form>
    </>
  )
}

export default Chat