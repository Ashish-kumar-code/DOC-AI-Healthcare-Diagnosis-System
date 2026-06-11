import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../utils/animations';

export function Timeline({ items = [] }) {
  if (!items.length) return null;
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border" />
      {items.map((item, i) => (
        <motion.div key={item.id || i} variants={staggerItem} className="relative pb-6 last:pb-0">
          {/* Dot */}
          <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center ${
            item.color === 'success' ? 'bg-success' :
            item.color === 'warning' ? 'bg-warning' :
            item.color === 'danger' ? 'bg-danger' : 'bg-primary'
          }`}>
            {item.icon && <item.icon className="w-3 h-3 text-text-primary" />}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-text-primary">{item.title}</p>
            {item.description && <p className="text-sm text-text-secondary mt-0.5">{item.description}</p>}
            {item.date && <p className="text-xs text-text-tertiary mt-1">{item.date}</p>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
