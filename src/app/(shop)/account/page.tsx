"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AccountDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const first_name = formData.get("first_name")
    const last_name = formData.get("last_name")
    const phone = formData.get("phone")

    const { data, error } = await supabase.auth.updateUser({
      data: { first_name, last_name, phone }
    })

    if (error) {
      alert("Error updating profile: " + error.message)
    } else {
      setUser(data.user)
      setIsEditingProfile(false)
    }
    setSaving(false)
  }

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const address1 = formData.get("address1")
    const address2 = formData.get("address2")
    const area = formData.get("area")
    const city = formData.get("city")
    const state = formData.get("state")
    const pincode = formData.get("pincode")

    const { data, error } = await supabase.auth.updateUser({
      data: { address1, address2, area, city, state, pincode }
    })

    if (error) {
      alert("Error updating address: " + error.message)
    } else {
      setUser(data.user)
      setIsEditingAddress(false)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-secondary rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-secondary rounded"></div><div className="h-4 bg-secondary rounded w-5/6"></div></div></div></div>
  }

  if (!user) return null

  return (
    <div>
      <h2 className="text-xl font-heading font-semibold mb-6">Dashboard</h2>
      
      <div className="bg-secondary/30 p-6 rounded-lg border border-border/50 mb-8">
        <h3 className="font-medium text-lg mb-2">Welcome back, {user.user_metadata?.first_name || 'Guest'}</h3>
        <p className="text-foreground/70 text-sm">
          From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="border border-border/50 p-6 rounded-lg bg-card">
          <h3 className="font-medium mb-4 pb-2 border-b border-border/50 flex justify-between items-center">
            <span>Profile Information</span>
            {!isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className="text-xs text-accent hover:underline">Edit</button>
            )}
          </h3>
          
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">First Name</label>
                <input name="first_name" defaultValue={user.user_metadata?.first_name || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Last Name</label>
                <input name="last_name" defaultValue={user.user_metadata?.last_name || ''} className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone</label>
                <input name="phone" defaultValue={user.user_metadata?.phone || ''} className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-primary/90 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-1.5 border border-border text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-secondary">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-foreground/80">
              <p><strong>Name:</strong> {user.user_metadata?.first_name || '-'} {user.user_metadata?.last_name || ''}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.user_metadata?.phone || '-'}</p>
            </div>
          )}
        </div>
        
        {/* Address Card */}
        <div className="border border-border/50 p-6 rounded-lg bg-card">
          <h3 className="font-medium mb-4 pb-2 border-b border-border/50 flex justify-between items-center">
            <span>Default Address</span>
            {!isEditingAddress && (
              <button onClick={() => setIsEditingAddress(true)} className="text-xs text-accent hover:underline">Manage</button>
            )}
          </h3>

          {isEditingAddress ? (
            <form onSubmit={handleUpdateAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Address Line 1</label>
                <input name="address1" defaultValue={user.user_metadata?.address1 || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Apartment, suite, etc.</label>
                <input name="address2" defaultValue={user.user_metadata?.address2 || ''} className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Area</label>
                  <input name="area" defaultValue={user.user_metadata?.area || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input name="city" defaultValue={user.user_metadata?.city || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">State</label>
                  <input name="state" defaultValue={user.user_metadata?.state || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Pincode</label>
                  <input name="pincode" defaultValue={user.user_metadata?.pincode || ''} required className="w-full border border-border p-2 text-sm rounded-sm bg-background focus:border-accent outline-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-primary/90 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setIsEditingAddress(false)} className="px-4 py-1.5 border border-border text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-secondary">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-foreground/80">
              {user.user_metadata?.address1 ? (
                <>
                  <p>{user.user_metadata.address1}</p>
                  {user.user_metadata.address2 && <p>{user.user_metadata.address2}</p>}
                  <p>{user.user_metadata.area}, {user.user_metadata.city}</p>
                  <p>{user.user_metadata.state} - {user.user_metadata.pincode}</p>
                </>
              ) : (
                <p>You have not set a default shipping address yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
