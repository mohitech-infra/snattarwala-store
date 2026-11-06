"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if the user is an admin or store manager
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        
      if (profile && (profile.role === 'admin' || profile.role === 'store_manager')) {
        router.push("/admin")
        router.refresh()
      } else {
        // Not authorized, sign out
        await supabase.auth.signOut()
        setError("You do not have administrative privileges.")
        setLoading(false)
      }
    }
  }

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div suppressHydrationWarning className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100 animate-pulse text-center">
          <div suppressHydrationWarning className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-xl mx-auto mb-4 text-2xl font-bold font-serif">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-2">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div suppressHydrationWarning className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div suppressHydrationWarning className="text-center mb-8">
          <div suppressHydrationWarning className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-xl mx-auto mb-4 text-2xl font-bold font-serif">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-2">Sign in to manage SN Attarwala</p>
        </div>

        {error && (
          <div suppressHydrationWarning className="bg-red-50 text-red-600 text-sm p-4 rounded-lg mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="admin@snattarwala.in"
              suppressHydrationWarning
              className="w-full border border-slate-200 bg-slate-50/50 p-3 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors" 
            />
          </div>
          
          <div suppressHydrationWarning>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="••••••••"
              suppressHydrationWarning
              className="w-full border border-slate-200 bg-slate-50/50 p-3 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3.5 font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>
        
        <div suppressHydrationWarning className="mt-8 text-center">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Back to Main Store
          </a>
        </div>
      </div>
    </div>
  )
}
