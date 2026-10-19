"use client"

import { Container } from "@/components/layout/container"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess("Check your email for the password reset link.")
    }
    setLoading(false)
  }

  return (
    <div className="py-24 bg-background min-h-[80vh] flex flex-col justify-center">
      <Container>
        <div className="max-w-md mx-auto w-full p-8 border border-border/50 rounded-lg bg-card shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold">Forgot Password</h1>
            <p className="text-foreground/60 text-sm mt-2">Enter your email to receive a reset link</p>
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
          
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                disabled={loading || !!success}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !!success}
              className="w-full bg-primary text-primary-foreground py-3 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
