const fs = require('fs');
const path = require('path');

const stubs = [
  { route: 'categories', title: 'Fragrance Categories', desc: 'Manage Attars, Perfumes, and Bakhoor product categories.' },
  { route: 'returns', title: 'Returns & Refunds', desc: 'Process product returns and customer refund requests.' },
  { route: 'wishlist', title: 'Wishlist & Trends', desc: 'Monitor customer wishlists and trending fragrance searches.' },
  { route: 'campaigns', title: 'Marketing Campaigns', desc: 'Build and track multi-channel marketing campaigns for ATTARWALA.' },
  { route: 'content', title: 'Homepage Builder', desc: 'Control homepage sections, hero banners, and featured collections.' },
  { route: 'media', title: 'Media Library', desc: 'Manage product images, brand banners, and uploaded assets.' },
  { route: 'shipping', title: 'Shipping & Courier', desc: 'Configure shipping zones, delivery rates, and courier integrations.' },
  { route: 'payments', title: 'Payments & Transactions', desc: 'View Razorpay transaction logs and payment reconciliation.' },
  { route: 'support', title: 'Support Tickets', desc: 'Manage customer support tickets and fragrance consultation queries.' },
  { route: 'staff', title: 'Staff & Roles', desc: 'Manage admin staff accounts and granular permissions matrix.' },
  { route: 'audit-logs', title: 'Audit Trail', desc: 'Track all admin actions, system changes, and access logs.' }
];

stubs.forEach(({ route, title, desc }) => {
  const dir = path.join('src', 'app', '(admin)', 'admin', route);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'page.tsx');

  if (!fs.existsSync(file)) {
    const compName = route.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('') + 'Page';
    const content = [
      '"use client"',
      '',
      'import Link from "next/link"',
      'import { ArrowRight, Construction } from "lucide-react"',
      '',
      'export default function ' + compName + '() {',
      '  return (',
      '    <div className="space-y-6">',
      '      <div className="border-b border-border/50 pb-6">',
      '        <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Admin Panel</span>',
      '        <h1 className="font-heading text-3xl font-bold text-foreground">' + title + '</h1>',
      '        <p className="text-sm text-foreground/60 mt-1">' + desc + '</p>',
      '      </div>',
      '      <div className="bg-card border border-accent/30 rounded-lg p-12 text-center space-y-5">',
      '        <div className="w-16 h-16 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">',
      '          <Construction className="w-8 h-8 text-accent" />',
      '        </div>',
      '        <div>',
      '          <h2 className="font-heading font-bold text-xl text-foreground">' + title + ' Module</h2>',
      '          <p className="text-sm text-foreground/60 max-w-md mx-auto mt-2">' + desc + ' Full functionality is ready to be wired in production.</p>',
      '        </div>',
      '        <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors">',
      '          <span>Return to Dashboard</span>',
      '          <ArrowRight className="w-3.5 h-3.5" />',
      '        </Link>',
      '      </div>',
      '    </div>',
      '  )',
      '}'
    ].join('\n');

    fs.writeFileSync(file, content);
    console.log('Created: ' + file);
  } else {
    console.log('Exists, skip: ' + file);
  }
});

console.log('\nAll stub pages done!');
