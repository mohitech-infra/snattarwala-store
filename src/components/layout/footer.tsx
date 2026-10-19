import Link from "next/link"
import { Container } from "./container"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100 pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-heading text-3xl font-bold tracking-wider uppercase">SN AttarWala</span>
            </Link>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Curating the finest luxury fragrances for those who want to leave an unforgettable impression.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://www.instagram.com/snattarwala" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-medium tracking-wide">Shop</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link href="/shop" className="hover:text-accent transition-colors">All Perfumes</Link></li>
              <li><Link href="/shop?gender=men" className="hover:text-accent transition-colors">For Him</Link></li>
              <li><Link href="/shop?gender=women" className="hover:text-accent transition-colors">For Her</Link></li>
              <li><Link href="/shop?gender=unisex" className="hover:text-accent transition-colors">Unisex</Link></li>
              <li><Link href="/shop?premium=true" className="hover:text-accent transition-colors">Premium Collection</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-medium tracking-wide">Support</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-accent transition-colors">FAQs</Link></li>
              <li><Link href="/shipping" className="hover:text-accent transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/store" className="hover:text-accent transition-colors">Store Locator</Link></li>
              <li><Link href="/track" className="hover:text-accent transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-medium tracking-wide">Newsletter</h4>
            <p className="text-slate-300 text-sm">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex mt-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-transparent border-b border-slate-700 focus:border-accent text-white px-0 py-2 w-full outline-none transition-colors text-sm"
                required
              />
              <button 
                type="submit" 
                className="text-sm font-medium tracking-wide text-accent hover:text-white transition-colors ml-4 whitespace-nowrap"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} SN AttarWala. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
