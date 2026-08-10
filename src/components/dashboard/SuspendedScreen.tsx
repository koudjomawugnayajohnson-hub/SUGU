'use client'

import { AlertTriangle, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SuspendedScreen() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Accès Suspendu</h1>
        <p className="text-gray-300 mb-8 leading-relaxed">
          Votre espace de travail a été suspendu ou votre période d'essai a expiré. Veuillez renouveler votre abonnement pour réactiver votre accès.
        </p>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
