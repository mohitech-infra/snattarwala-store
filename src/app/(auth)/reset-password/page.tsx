"use client"

import { Container } from "@/components/layout/container"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Verify that the user has a valid session before letting them reset
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setError(null)
      }
    })

    // Give Supabase client a moment to parse the URL hash before showing error
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError("Your reset link is invalid or has expired. Please request a new one.")
      }
    }, 1500)

    return () => {
      clearTimeout(timer)
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess("Your password has been updated successfully. Redirecting...")
      setTimeout(() => {
        router.push("/account")
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="py-24 bg-background min-h-[80vh] flex flex-col justify-center">
      <Container>
        <div className="max-w-md mx-auto w-full p-8 border border-border/50 rounded-lg bg-card shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold">Reset Password</h1>
            <p className="text-foreground/60 text-sm mt-2">Enter your new password below</p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm mb-6 border border-destructive/20 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 text-emerald-600 text-sm p-3 rounded-sm mb-6 border border-emerald-500/20 text-center">
              {success}
            </div>
          )}
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                disabled={loading || !!success || !!error?.includes("expired")}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                disabled={loading || !!success || !!error?.includes("expired")}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !!success || !!error?.includes("expired")}
              className="w-full bg-primary text-primary-foreground py-3 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm">
            <Link href="/login" className="text-foreground/60 hover:text-foreground hover:underline transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
