import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/animations';

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}
