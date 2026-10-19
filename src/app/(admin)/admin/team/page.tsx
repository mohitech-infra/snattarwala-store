"use client"

import { useEffect, useState } from "react"
import { Shield, ShieldAlert, User, MoreVertical, RefreshCw, CheckCircle2 } from "lucide-react"
import { getAdminProfiles, updateProfileRole, AdminProfile } from "@/lib/admin-service"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminTeamPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/admin/login")
      return
    }

    // Get current user role
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (currentUserProfile) {
      setCurrentUserRole(currentUserProfile.role)
    }

    // Fetch all profiles
    const data = await getAdminProfiles()
    setProfiles(data)
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (currentUserRole !== 'admin') {
      setError("Only Super Admins can change user roles.")
      return
    }

    setUpdating(userId)
    setError(null)
    setSuccess(null)
    
    const successResult = await updateProfileRole(userId, newRole)
    if (successResult) {
      setSuccess("Role updated successfully!")
      // Update local state
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p))
    } else {
      setError("Failed to update role. Please try again.")
    }
    
    setUpdating(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  // Only Super Admins can see this page
  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md">You need Super Admin privileges to view and manage team members.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {profile.first_name || profile.last_name 
                            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                            : 'Unknown User'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{profile.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {profile.phone || 'No phone'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      profile.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : profile.role === 'store_manager'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {profile.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {profile.role === 'store_manager' && <User className="w-3 h-3 mr-1" />}
                      {profile.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      disabled={updating === profile.id}
                      value={profile.role}
                      onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                      className="border border-slate-200 bg-white rounded-md text-xs py-1.5 pl-3 pr-8 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="customer">Customer</option>
                      <option value="store_manager">Store Manager</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {profiles.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No users found in the system.
          </div>
        )}
      </div>
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
        <strong>How to add a new manager:</strong> Ask the new manager to sign up on the public storefront first. Once they have created an account, find their name in the list above and change their role from "Customer" to "Store Manager".
      </div>
    </div>
  )
}
