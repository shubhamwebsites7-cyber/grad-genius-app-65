import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Youtube, Send, Instagram, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const Footer: React.FC = () => {
  const isMobile = useIsMobile();

  const footerLinks = [
    {
      title: 'Company',
      links: [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Refund & Cancellation Policy', href: '/refund' },
      ],
    },
    {
      title: 'Social Media',
      links: [
        { name: 'YouTube', href: 'https://www.youtube.com/@ExamTrakr', icon: Youtube },
        { name: 'Telegram', href: 'https://t.me/Examtrakr', icon: Send },
        { name: 'Instagram', href: 'https://www.instagram.com/examtrakr/', icon: Instagram },
        { name: 'WhatsApp', href: 'https://wa.me/919302418061', icon: MessageCircle },
      ],
    },
  ];

  return (
    <footer className={`bg-gradient-to-br from-accent via-background to-accent/50 border-t border-border/50 backdrop-blur-sm mt-16 ${isMobile ? 'mb-16' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Examtrakr</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered exam preparation platform trusted by 50,000+ students to track progress and achieve academic excellence.
            </p>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isExternal = link.href.startsWith('http');
                  return (
                    <li key={link.name}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group gap-2"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group gap-2"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Examtrakr. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                Made with <span className="text-destructive">❤️</span> for students
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};