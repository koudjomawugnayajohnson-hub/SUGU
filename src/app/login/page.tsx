'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LogIn, Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients for modern SaaS feel */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-[100px]" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-100/60 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 rounded-3xl bg-white/90 p-10 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-700 shadow-lg shadow-gray-900/20">
            <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-gray-900">
            Espace Propriétaire
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Connectez-vous pour gérer votre SaaS. Seule l'authentification Google est autorisée.
          </p>
        </div>

        <div className="mt-10">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <LogIn className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-700" />
            )}
            {isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Accès restreint et sécurisé.
          </p>
        </div>
      </div>
    </div>
  )
}
