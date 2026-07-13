import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" aria-label="DOC-AI Home">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {/* Dynamic Text Color: White when transparent at top, Dark Slate when scrolled */}
            <span className={`text-xl font-bold transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              DOC-AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              /* Dynamic Link Colors: Slates for light mode scroll, muted slate-200/white for dark top */
              <a 
                key={link.label} 
                href={link.href} 
                className={`text-sm font-medium transition-colors duration-300 ${
                  scrolled 
                    ? 'text-slate-600 hover:text-slate-900' 
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary btn-sm">
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                {/* Dynamic Sign In button style */}
                <Link 
                  to="/login" 
                  className={`btn-sm font-medium transition-colors duration-300 mr-2 ${
                    scrolled 
                      ? 'text-slate-600 hover:text-slate-900' 
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary btn-sm hover:!bg-white hover:!text-primary hover:!border-white border border-transparent transition-colors">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu Trigger */}
          <button 
            onClick={() => setMenuOpen(true)} 
            className={`md:hidden p-2 transition-colors duration-300 ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-200 hover:text-white'}`} 
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white border-l border-slate-200 z-50 p-6 flex flex-col md:hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-slate-900">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-600 hover:text-slate-900" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-2 flex-1" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline w-full justify-center border-slate-200 text-slate-700 hover:bg-slate-50">Sign In</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center hover:!bg-white hover:!text-primary hover:!border-white border border-transparent transition-colors">Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}