"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, User as UserIcon, Loader2, Sparkles, ShoppingBag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useChat, type Message } from "ai/react"
import type { ToolInvocation } from "ai"
import Link from "next/link"

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: "welcome-msg",
        role: "assistant",
        content: "Welcome to SN AttarWala! I am your AI fragrance expert. How can I assist you in finding your perfect scent today?"
      }
    ]
  })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-accent to-[#D4AF37] text-slate-900 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.8)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Open AI Chat"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-[100] w-full md:w-[420px] h-[100dvh] md:h-[600px] md:max-h-[85vh] 
            backdrop-blur-2xl bg-white md:bg-white/90 md:border border-border shadow-none md:shadow-2xl rounded-none md:rounded-2xl flex flex-col overflow-hidden text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold tracking-wide text-foreground">Fragrance Expert</h3>
                  <p className="text-[10px] text-accent flex items-center gap-1 uppercase tracking-wider font-semibold">
                    <Sparkles className="w-3 h-3" /> Live Luxury AI Sommelier
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors bg-black/5 p-2 rounded-full hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {messages.map((msg: Message) => (
                <div key={msg.id} className={`flex flex-col space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  
                  {/* Text Message Content */}
                  {msg.content && (
                    <div className={`flex items-start max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-accent text-slate-900 ml-3 shadow-[0_0_10px_rgba(212,175,55,0.3)]" : "bg-primary/5 text-primary mr-3 border border-border"}`}>
                        {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-accent text-slate-900 rounded-2xl rounded-tr-sm font-medium shadow-md" 
                          : "bg-white border border-border text-foreground rounded-2xl rounded-tl-sm shadow-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  )}

                  {/* Tool Invocations (Product Cards) */}
                  {msg.toolInvocations && msg.toolInvocations.length > 0 && (() => {
                    // Collect all products from all successful searchProducts invocations
                    const validToolResults = msg.toolInvocations
                      .filter(t => t.toolName === 'searchProducts' && 'result' in t && (t as any).result?.products);
                      
                    const allProducts = validToolResults.flatMap(t => (t as any).result.products);
                      
                    // Check if it's a fallback scenario
                    const isFallback = validToolResults.some(t => (t as any).result.success === false);
                      
                    // Deduplicate by ID
                    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
                    
                    const isSearching = msg.toolInvocations.some(t => t.toolName === 'searchProducts' && !('result' in t));
                    const hasCompletedSearch = msg.toolInvocations.some(t => t.toolName === 'searchProducts' && 'result' in t);

                    return (
                      <div key={`tools-${msg.id}`}>
                        {uniqueProducts.length > 0 && (
                          <div className="w-full pl-11 pr-2 pt-2">
                            <p className="text-sm text-foreground mb-3 leading-relaxed">
                              {isFallback 
                                ? "I don't have exactly what you requested, but I highly recommend these exquisite alternatives that you might love:" 
                                : "I have found some exquisite fragrances that perfectly match your request. Each of these perfumes features a beautifully crafted blend of notes designed to leave a lasting impression:"}
                            </p>
                            <div className="flex flex-col gap-3 pb-2">
                              {uniqueProducts.map((product: any) => (
                                <Link 
                                  href={`/product/${product.slug}`} 
                                  key={product.id}
                                  onClick={() => setIsOpen(false)}
                                  className="bg-white border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors group flex items-center p-2 gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 duration-300"
                                >
                                  <div className="w-[80px] h-[80px] rounded-md relative overflow-hidden bg-muted shrink-0">
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center overflow-hidden pr-2">
                                    <p className="text-[10px] uppercase tracking-wider text-accent font-bold mb-1 truncate">{product.brand}</p>
                                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-accent transition-colors">{product.name}</h4>
                                    <div className="mt-1.5 flex items-center justify-between">
                                      <span className="text-sm font-bold text-slate-800">₹{product.price.toLocaleString()}</span>
                                      <span className="w-6 h-6 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                                        <ShoppingBag className="w-3 h-3" />
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {uniqueProducts.length === 0 && hasCompletedSearch && !isSearching && (
                          <div className="w-full pl-11">
                            <p className="text-xs text-muted-foreground italic">No products found matching the criteria.</p>
                          </div>
                        )}
                        
                        {isSearching && (
                          <div className="w-full pl-11 flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin text-accent" />
                            <span>Searching catalog...</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                 <div className="flex items-start flex-row">
                    <div className="w-8 h-8 rounded-full bg-primary/5 text-primary mr-3 border border-border flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3 text-sm leading-relaxed bg-white border border-border text-foreground rounded-2xl rounded-tl-sm flex items-center space-x-2 shadow-sm">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 border-t border-border backdrop-blur-xl">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about perfumes..."
                  className="w-full bg-white border border-border rounded-full pl-4 pr-12 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 w-10 h-10 rounded-full bg-accent text-slate-900 flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                >
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </form>
              <div className="text-center mt-3">
                <p className="text-[10px] text-muted-foreground">SN AttarWala AI can make mistakes. Consider verifying important information.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
