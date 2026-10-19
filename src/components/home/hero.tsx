"use client"

import { useState, useRef, useEffect } from "react"
import { Container } from "@/components/layout/container"
import { motion } from "framer-motion"
import Link from "next/link"

export function Hero() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // If the video is already ready or cached by the browser
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setIsVideoLoaded(true)
      videoRef.current.play().catch(() => {})
    }
  }, [])

  const handleVideoReady = () => {
    setIsVideoLoaded(true)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted in some browsers/power saving modes
      })
    }
  }

  return (
    <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-black">
      {/* Background Media Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Luxury gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/85 z-10 pointer-events-none" />

        {/* Poster image: loads immediately (12KB webp), ensures no black flash or layout shift */}
        <picture>
          <source srcSet="/hero-poster.webp" type="image/webp" />
          <img
            src="/hero-poster.jpg"
            alt="SN AttarWala Luxury Fragrances"
            fetchPriority="high"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out ${
              isVideoLoaded ? "opacity-0 scale-105" : "opacity-100 scale-100"
            }`}
          />
        </picture>

        {/* Video: streamable fast-start mp4, plays smoothly when buffered */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.webp"
          onCanPlayThrough={handleVideoReady}
          onPlaying={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/hero-video-optimized.mp4" type="video/mp4" />
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </div>

      <Container className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-3xl space-y-6"
        >
          <span className="uppercase tracking-[0.3em] text-sm md:text-base font-medium text-white/80">
            SN AttarWala
          </span>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            Discover Your <br />
            <span className="italic font-light">Signature Scent</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-light leading-relaxed">
            Premium fragrances curated for those who leave an unforgettable impression.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/shop"
              className="px-8 py-4 bg-white text-black font-medium tracking-wide uppercase text-sm hover:bg-white/90 transition-colors w-full sm:w-auto shadow-lg"
            >
              Shop Collection
            </Link>
            <Link 
              href="/collections/premium"
              className="px-8 py-4 bg-transparent border border-white text-white font-medium tracking-wide uppercase text-sm hover:bg-white/10 transition-colors w-full sm:w-auto backdrop-blur-xs"
            >
              Explore Premium
            </Link>
            <Link
              href="#wholesale"
              className="px-8 py-4 bg-accent/90 text-black font-medium tracking-wide uppercase text-sm hover:bg-accent transition-colors w-full sm:w-auto shadow-lg"
            >
              Wholesale Rates
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
