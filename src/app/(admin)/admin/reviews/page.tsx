"use client"

import { useState, useEffect } from "react"
import { 
  Star, Check, X, Eye, MessageSquare, 
  ThumbsUp, ThumbsDown, Filter, Sparkles, BarChart3, RefreshCw
} from "lucide-react"
import { getAdminReviews, updateAdminReviewStatus, deleteAdminReview, AdminReview } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-accent text-accent" : "text-border"}`} />
    ))}
  </div>
)

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await getAdminReviews()
      setReviews(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = reviews.filter(r => filter === "All" || r.status === filter)
  const approvedReviews = reviews.filter(r => r.status === "Approved")
  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
    : "0.0"
  const pendingCount = reviews.filter(r => r.status === "Pending").length

  const approve = async (id: string) => {
    const ok = await updateAdminReviewStatus(id, true)
    if (ok) setReviews(prev => prev.map(r => r.id === id ? {...r, status: "Approved" as const} : r))
  }
  const reject = async (id: string) => {
    const ok = await updateAdminReviewStatus(id, false)
    if (ok) setReviews(prev => prev.map(r => r.id === id ? {...r, status: "Rejected" as const} : r))
  }
  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return
    const ok = await deleteAdminReview(id)
    if (ok) setReviews(prev => prev.filter(r => r.id !== id))
  }

  const ratingDistribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star && r.status === "Approved").length
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Social Proof</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Reviews & Ratings</h1>
          <p className="text-sm text-foreground/60">Moderate and respond to customer fragrance reviews.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-4 py-2.5 bg-amber-500/15 text-amber-600 border border-amber-500/30 font-semibold text-xs rounded-sm">
              {pendingCount} Reviews Awaiting Moderation
            </span>
          )}
          <ExportMenu
            filename="attarwala_customer_reviews"
            title="Customer Reviews"
            data={filtered.map(r => ({
              id: r.id,
              customerName: r.customerName,
              productName: r.productName,
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              status: r.status,
              date: r.date
            }))}
          />
        </div>
      </div>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-accent/30 shadow-sm flex flex-col items-center justify-center text-center bg-accent/5">
          <span className="text-5xl font-heading font-bold text-accent">{avgRating}</span>
          <StarRating rating={Math.round(Number(avgRating))} />
          <p className="text-xs text-foreground/60 mt-2">{reviews.filter(r=>r.status==="Approved").length} approved reviews</p>
        </div>
        <div className="md:col-span-2 bg-card p-6 rounded-lg border border-border/60 shadow-sm space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-3">Rating Breakdown</p>
          {ratingDistribution.map(({ star, count }) => {
            const total = reviews.filter(r=>r.status==="Approved").length || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="font-semibold text-foreground">{star}</span>
                  <Star className="w-3 h-3 fill-accent text-accent" />
                </div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-foreground/60 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-card border border-border/50 p-3 rounded-lg shadow-sm">
        {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm uppercase tracking-wider transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {f} ({f === "All" ? reviews.length : reviews.filter(r=>r.status===f).length})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.map(review => (
          <div key={review.id} className={`bg-card p-5 rounded-lg border shadow-sm transition-all ${
            review.status === "Pending" ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 hover:border-accent/30"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-secondary font-heading font-bold text-sm flex items-center justify-center text-foreground shrink-0">
                  {review.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading font-bold text-sm text-foreground">{review.customerName}</p>
                    {review.verifiedBuyer && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 rounded font-semibold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/50">{review.productName} • {review.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StarRating rating={review.rating} />
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${
                  review.status === "Approved" ? "bg-emerald-500/15 text-emerald-600" :
                  review.status === "Pending" ? "bg-amber-500/15 text-amber-600" :
                  "bg-secondary text-foreground/50"
                }`}>
                  {review.status}
                </span>
              </div>
            </div>

            <h4 className="font-heading font-bold text-sm text-foreground mb-1.5">"{review.title}"</h4>
            <p className="text-xs text-foreground/70 leading-relaxed">{review.comment}</p>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
              <div className="flex items-center gap-1 text-[10px] text-foreground/50">
                <ThumbsUp className="w-3 h-3" />
                <span>{review.helpful} found this helpful</span>
              </div>
              {review.status === "Pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approve(review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => reject(review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-destructive/15 transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
