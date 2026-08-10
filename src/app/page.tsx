import Link from 'next/link'
import {
  Store,
  ShieldCheck,
  LineChart,
  Monitor,
  PackageCheck,
  Users,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Menu,
  MessageCircle,
  Mail
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* 1. HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SUGU</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/login" 
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95"
            >
              Commencer gratuitement
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden bg-white pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Reprenez le contrôle <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">total de votre boutique.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Caisse, stocks, employés et comptabilité réunis dans une seule application. SUGU est le système de gestion conçu pour sécuriser vos revenus et accélérer la croissance de votre commerce.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="group flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
              >
                Démarrer l&apos;essai gratuit
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#demo" 
                className="flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all w-full sm:w-auto"
              >
                Voir la démo
              </a>
            </div>
          </div>
        </section>

        {/* 3. SECTION OBJECTIFS (Pourquoi choisir SUGU ?) */}
        <section className="bg-slate-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Pourquoi choisir SUGU ?</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Conçu pour la réalité du terrain.
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {/* Carte 1 */}
                <div className="flex flex-col bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <LineChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold leading-7 text-slate-900">Zéro fuite financière</h3>
                  <p className="mt-4 flex-auto text-base leading-7 text-slate-600">
                    Suivez chaque entrée et sortie d&apos;argent au franc près. Fini les écarts de caisse inexpliqués.
                  </p>
                </div>
                {/* Carte 2 */}
                <div className="flex flex-col bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold leading-7 text-slate-900">Sécurité absolue</h3>
                  <p className="mt-4 flex-auto text-base leading-7 text-slate-600">
                    Protégez vos opérations grâce aux codes PIN individuels. Vos employés encaissent, vous seul autorisez les exceptions.
                  </p>
                </div>
                {/* Carte 3 */}
                <div className="flex flex-col bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                    <Store className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold leading-7 text-slate-900">Vision claire</h3>
                  <p className="mt-4 flex-auto text-base leading-7 text-slate-600">
                    Prenez des décisions basées sur des chiffres réels avec un tableau de bord qui résume votre journée en un clin d&apos;œil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECTION FONCTIONNALITÉS */}
        <section id="features" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Fonctionnalités</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tout ce dont vous avez besoin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image/Mockup area (Placeholder visually) */}
              <div className="relative rounded-3xl bg-slate-100 p-8 ring-1 ring-slate-200 overflow-hidden h-[400px] flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-50 opacity-50"></div>
                 <Monitor className="h-32 w-32 text-indigo-300 relative z-10" />
                 <div className="absolute bottom-0 w-[80%] h-[70%] bg-white rounded-t-2xl shadow-2xl border-t border-x border-slate-200 translate-y-8">
                    {/* Fake UI */}
                    <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="h-8 bg-slate-100 rounded-lg w-1/3"></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-indigo-50 rounded-lg"></div>
                        <div className="h-20 bg-blue-50 rounded-lg"></div>
                        <div className="h-20 bg-slate-50 rounded-lg"></div>
                      </div>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Caisse Tactile Rapide</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">Encaissement fluide, impression de tickets professionnels et gestion des dérogations (prix libres, annulations).</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Gestion des Stocks Intelligente</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">Déduction automatique des ventes, alertes de rupture imminente, et contrôle granulaire par produit.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Gestion du Personnel (RBAC)</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">Comptes séparés pour gérants et caissiers, accès par code PIN sécurisé et traçabilité absolue de chaque action.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Rapports Financiers</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">Suivi du chiffre d&apos;affaires, calcul du panier moyen et gestion intégrée des dépenses (sorties de caisse).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION TARIFICATION */}
        <section id="pricing" className="bg-slate-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Tarification</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Des prix clairs et transparents
              </p>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8">
              {/* Plan Essentiel */}
              <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-slate-200 xl:p-10 hover:shadow-lg transition-shadow">
                <div>
                  <h3 className="text-lg font-semibold leading-8 text-slate-900">Plan Essentiel</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">Pour les petites boutiques qui démarrent.</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">15 000</span>
                    <span className="text-sm font-semibold leading-6 text-slate-600">FCFA / mois</span>
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> 1 Caisse</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> 1 Utilisateur</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Gestion des stocks</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Support par email</li>
                  </ul>
                </div>
                <a href="/login" className="mt-8 block rounded-full px-3 py-2.5 text-center text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:bg-indigo-50">
                  Sélectionner
                </a>
              </div>

              {/* Plan Pro (Mise en avant) */}
              <div className="flex flex-col justify-between rounded-3xl bg-slate-900 p-8 ring-1 ring-slate-900 xl:p-10 shadow-xl scale-105 relative transform-gpu">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                  Le plus populaire
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-8 text-white">Plan Pro</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-300">Pour les commerces en croissance.</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-white">30 000</span>
                    <span className="text-sm font-semibold leading-6 text-slate-300">FCFA / mois</span>
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-400" /> Caisses illimitées</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-400" /> Employés illimités (Système PIN)</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-400" /> Rapports financiers avancés</li>
                    <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-400" /> Support prioritaire 7j/7</li>
                  </ul>
                </div>
                <a href="/login" className="mt-8 block rounded-full bg-indigo-500 px-3 py-2.5 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all hover:shadow-md active:scale-95">
                  Démarrer avec Pro
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* 6. SECTION CONTACT */}
        <section id="contact" className="bg-white py-24 sm:py-32 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Contactez-nous</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Une question ? Besoin d&apos;aide ?
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                L&apos;équipe SUGU est à votre disposition pour vous accompagner dans la réussite de votre commerce.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
                <div className="flex flex-col items-center p-8 bg-slate-50 rounded-3xl w-full sm:w-72 shadow-sm ring-1 ring-slate-200 hover:-translate-y-1 transition-transform">
                  <div className="h-12 w-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] mb-4">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">WhatsApp</h3>
                  <a href="https://wa.me/22383362944" target="_blank" rel="noopener noreferrer" className="mt-2 text-indigo-600 font-semibold hover:underline">
                    +223 83 36 29 44
                  </a>
                </div>
                <div className="flex flex-col items-center p-8 bg-slate-50 rounded-3xl w-full sm:w-72 shadow-sm ring-1 ring-slate-200 hover:-translate-y-1 transition-transform">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Email</h3>
                  <a href="mailto:koudjomawugnayajohnson@gmail.com" className="mt-2 text-indigo-600 font-semibold hover:underline text-center break-all">
                    koudjomawugnayajohnson<br />@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 7. FOOTER */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">SUGU</span>
          </div>
          
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">CGU</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Mentions légales</a>
          </div>

          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SUGU. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}