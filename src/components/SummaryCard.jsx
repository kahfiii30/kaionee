import { motion } from 'framer-motion'

export default function SummaryCard({ title, value, subtitle, icon: Icon, colorClass = "text-blue-600", bgClass = "bg-blue-50", delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4 transition-colors"
    >
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1 leading-tight">{subtitle}</p>}
      </div>
    </motion.div>
  )
}
