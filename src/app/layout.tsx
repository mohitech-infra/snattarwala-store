import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { Chatbot } from "@/components/chat/chatbot";
import { CartProvider } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://snattarwala.in"),
  title: "SN AttarWala | Premium Luxury Fragrances in Mumbai",
  description: "Discover a world of premium fragrances and authentic attars at SN AttarWala, Mumbai's finest destination for luxury perfumes. Experience true olfactory elegance.",
  keywords: "perfume, fragrance, attar, ittar, luxury perfume mumbai, sn attarwala, premium fragrance india",
  openGraph: {
    title: "SN AttarWala | Premium Luxury Fragrances",
    description: "Discover a world of premium fragrances and authentic attars at SN AttarWala.",
    url: "https://snattarwala.in",
    siteName: "SN AttarWala",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" as="image" href="/logo.png" type="image/png" fetchPriority="high" />
        <link rel="preload" as="image" href="/hero-poster.webp" type="image/webp" fetchPriority="high" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <SmoothScroll>
          <CartProvider>
            {children}
            <FloatingWhatsApp />
            <Chatbot />
            <CartDrawer />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
