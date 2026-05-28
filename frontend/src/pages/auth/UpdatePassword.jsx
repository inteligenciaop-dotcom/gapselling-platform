import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../services/supabase'

export default function UpdatePassword() {

  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {

    async function initSession() {

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setMessage('Link inválido ou expirado. Solicite uma nova recuperação de senha.')
        setIsError(true)
        setReady(true)
        return
      }

      if (!data.session) {
        setMessage('Link inválido ou expirado. Solicite uma nova recuperação de senha.')
        setIsError(true)
      }

      setReady(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setIsError(false)
        setMessage('')
      }
    })

    initSession()

    return () => {
      subscription.unsubscribe()
    }

  }, [])

  async function handleUpdate(e) {
    e.preventDefault()

    setMessage('')
    setIsError(false)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
      setIsError(true)
      return
    }

    setMessage('Senha atualizada com sucesso! Redirecionando...')
    setIsError(false)

    setTimeout(() => {
      navigate('/')
    }, 2000)
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Validando link...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleUpdate}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        <h1 className="text-4xl font-bold text-center mb-8">
          Nova Senha
        </h1>

        {isError ? (
          <div className="space-y-5">
            <p className="text-center text-sm text-red-500">{message}</p>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold"
            >
              Solicitar novo link
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-14 px-4 rounded-xl border border-zinc-300"
            />

            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg"
            >
              Atualizar senha
            </button>

            {message && (
              <p className={`text-center text-sm ${isError ? 'text-red-500' : 'text-zinc-600'}`}>
                {message}
              </p>
            )}

          </div>
        )}

      </form>

    </div>
  )
}
