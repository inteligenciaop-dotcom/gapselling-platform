import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

export default function UpdatePassword() {

  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleUpdate(e) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Senha atualizada com sucesso!')

    setTimeout(() => {
      navigate('/')
    }, 2000)
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

        <div className="space-y-5">

          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <button
            type="submit"
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg"
          >
            Atualizar senha
          </button>

          {message && (
            <p className="text-center text-sm text-zinc-600">
              {message}
            </p>
          )}

        </div>

      </form>

    </div>
  )
}