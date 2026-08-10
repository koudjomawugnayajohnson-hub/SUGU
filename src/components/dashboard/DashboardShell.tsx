'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Settings, 
  Menu, 
  X,
  Bell,
  Search,
  LogOut,
  Users
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: Home },
  { name: 'Caisse', href: '/caisse', icon: ShoppingCart },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Équipe', href: '/dashboard/cashiers', icon: Users },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-950 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col lg:fixed lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            SUGU SaaS
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
          <nav className="flex-1 space-y-2 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="border-t border-gray-800 p-4">
          <button 
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-400" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col lg:pl-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="search" 
                placeholder="Rechercher (Ctrl+K)" 
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-600 transition-colors relative">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

              {/* Profile */}
              <div className="flex items-center gap-x-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-inner flex items-center justify-center text-white font-bold text-sm ring-2 ring-white cursor-pointer hover:opacity-90 transition-opacity">
                  S
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
