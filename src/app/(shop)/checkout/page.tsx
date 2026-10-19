"use client"

import { useCart } from "@/hooks/use-cart"
import { Container } from "@/components/layout/container"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

export default function CheckoutPage() {
  const { items, cartTotal, cartCount } = useCart()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [promoError, setPromoError] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user)
      }
    })
  }, [])
  
  // Apply discount and shipping calculation (free shipping over 10000)
  const discountAmount = appliedPromo ? appliedPromo.discount : 0
  const discountedSubtotal = Math.max(0, cartTotal - discountAmount)
  const shipping = discountedSubtotal > 10000 ? 0 : 500
  const total = discountedSubtotal + shipping

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setIsApplyingPromo(true)
    setPromoError("")
    
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, cartTotal })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setAppliedPromo(data.coupon)
      } else {
        setPromoError(data.error || "Invalid promo code")
      }
    } catch (err) {
      setPromoError("Failed to apply promo code")
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoCode("")
    setPromoError("")
  }

  useEffect(() => {
    // Redirect if cart is empty
    if (cartCount === 0) {
      router.push("/shop")
    }
  }, [cartCount, router])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // 1. Gather form data
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries())
    
    try {
      // Save address if checked
      if (data.saveAddress === "on" && currentUser) {
        const supabase = createClient()
        await supabase.auth.updateUser({
          data: {
            address1: data.address1,
            address2: data.address2,
            area: data.area,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          }
        })
      }

      if (paymentMethod === "cod") {
        // COD Flow
        const response = await fetch("/api/payment/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            couponCode: appliedPromo?.code || null,
            discountAmount: appliedPromo?.discount || 0,
            shippingAmount: shipping,
            userId: currentUser?.id || null,
            items: items.map(i => ({ 
              productId: i.productId, 
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              size: i.size,
              imageUrl: i.imageUrl,
            })),
            shippingDetails: data
          })
        })
        
        const orderData = await response.json()
        if (response.ok && orderData.success) {
          router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderData.orderNumber || "")}&paymentId=COD`)
        } else {
          throw new Error(orderData.error || "Failed to place COD order")
        }
      } else {
        // Razorpay Flow
        // 2. Call our API to create a Razorpay order
        const response = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          couponCode: appliedPromo?.code || null,
          items: items.map(i => ({ 
            productId: i.productId, 
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            imageUrl: i.imageUrl,
          })),
          shippingAddress: data
        })
      })
      
      const orderData = await response.json()

      if (!response.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order")
      }
      
      // 3. Initialize Razorpay Checkout
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount.toString(),
        currency: orderData.currency || "INR",
        name: "SN AttarWala",
        description: "Luxury Fragrance Purchase",
        order_id: orderData.orderId,
        handler: async function (paymentResponse: any) {
          try {
            // 4. Verify Payment Server Side
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                shippingDetails: data,
                couponCode: appliedPromo?.code || null,
                discountAmount: appliedPromo?.discount || 0,
                shippingAmount: shipping,
                userId: currentUser?.id || null,
                items: items.map(i => ({
                  productId: i.productId,
                  name: i.name,
                  price: i.price,
                  quantity: i.quantity,
                  size: i.size,
                  imageUrl: i.imageUrl,
                })),
                amount: total,
              })
            })
            
            const verifyData = await verifyRes.json()

            if (verifyRes.ok && verifyData.success) {
              router.push(`/checkout/success?orderNumber=${encodeURIComponent(verifyData.orderNumber || "")}&paymentId=${encodeURIComponent(paymentResponse.razorpay_payment_id || "")}`)
            } else {
              alert("Payment verification could not be confirmed: " + (verifyData.message || "Please contact support."))
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr)
            alert("Payment completed but verification timed out. Please check your account orders or contact support.")
          }
        },
        prefill: {
          name: data.fullName,
          email: data.email,
          contact: data.phone
        },
        notes: {
          address: `${data.address1}, ${data.city} - ${data.pincode}`,
        },
        theme: {
          color: "#D4AF37" // Luxury Gold theme
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
          }
        }
      }
      
      // @ts-ignore - Razorpay is loaded via script tag in layout
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        // @ts-ignore
        const rzp1 = new (window as any).Razorpay(options)
        rzp1.on('payment.failed', function (errResp: any){
          alert("Payment Failed: " + (errResp.error?.description || "Transaction declined"))
          setIsProcessing(false)
        })
        rzp1.open()
      } else {
        alert("Payment SDK is loading, please try again in a few seconds.")
        setIsProcessing(false)
      }
      } // End Razorpay Flow
      
    } catch (error: any) {
      console.error("Payment error:", error)
      alert(error?.message || "Something went wrong while initiating payment.")
      setIsProcessing(false)
    }
  }

  if (cartCount === 0) return null // Prevent flash before redirect

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        <h1 className="font-heading text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Form */}
          <div className="flex-1">
            <form id="checkout-form" onSubmit={handlePayment} className="space-y-8">
              {/* Contact Info */}
              <div>
                <h2 className="text-xl font-heading font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input 
                        name="fullName" 
                        type="text" 
                        required 
                        defaultValue={currentUser?.user_metadata?.first_name ? `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name || ''}`.trim() : ''}
                        key={currentUser?.id ? `name-${currentUser.id}` : 'name-guest'}
                        className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input 
                        name="phone" 
                        type="tel" 
                        required 
                        defaultValue={currentUser?.phone || currentUser?.user_metadata?.phone || ''}
                        key={currentUser?.id ? `phone-${currentUser.id}` : 'phone-guest'}
                        className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address *</label>
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      defaultValue={currentUser?.email || ''}
                      key={currentUser?.id ? `email-${currentUser.id}` : 'email-guest'}
                      className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div>
                <h2 className="text-xl font-heading font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                    <input name="address1" type="text" defaultValue={currentUser?.user_metadata?.address1 || ''} required className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" placeholder="Street address, company name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Apartment, suite, etc. (optional)</label>
                    <input name="address2" type="text" defaultValue={currentUser?.user_metadata?.address2 || ''} className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Area / Locality *</label>
                      <input name="area" type="text" defaultValue={currentUser?.user_metadata?.area || ''} required className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <input name="city" type="text" defaultValue={currentUser?.user_metadata?.city || 'Mumbai'} required className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <input name="state" type="text" defaultValue={currentUser?.user_metadata?.state || 'Maharashtra'} required className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pincode *</label>
                      <input name="pincode" type="text" defaultValue={currentUser?.user_metadata?.pincode || ''} required className="w-full border border-border bg-background p-3 rounded-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  
                  {currentUser && (
                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" name="saveAddress" id="saveAddress" className="w-4 h-4 accent-primary cursor-pointer" />
                      <label htmlFor="saveAddress" className="text-sm text-foreground/80 cursor-pointer">Save this address as default for future orders</label>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-secondary/30 border border-border/50 rounded-lg p-6 sticky top-28">
              <h2 className="text-xl font-heading font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-background border border-border/50 rounded-sm shrink-0 overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-foreground/60">{item.size} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center text-sm font-medium">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 pt-6 border-t border-border/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Subtotal</span>
                  <span className="font-medium">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-₹{appliedPromo.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/70">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
              </div>
              
              {/* Promo Code Input */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-sm font-semibold mb-3">Promo Code</h3>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-sm">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="font-mono font-bold">{appliedPromo.code}</span>
                      <span className="text-xs">Applied!</span>
                    </div>
                    <button type="button" onClick={removePromo} className="text-xs text-emerald-600 hover:text-emerald-700 underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code" 
                      className="flex-1 border border-border bg-background p-2.5 rounded-sm focus:outline-none focus:border-accent text-sm uppercase"
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      className="px-4 py-2 bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      {isApplyingPromo ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-destructive mt-2">{promoError}</p>}
              </div>
              
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-border/50 text-lg font-semibold overflow-hidden">
                <span>Total</span>
                <motion.span 
                  key={total}
                  initial={appliedPromo ? { x: -10, color: "#10b981" } : {}}
                  animate={appliedPromo ? { x: [0, -10, 10, -10, 10, -5, 5, 0], color: ["#10b981", "#10b981", "#000"] } : {}}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={appliedPromo ? "text-emerald-500 text-xl font-bold transition-colors" : ""}
                >
                  ₹{total.toLocaleString('en-IN')}
                </motion.span>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-sm font-semibold mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer hover:bg-secondary/20 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="razorpay" 
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="accent-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Online Payment</p>
                      <p className="text-xs text-foreground/60">UPI, Cards, Net Banking & Wallets</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer hover:bg-secondary/20 transition-colors">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-primary w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                      <p className="text-xs text-foreground/60">Pay when your order arrives</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                form="checkout-form"
                disabled={isProcessing}
                className="w-full mt-8 bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : (paymentMethod === "cod" ? "Place Order (COD)" : "Pay with Razorpay")}
              </button>
              
              <div className="mt-4 text-center text-xs text-foreground/50 flex flex-col items-center justify-center space-y-1">
                <span>100% Secure Payment</span>
                <span>Supports UPI, Cards, Net Banking & Wallets</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
