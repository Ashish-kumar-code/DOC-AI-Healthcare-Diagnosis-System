import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title = 'No data', description, action, actionLabel, actionIcon: ActionIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-secondary text-sm max-w-sm mb-6">{description}</p>}
      {action && (
        <button onClick={action} className="btn-primary">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel || 'Get Started'}
        </button>
      )}
    </motion.div>
  );
}
