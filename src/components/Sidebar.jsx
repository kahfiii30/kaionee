import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  Car, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  TrendingDown,
  Landmark,
  FileText
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pengeluaran Harian', path: '/daily-expenses', icon: Wallet },
  { name: 'Stok Mobil & Motor', path: '/vehicle-stock', icon: Car },
  { name: 'Piutang', path: '/receivables', icon: ArrowDownToLine },
  { name: 'Hutang', path: '/debts', icon: ArrowUpFromLine },
  { name: 'Total Rugi', path: '/losses', icon: TrendingDown },
  { name: 'Dashboard Bank', path: '/bank-dashboard', icon: Landmark },
  { name: 'Laporan', path: '/reports', icon: FileText },
]

export default function Sidebar({ onClose }) {
  return (
    <div className="flex h-full w-64 flex-col bg-navy-900 text-white shadow-xl">
      <div className="flex h-16 items-center px-6 border-b border-navy-800">
        <h1 className="text-xl font-bold tracking-wider text-white">PROJECT 6</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
