import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, ScanLine, FileText, BarChart3, MapPin, Brain, Upload, CheckCircle, Star, Heart, Shield, Zap, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';

const features = [
  { icon: Stethoscope, title: 'AI Text Analysis', desc: 'Describe symptoms and get instant AI-powered diagnosis with confidence scores.', color: 'from-primary/20 to-primary/5' },
  { icon: ScanLine, title: 'Medical Image Analysis', desc: 'Upload X-rays, MRIs, and CT scans for deep learning-based analysis.', color: 'from-secondary/20 to-secondary/5' },
  { icon: FileText, title: 'Smart Reports', desc: 'Generate professional PDF reports with detailed findings and recommendations.', color: 'from-success/20 to-success/5' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track health trends with interactive charts and dashboards.', color: 'from-warning/20 to-warning/5' },
  { icon: MapPin, title: 'Nearby Facilities', desc: 'Find hospitals, clinics, and pharmacies near your location instantly.', color: 'from-danger/20 to-danger/5' },
  { icon: Brain, title: 'Multi-modal Diagnosis', desc: 'Combine text and image analysis for comprehensive medical insights.', color: 'from-primary/20 to-secondary/5' },
];

const steps = [
  { icon: Upload, num: '01', title: 'Upload Your Report', desc: 'Upload medical images or describe your symptoms in detail.' },
  { icon: Brain, num: '02', title: 'AI Analysis', desc: 'Our ML models analyze your data in seconds with high accuracy.' },
  { icon: CheckCircle, num: '03', title: 'Get Results', desc: 'Receive detailed diagnosis with confidence scores and recommendations.' },
];

const testimonials = [
  { name: 'Dr. Riya Kumari', role: 'Radiologist', quote: 'DOC-AI has transformed our diagnostic workflow. The accuracy of chest X-ray analysis is remarkable.', initials: 'SC' },
  { name: 'Dr. Mukesh Kumar Yadav', role: 'General Practitioner', quote: 'The multi-modal diagnosis gives us comprehensive insights we couldn\'t get before. A game changer.', initials: 'MP' },
  { name: 'Dr. sohel Shakib', role: 'Emergency Medicine', quote: 'Instant analysis helps us make faster decisions in critical situations. Highly reliable.', initials: 'PS' },
];

const stats = [
  { value: '10,000+', label: 'Diagnosis Made', valColor: 'text-secondary', lblColor: 'text-secondary-400' },
  { value: '95%', label: 'Accuracy Rate', valColor: 'text-warning', lblColor: 'text-warning-400 font-medium' },
  { value: '24/7', label: 'Availability', valColor: 'text-white', lblColor: 'text-slate-400' },
  { value: 'HIPAA', label: 'Ready', valColor: 'text-white', lblColor: 'text-slate-400' },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    /* Changed global background to white */
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO: Implemented the Dark Blue to White transition gradient here */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-gradient-to-b from-slate-950 via-slate-900 to-white">
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        
        {/* Softened ambient blur animations for light transition compatibility */}
        <motion.div className="absolute top-32 left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" animate={{ y: [-30, 30, -30] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-20 right-[10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" animate={{ y: [30, -30, 30] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary-200 text-sm font-medium mb-8">
              <Zap className="w-4 h-4 text-primary-400" /> Powered by Advanced Machine Learning
            </div>
            
            {/* Kept text highly visible on the dark blue top header */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-white">
              AI-Powered<br />
              <span className="gradient-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">HealthCare Diagnosis Platform</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Advanced machine learning for instant, accurate health insights. Upload reports, describe symptoms, and get AI-powered predictions in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? '/dashboard' : '/register'} className="btn-primary btn-lg shadow-lg shadow-primary/20 hover:!bg-white hover:!text-primary hover:!border-white border border-transparent transition-colors ">
                {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn-outline btn-lg text-white border-white/30 hover:!bg-primary hover:!text-white hover:!border-primary transition-colors">Learn More</a>
            </div>
          </motion.div>  

          {/* Stats: Adjusted styling for the bottom of hero section near the transition point */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/50">
                <div className={`text-2xl sm:text-3xl font-bold ${s.valColor}`}>{s.value}</div>
                <div className={`text-sm ${s.lblColor} mt-1`}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES: White background area starts here */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Everything you need for AI-powered medical diagnosis, built with cutting-edge technology.</p>
        </motion.div>
        <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <motion.div key={title} variants={staggerItem} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Get your diagnosis in three simple steps.</p>
        </motion.div>
        <motion.div className="grid md:grid-cols-3 gap-8" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          {steps.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div key={num} variants={staggerItem} className="text-center relative">
              {i < 2 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/20 to-transparent" />}
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5 border border-primary-100">
                <Icon className="w-7 h-7 text-primary-600" />
              </div>
              <span className="text-xs font-bold text-primary-600 tracking-widest">{num}</span>
              <h3 className="text-lg font-semibold text-slate-900 mt-2 mb-2">{title}</h3>
              <p className="text-sm text-slate-600">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Trusted by Professionals</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Healthcare professionals rely on DOC-AI for accurate, fast diagnosis.</p>
        </motion.div>
        <motion.div className="grid md:grid-cols-3 gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={staggerItem} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">{t.initials}</div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center relative overflow-hidden rounded-3xl p-12 sm:p-16 bg-gradient-to-br from-slate-950 to-slate-900 shadow-xl">
          <div className="absolute inset-0 bg-dot-pattern opacity-10" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform Your Diagnosis?</h2>
            <p className="text-slate-300 max-w-lg mx-auto mb-8">Join thousands of healthcare professionals using AI-powered diagnosis.</p>
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary btn-lg shadow-lg shadow-primary/20 hover:!bg-white hover:!text-primary hover:!border-white border border-transparent transition-colors">
              {user ? 'Go to Dashboard' : 'Start Free Today'} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-12 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"><Brain className="w-4 h-4 text-white" /></div>
              <span className="text-lg font-bold text-slate-900">DOC-AI</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">AI-powered medical diagnosis system for healthcare professionals.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'API', 'Documentation'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">{col.links.map((l) => <li key={l}><span className="text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">{l}</span></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2025 DOC-AI. All rights reserved.</p>
          <p className="text-sm text-slate-500 flex items-center gap-1">Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for better healthcare</p>
        </div>
      </footer>
    </div>
  );
}