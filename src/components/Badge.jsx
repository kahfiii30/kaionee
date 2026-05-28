export default function Badge({ status }) {
  const colors = {
    'Lunas': 'bg-green-100 text-green-800',
    'Sebagian': 'bg-yellow-100 text-yellow-800',
    'Belum Dibayar': 'bg-red-100 text-red-800',
    'Ready': 'bg-green-100 text-green-800',
    'Booking': 'bg-blue-100 text-blue-800',
    'Terjual': 'bg-gray-100 text-gray-800',
    'Servis': 'bg-orange-100 text-orange-800'
  }
  const color = colors[status] || 'bg-gray-100 text-gray-800'
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}
