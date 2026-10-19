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
  RefreshCw
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      sender: "ai",
      text: "Salam SN Attarwala! I am your **ATTARWALA AI Advisor**. I continuously monitor your orders, inventory velocity, customer cart drops, and fragrance trends. How can I help you grow store revenue today?",
      dataPoints: [
        { label: "Today's Revenue", value: "₹8,45,280 (+18.4%)" },
        { label: "Critical Warnings", value: "3 SKUs Low Stock" },
        { label: "Recovery Potential", value: "18 Carts (₹48,200)" }
      ],
      suggestedAction: {
        label: "Review Low Stock Products",
        href: "/admin/inventory"
      },
      time: "Just now"
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const quickPrompts = [
    { label: "What should I focus on today?", icon: Flame },
    { label: "Why did sales fall yesterday?", icon: TrendingUp },
    { label: "Which products are low stock?", icon: Boxes },
    { label: "How to increase average order value?", icon: DollarSign },
    { label: "Suggest an Eid festive promotion", icon: TicketPercent },
    { label: "Analyze VIP customer behavior", icon: Users }
  ]

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      time: "Just now"
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const response = getAIStoreResponse(query)
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.answer,
        dataPoints: response.dataPoints,
        suggestedAction: response.suggestedAction,
        time: "Just now"
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 600)
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
                    __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
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
                <span className="italic font-light">Analyzing live store metrics & inventory...</span>
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
