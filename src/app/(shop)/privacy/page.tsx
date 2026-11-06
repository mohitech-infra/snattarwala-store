import { Container } from "@/components/layout/container"
import { Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | SN AttarWala",
  description: "SN AttarWala values your privacy. Learn how we handle customer data, ensure safe SSL checkout, and comply with Indian IT data protection rules.",
}

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen py-16 md:py-24">
      <Container>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Legal & Security</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-foreground/70 text-base md:text-lg leading-relaxed">
            Your privacy and security are paramount. This policy outlines how SN AttarWala collects, safeguards, and utilizes your information in compliance with Indian Information Technology regulations and global e-commerce security standards.
          </p>
          <p className="text-xs text-foreground/50">Effective Date: November 2026 | Last Updated: November 2026</p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold">256-bit SSL Security</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              All transactions and customer credentials are encrypted with TLS 1.3 / 256-bit SSL encryption.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold">Zero Payment Storage</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              We never store your card numbers, CVVs, or net-banking credentials on our servers.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold">No Data Selling</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              We never sell, rent, or trade your personal information to third-party marketing companies.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="max-w-4xl mx-auto space-y-10 text-foreground/80 leading-relaxed text-sm md:text-base">
          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">1. Information We Collect</h2>
            <p>
              When you browse our storefront, register an account, or place an order, we may collect the following details:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/75">
              <li><strong>Contact Information:</strong> Full name, phone/WhatsApp number, and email address.</li>
              <li><strong>Delivery Address:</strong> Shipping address, pin code, state, and city for parcel dispatch.</li>
              <li><strong>Billing Information:</strong> Invoice address and GSTIN (for B2B wholesale transactions, if applicable).</li>
              <li><strong>Order History:</strong> Products purchased, variant sizes selected, transaction IDs, and delivery statuses.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device details, and site navigation metrics collected via cookies to enhance user experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">2. Payment Gateway Security</h2>
            <p>
              Online payments on <strong>snattarwala.in</strong> are processed via Reserve Bank of India (RBI) authorized payment gateways (such as Razorpay). During payment, you enter your financial details directly on the PCI-DSS compliant secure server of the payment gateway. SN AttarWala never accesses or stores sensitive payment instruments such as CVVs, PINs, or passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">3. Purpose of Processing Your Data</h2>
            <p>
              We process your personal information strictly for legitimate commercial purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li>Processing, verifying, and dispatching your perfume orders.</li>
              <li>Sending automated order confirmations, delivery updates, and tracking numbers via SMS/WhatsApp/Email.</li>
              <li>Providing dedicated customer assistance and managing return or exchange requests.</li>
              <li>Preventing fraudulent orders and maintaining platform security.</li>
              <li>Sending occasional fragrance recommendations and promotional launches (only when opted-in, with instant unsubscribe options).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">4. Disclosure to Third Parties</h2>
            <p>
              We share minimal necessary information only with trusted operational partners:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li><strong>Logistics Partners:</strong> Courier companies (BlueDart, Delhivery, DTDC) receive your name, address, and contact number solely to deliver your parcel.</li>
              <li><strong>Payment Processors:</strong> RBI-licensed payment processors for secure transaction settlement.</li>
              <li><strong>Statutory Authorities:</strong> When required by Indian law, judicial process, or government law enforcement.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">5. Cookies and Tracking Technologies</h2>
            <p>
              We utilize essential cookies to retain your shopping cart items, remember your currency preferences, and preserve session state. You can manage or disable cookies via your browser preferences; however, disabling essential cookies may impact checkout functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">6. Your Rights and Data Retention</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, you have the right to access, rectify, or request deletion of your personal account records. To exercise these rights, please email us at <a href="mailto:support@snattarwala.in" className="text-accent underline font-medium">support@snattarwala.in</a>.
            </p>
          </section>

          <section className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-2">
            <h3 className="font-heading text-lg font-bold text-foreground">7. Grievance Officer & Contact</h3>
            <p className="text-sm">
              If you have any queries or grievances regarding data protection or our privacy practices, please contact our designated Grievance Officer:
            </p>
            <div className="text-sm space-y-1 text-foreground/80 mt-2 font-medium">
              <p>Name: Customer Grievance Cell, SN AttarWala</p>
              <p>Address: 137, Janjiker Street, Opp Central Restaurant, Near Crawford Market, Mumbai 400003</p>
              <p>Email: <a href="mailto:support@snattarwala.in" className="text-accent hover:underline">support@snattarwala.in</a></p>
              <p>Phone: +91 90823 77314</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}
