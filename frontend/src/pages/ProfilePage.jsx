import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Activity, FileText, Settings } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { StatsCard } from '../components/data/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getInitials, formatDate } from '../utils/formatters';
import { fadeInUp } from '../utils/animations';

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-8">
            {/* Profile Card */}
            <div className="card-static relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent h-24" />
              <div className="relative flex flex-col sm:flex-row items-center gap-6 pt-8 sm:pt-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-text-primary shadow-lg">
                  {getInitials(user?.name)}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-text-primary">{user?.name || 'User'}</h1>
                  <p className="text-text-secondary">{user?.email}</p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary-300 rounded-full">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Full Name', value: user?.name, icon: User },
                { label: 'Email', value: user?.email, icon: Mail },
                { label: 'Age', value: user?.age || 'Not set', icon: Calendar },
                { label: 'Gender', value: user?.gender || 'Not set', icon: User },
                { label: 'Member Since', value: formatDate(user?.created_at) || 'N/A', icon: Calendar },
                { label: 'Account Status', value: 'Active', icon: Shield },
              ].map((item) => (
                <div key={item.label} className="card-static flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-text-tertiary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}