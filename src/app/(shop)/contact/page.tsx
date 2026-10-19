"use client"

import { Container } from "@/components/layout/container"
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react"

export default function ContactPage() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919082377314"

  return (
    <div className="bg-background min-h-screen py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-6">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Get in Touch</h1>
          <p className="text-foreground/70 text-lg">
            Have a question about our fragrances, or need help finding your signature scent? We are here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Visit Our Store</h2>
              <div className="space-y-8">
                {/* Address 1 */}
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Store 1 (Janjiker Street)</p>
                    <p className="text-foreground/70 mt-1 leading-relaxed">
                      137, Janjiker street opp Central restaurant,<br />
                      Near crowford Market, Masjid west<br />
                      MUMBAI 400003
                    </p>
                  </div>
                </div>

                {/* Address 2 */}
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg">Store 2 (Minara Masjid)</p>
                    <p className="text-foreground/70 mt-1 leading-relaxed">
                      41, Mohd Ali Road, Minara Masjid,<br />
                      Near Zam Zam Sweet,<br />
                      Mumbai - 400003
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Contact Us</h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6 text-accent shrink-0" />
                  <p className="text-lg">+91 90823 77314</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6 text-accent shrink-0" />
                  <p className="text-lg">support@snattarwala.in</p>
                </div>
                <a 
                  href={`https://wa.me/${phoneNumber}?text=Hello, I have an inquiry.`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-4 group inline-flex"
                >
                  <div className="bg-[#25D366] p-2 rounded-full text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <p className="text-lg font-medium group-hover:text-accent transition-colors">Chat on WhatsApp</p>
                </a>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Store Hours</h2>
              <ul className="space-y-2 text-foreground/70">
                <li className="flex justify-between max-w-xs">
                  <span>Monday - Saturday:</span>
                  <span>10:00 AM - 9:00 PM</span>
                </li>
                <li className="flex justify-between max-w-xs">
                  <span>Sunday:</span>
                  <span>11:00 AM - 7:00 PM</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Maps */}
          <div className="space-y-8">
            <div className="h-[400px] bg-secondary rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-accent/30 hover:shadow-[0_0_25px_rgba(212,175,55,0.7)] transition-all duration-500">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src="https://maps.google.com/maps?q=137,+Janjiker+street+opp+Central+restaurant,+Near+crowford+Market,+Masjid+west+MUMBAI+400003&t=&z=15&ie=UTF8&iwloc=&output=embed"
                title="Store 1 Location"
              ></iframe>
            </div>
            
            <div className="h-[400px] bg-secondary rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-accent/30 hover:shadow-[0_0_25px_rgba(212,175,55,0.7)] transition-all duration-500">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src="https://maps.google.com/maps?q=41,+Mohd+Ali+Road,+Minara+Masjid,+Near+Zam+Zam+Sweet,+Mumbai+-+400003&t=&z=15&ie=UTF8&iwloc=&output=embed"
                title="Store 2 Location"
              ></iframe>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
