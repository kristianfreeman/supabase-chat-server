import { useRef, useState } from 'react'

const Auth = ({ supabase }) => {
  const [error, setError] = useState(null)
  const [sentEmail, setSentEmail] = useState(false)

  const emailRef = useRef(null)
  const signIn = async email => {
    const { error } = await supabase.auth.signIn({ email })
    error ? setError(error) : setSentEmail(true)
  }

  return sentEmail ? (
    <div>
      <span>Sent email to login. Check your email to continue.</span>
    </div>
  )
    : (
      <div>
        <input placeholder="Enter your email" type="text" ref={emailRef} />

        <button onClick={() => signIn(emailRef.current.value)}>
          Authorize
        </button>
      </div>
    )
}

export default Auth;