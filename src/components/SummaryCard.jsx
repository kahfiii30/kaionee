export default function SummaryCard({ title, value, icon: Icon, colorClass = "text-blue-600", bgClass = "bg-blue-50" }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
