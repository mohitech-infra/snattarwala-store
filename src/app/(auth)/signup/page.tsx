"use client"

import { Container } from "@/components/layout/container"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="py-24 bg-background min-h-[80vh] flex flex-col justify-center">
        <Container>
          <div className="max-w-md mx-auto w-full p-8 border border-border/50 rounded-lg bg-card shadow-sm text-center">
            <h1 className="font-heading text-3xl font-bold mb-4">Check your email</h1>
            <p className="text-foreground/70 mb-8">
              We've sent a confirmation link to <strong>{email}</strong>. Please verify your email to continue.
            </p>
            <Link 
              href="/login"
              className="w-full inline-block bg-primary text-primary-foreground py-3 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-24 bg-background min-h-[80vh] flex flex-col justify-center">
      <Container>
        <div className="max-w-md mx-auto w-full p-8 border border-border/50 rounded-lg bg-card shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold">Create Account</h1>
            <p className="text-foreground/60 text-sm mt-2">Join SN Attarwala for a premium experience</p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm mb-6 border border-destructive/20 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-900 border border-slate-200 py-3 font-medium flex items-center justify-center space-x-2 rounded-sm hover:bg-slate-50 transition-colors disabled:opacity-50 mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-foreground/50 font-medium">Or continue with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required 
                  className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required 
                  className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-foreground/70">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
