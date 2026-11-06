"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  ArrowRight, 
  TrendingUp, 
  Boxes, 
  Users, 
  TicketPercent, 
  DollarSign, 
  Flame,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from "lucide-react"
import Link from "next/link"
import { getAIStoreResponse } from "@/lib/admin-ai"

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  dataPoints?: { label: string; value: string }[];
  suggestedAction?: { label: string; href: string };
  time: string;
}

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const [input, setInput] = useState("")
  const [liveCounts, setLiveCounts] = useState<{
    products: number;
    lowStock: number;
    pendingOrders: number;
    abandonedCarts: number;
    customers: number;
    activeCoupons: number;
  }>({
    products: 0,
    lowStock: 0,
    pendingOrders: 0,
    abandonedCarts: 0,
    customers: 0,
    activeCoupons: 0,
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      sender: "ai",
      text: "Salam SN Attarwala! I am your **ATTARWALA AI Advisor**.\n\nI monitor your store's live Supabase database, variant inventory, order pipeline, and Google Shopping feed in real time. How can I help you grow store revenue today?",
      dataPoints: [
        { label: "Catalog Products", value: "0 SKUs" },
        { label: "Low Stock Warnings", value: "0 Items" },
        { label: "Pending Orders", value: "0 New" },
        { label: "System Status", value: "Live Database Connected" }
      ],
      suggestedAction: {
        label: "Manage Products & Variants",
        href: "/admin/products"
      },
      time: "Just now"
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch real live store counts whenever drawer opens
  useEffect(() => {
    if (!isOpen) return

    fetch("/api/admin/counts")
      .then((res) => res.json())
      .then((data) => {
        if (data?.counts) {
          const counts = data.counts
          setLiveCounts(counts)

          // Update greeting with real-time numbers
          setMessages((prev) => {
            if (prev.length > 1) return prev // keep conversation history if user has chatted

            const initialGreeting: Message = {
              id: "msg-0",
              sender: "ai",
              text: "Salam SN Attarwala! I am your **ATTARWALA AI Advisor**.\n\nI monitor your store's live Supabase database, variant inventory, order pipeline, and Google Shopping feed in real time. How can I help you grow store revenue today?",
              dataPoints: [
                { label: "Catalog Products", value: `${counts.products} SKUs` },
                { label: "Low Stock Warnings", value: `${counts.lowStock} Items` },
                { label: "Pending Orders", value: `${counts.pendingOrders} New` },
                { label: "Abandoned Carts", value: `${counts.abandonedCarts} Sessions` },
              ],
              suggestedAction:
                counts.products === 0
                  ? { label: "Add Your First Fragrance", href: "/admin/products" }
                  : counts.lowStock > 0
                  ? { label: "Review Low Stock Products", href: "/admin/inventory" }
                  : counts.pendingOrders > 0
                  ? { label: "Review Pending Orders", href: "/admin/orders" }
                  : { label: "Explore Google Shopping Feed", href: "/admin/google-shopping" },
              time: "Just now",
            }
            return [initialGreeting]
          })
        }
      })
      .catch((err) => console.warn("Could not fetch live counts for AI Advisor:", err))
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const quickPrompts = [
    { label: "How do I add size variants & prices?", icon: Boxes },
    { label: "How do I upload category photos?", icon: Flame },
    { label: "How to increase average order value?", icon: DollarSign },
    { label: "How to process pending orders & invoices?", icon: TrendingUp },
    { label: "How do I check my Google Shopping feed?", icon: ShoppingBag },
    { label: "How do I manage wholesale B2B leads?", icon: Users }
  ]

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || isTyping) return

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      time: "Just now"
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setIsTyping(true)

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'admin'
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      const aiMsgId = `ai-${Date.now()}`
      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          text: "",
          time: "Just now"
        }
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                accumulatedText += JSON.parse(line.slice(2))
              } catch {
                accumulatedText += line.slice(2)
              }
            } else if (!line.startsWith('d:') && !line.startsWith('e:') && !line.startsWith('2:') && line.trim()) {
              accumulatedText += line
            }
          }

          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId ? { ...m, text: accumulatedText } : m
            )
          )
        }
      }
    } catch (err) {
      console.warn("Live AI streaming failed, falling back to dynamic store intelligence:", err)
      const fallback = getAIStoreResponse(query)
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: fallback.answer,
          dataPoints: fallback.dataPoints,
          suggestedAction: fallback.suggestedAction,
          time: "Just now"
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* Slide-over Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card border-l border-accent/40 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-border/50 bg-gradient-to-r from-background via-secondary/20 to-accent/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-sm bg-accent text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Sparkles className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg leading-tight">ATTARWALA AI ADVISOR</h3>
                <p className="text-[11px] text-accent uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Store Intelligence Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-sm border border-border/60 hover:border-accent text-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Carousel / Bar */}
          <div className="px-6 py-3 border-b border-border/30 bg-secondary/15 overflow-x-auto custom-scrollbar flex gap-2">
            {quickPrompts.map((p, idx) => {
              const Icon = p.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(p.label)}
                  className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background hover:border-accent hover:text-accent text-[11px] font-medium transition-colors"
                >
                  <Icon className="w-3 h-3 text-accent" />
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 mb-1 text-[10px] text-foreground/40 uppercase tracking-wider">
                  {m.sender === 'ai' ? (
                    <>
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span className="font-semibold text-accent">Attarwala AI Advisor</span>
                    </>
                  ) : (
                    <span>You</span>
                  )}
                  <span>• {m.time}</span>
                </div>

                <div 
                  className={`p-4 rounded-sm max-w-[92%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground border border-border'
                      : 'bg-background border border-border/60 shadow-sm text-foreground space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ 
                    __html: m.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-accent underline font-semibold hover:text-accent/80 transition-colors">$1 ↗</a>')
                  }} />

                  {/* Data Points Grid */}
                  {m.dataPoints && m.dataPoints.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40">
                      {m.dataPoints.map((dp, i) => (
                        <div key={i} className="p-2 rounded-sm bg-secondary/30 border border-border/30">
                          <p className="text-[10px] text-foreground/50 uppercase tracking-widest">{dp.label}</p>
                          <p className="font-heading font-bold text-xs text-foreground mt-0.5">{dp.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Link Button */}
                  {m.suggestedAction && (
                    <div className="pt-2">
                      <Link
                        href={m.suggestedAction.href}
                        onClick={onClose}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-slate-950 font-semibold text-[11px] transition-all uppercase tracking-wider"
                      >
                        <span>{m.suggestedAction.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-accent text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="italic font-light">Analyzing live store metrics & formulating advice...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-border/50 bg-background/95">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Attarwala AI anything about your store..."
                className="flex-1 bg-secondary/30 border border-border rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-accent text-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-3 bg-accent text-slate-950 font-bold text-xs rounded-sm hover:bg-accent/90 disabled:opacity-50 transition-colors uppercase tracking-wider flex items-center justify-center shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-foreground/40 text-center mt-2">
              Powered by ATTARWALA Business Intelligence Engine • Real-time database synced
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
