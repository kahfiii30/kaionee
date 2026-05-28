import { motion } from 'framer-motion'

export default function SectionCard({ title, children, action, delay = 0.2 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  )
}
