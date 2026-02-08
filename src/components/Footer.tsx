import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Send, Instagram, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import examtrackerIcon from '@/assets/examtracker-icon.png';

export const Footer: React.FC = () => {
  const isMobile = useIsMobile();
  const { isIndia } = useCountryDetection();

  const footerLinks = isIndia
    ? [
        {
          title: 'Exam Categories',
          links: [
            { name: 'Banking Exams', href: '/banking-exams' },
            { name: 'Government Exams', href: '/government-exams' },
            { name: 'Teaching Exams', href: '/teaching-exams' },
            { name: 'All Exams', href: '/exams' },
          ],
        },
        {
          title: 'Company',
          links: [
            { name: 'Contact Us', href: '/contact' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Refund Policy', href: '/refund' },
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
      ]
    : [
        {
          title: 'Exam Categories',
          links: [
            { name: 'Academic Exams', href: '/exams' },
            { name: 'Professional Certifications', href: '/exams' },
            { name: 'Language Tests', href: '/exams' },
            { name: 'All Exams', href: '/exams' },
          ],
        },
        {
          title: 'Company',
          links: [
            { name: 'Contact Us', href: '/contact' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Refund Policy', href: '/refund' },
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

  const footerDescription = isIndia
    ? "ExamTracker is India's #1 exam tracker app for government and competitive exam preparation. Track your syllabus topic-wise, monitor preparation progress, and study smarter for IBPS, SSC, UPSC, JEE, NEET, CTET and 150+ exams."
    : "ExamTracker is the #1 exam tracker app worldwide. Track your syllabus topic-wise, monitor preparation progress, and study smarter for SAT, GRE, GMAT, IELTS, TOEFL, CFA, PMP, and 100+ global exams and certifications.";

  return (
    <footer className={`bg-gradient-to-br from-accent via-background to-accent/50 border-t border-border/50 backdrop-blur-sm mt-16 ${isMobile ? 'mb-16' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SEO-friendly footer description */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {footerDescription}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <img src={examtrackerIcon} alt="ExamTracker" className="h-10 w-10 rounded-lg group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ExamTracker</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
            ExamTracker – Track Your Exam Progress & Study Smarter
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
              © 2025 ExamTracker. All rights reserved.
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
