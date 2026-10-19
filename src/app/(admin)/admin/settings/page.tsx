"use client"

import { useState, useEffect } from "react"
import { 
  Settings, Store, Bell, Shield, CreditCard, Truck,
  Save, Check, MapPin
} from "lucide-react"
import { getStorePolicies, saveStorePolicies, DEFAULT_STORE_POLICIES, StorePolicies } from "@/lib/policies-service"
import { getStoreSettings, saveStoreSettings, StoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/store-settings-service"

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("store")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [policies, setPolicies] = useState<StorePolicies>(DEFAULT_STORE_POLICIES)
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      const [storeData, policiesData] = await Promise.all([
        getStoreSettings(),
        getStorePolicies()
      ])
      setSettings(storeData)
      setPolicies(policiesData)
      setLoading(false)
    }
    loadAll()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      saveStoreSettings(settings),
      saveStorePolicies({ ...policies, freeShippingThreshold: settings.freeShippingAbove })
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs = [
    { id: "store", label: "Store Info", icon: Store },
    { id: "locations", label: "Store Locations", icon: MapPin },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield }
  ]

  const Toggle = ({ val, onChange }: { val: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${val ? "bg-accent" : "bg-secondary border border-border"}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${val ? "left-[22px] bg-slate-950" : "left-0.5 bg-foreground/40"}`} />
    </button>
  )

  const Input = ({ label, value, onChange, type = "text", mono = false }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; mono?: boolean }) => (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground ${mono ? "font-mono" : ""}`}
      />
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Configuration</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Store Settings</h1>
          <p className="text-sm text-foreground/60">Configure your ATTARWALA storefront, payments, shipping, and system preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-70 ${
            saved ? "bg-emerald-600 text-white" : "bg-accent text-slate-950 hover:bg-accent/90"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved Successfully!" : "Save All Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Tab Sidebar */}
        <div className="bg-card border border-border/50 rounded-lg shadow-sm p-2 space-y-1 h-fit">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                  activeTab === t.id ? "bg-primary text-primary-foreground border-l-2 border-accent" : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === t.id ? "text-accent" : "text-foreground/50"}`} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 bg-card border border-border/50 rounded-lg shadow-sm p-6 space-y-6">

          {/* Store Info Tab */}
          {activeTab === "store" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-base border-b border-border/50 pb-3 text-accent uppercase tracking-wider text-sm">Store Identity</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Store Name" value={settings.storeName} onChange={v => setSettings({...settings, storeName: v})} />
                <Input label="Brand Tagline" value={settings.tagline} onChange={v => setSettings({...settings, tagline: v})} />
                <Input label="Business Email" value={settings.storeEmail} onChange={v => setSettings({...settings, storeEmail: v})} />
                <Input label="Contact Number" value={settings.storePhone} onChange={v => setSettings({...settings, storePhone: v})} />
                <Input label="WhatsApp Number (with country code)" value={settings.whatsappNumber} onChange={v => setSettings({...settings, whatsappNumber: v})} mono />
                <Input label="GST Number" value={settings.gstNumber} onChange={v => setSettings({...settings, gstNumber: v})} mono />
              </div>

              <Input label="Business Address" value={settings.address} onChange={v => setSettings({...settings, address: v})} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Currency" value={settings.currency} onChange={v => setSettings({...settings, currency: v})} />
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-accent">Social Media Links</h4>
                <Input label="Instagram URL" value={settings.instagramUrl} onChange={v => setSettings({...settings, instagramUrl: v})} />
                <Input label="Facebook URL" value={settings.facebookUrl} onChange={v => setSettings({...settings, facebookUrl: v})} />
                <Input label="Twitter / X URL" value={settings.twitterUrl} onChange={v => setSettings({...settings, twitterUrl: v})} />
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-destructive/20">
                <h4 className="font-heading font-bold text-sm text-destructive uppercase tracking-wider mb-3">Danger Zone</h4>
                <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <div>
                    <p className="font-semibold text-foreground text-xs">Maintenance Mode</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">Takes the store offline for customers (admin still accessible)</p>
                  </div>
                  <Toggle val={settings.maintenanceMode} onChange={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} />
                </div>
              </div>
            </div>
          )}

          {/* Store Locations Tab */}
          {activeTab === "locations" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-base border-b border-border/50 pb-3 text-accent uppercase tracking-wider text-sm">Mumbai Store Locations</h3>
              <p className="text-xs text-foreground/60">These addresses are displayed on the homepage and contact pages.</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Store 1</h4>
                  <div className="space-y-3">
                    <Input label="Store 1 Name" value={settings.store1Name} onChange={v => setSettings({...settings, store1Name: v})} />
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Store 1 Address</label>
                      <textarea
                        rows={3}
                        value={settings.store1Address}
                        onChange={e => setSettings({...settings, store1Address: e.target.value})}
                        className="w-full bg-background border border-border rounded-sm p-2.5 text-xs focus:outline-none focus:border-accent text-foreground resize-y"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Store 2</h4>
                  <div className="space-y-3">
                    <Input label="Store 2 Name" value={settings.store2Name} onChange={v => setSettings({...settings, store2Name: v})} />
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Store 2 Address</label>
                      <textarea
                        rows={3}
                        value={settings.store2Address}
                        onChange={e => setSettings({...settings, store2Address: e.target.value})}
                        className="w-full bg-background border border-border rounded-sm p-2.5 text-xs focus:outline-none focus:border-accent text-foreground resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-sm border-b border-border/50 pb-3 text-accent uppercase tracking-wider">Payment Gateway Configuration</h3>
              
              {[
                { label: "Razorpay UPI & Cards", sub: "Primary payment gateway", key: "razorpayEnabled" as const },
                { label: "Cash on Delivery (COD)", sub: "Enable COD — payment collected at doorstep", key: "codEnabled" as const },
              ].map(p => (
                <div key={p.key} className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-sm">
                  <div>
                    <p className="font-semibold text-foreground text-xs">{p.label}</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">{p.sub}</p>
                  </div>
                  <Toggle val={settings[p.key] as boolean} onChange={() => setSettings({...settings, [p.key]: !settings[p.key]})} />
                </div>
              ))}
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === "shipping" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-sm border-b border-border/50 pb-3 text-accent uppercase tracking-wider">Shipping Configuration</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Free Shipping Above (₹)" value={settings.freeShippingAbove} type="number" onChange={v => setSettings({...settings, freeShippingAbove: Number(v)})} />
                <Input label="Default Shipping Rate (₹)" value={settings.defaultShippingRate} type="number" onChange={v => setSettings({...settings, defaultShippingRate: Number(v)})} />
              </div>

              <div className="space-y-4 pt-2 border-t border-border/40">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-accent">Live Policy Text</h4>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Shipping Policy Statement</label>
                  <textarea
                    rows={3}
                    value={policies.shippingPolicy}
                    onChange={e => setPolicies({ ...policies, shippingPolicy: e.target.value })}
                    className="w-full bg-background border border-border rounded-sm p-2.5 text-xs focus:outline-none focus:border-accent text-foreground resize-y"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Return & Refund Policy Statement</label>
                  <textarea
                    rows={3}
                    value={policies.returnPolicy}
                    onChange={e => setPolicies({ ...policies, returnPolicy: e.target.value })}
                    className="w-full bg-background border border-border rounded-sm p-2.5 text-xs focus:outline-none focus:border-accent text-foreground resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-sm border-b border-border/50 pb-3 text-accent uppercase tracking-wider">Notification Preferences</h3>
              <Input label="Low Stock Threshold (units)" value={settings.lowStockThreshold} type="number" onChange={v => setSettings({...settings, lowStockThreshold: Number(v)})} />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <h3 className="font-heading font-bold text-sm border-b border-border/50 pb-3 text-accent uppercase tracking-wider">Security & Access Control</h3>
              <div className="mt-6 pt-2 border-t border-border/50">
                <h4 className="font-heading font-bold text-sm text-foreground mb-4">Change Admin Password</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (newPassword !== confirmPassword) { alert("Passwords do not match"); return }
                  if (newPassword.length < 6) { alert("Password must be at least 6 characters"); return }
                  const { createClient } = await import("@/lib/supabase/client")
                  const supabase = createClient()
                  const { error } = await supabase.auth.updateUser({ password: newPassword })
                  if (error) { alert(error.message) } else {
                    alert("Password updated successfully!")
                    setNewPassword("")
                    setConfirmPassword("")
                  }
                }} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full sm:max-w-xs bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full sm:max-w-xs bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <button type="submit" className="py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-slate-800 transition-colors">
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
