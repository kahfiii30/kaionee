import { useActiveDate } from '../context/ActiveDateContext'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function ActiveDatePicker() {
  const { activeDate, setActiveDate, isInitializing } = useActiveDate()

  const handlePrevDay = () => {
    const newDate = new Date(activeDate)
    newDate.setDate(activeDate.getDate() - 1)
    setActiveDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(activeDate)
    newDate.setDate(activeDate.getDate() + 1)
    setActiveDate(newDate)
  }

  const handleToday = () => {
    setActiveDate(new Date())
  }

  const formattedDate = activeDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const todayStr = new Date().toLocaleDateString('en-CA')
  const activeStr = activeDate.toLocaleDateString('en-CA')
  const isToday = activeStr >= todayStr

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-sm">
      <button 
        onClick={handlePrevDay}
        disabled={isInitializing}
        className="p-1.5 text-gray-500 hover:text-navy-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-2 px-3 py-1 font-medium text-sm text-navy-900 min-w-[200px] justify-center">
        <CalendarIcon size={16} className="text-blue-600" />
        {isInitializing ? (
          <span className="animate-pulse">Memuat data...</span>
        ) : (
          <span>{formattedDate}</span>
        )}
      </div>

      <button 
        onClick={handleNextDay}
        disabled={isInitializing || isToday}
        className="p-1.5 text-gray-500 hover:text-navy-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
      >
        <ChevronRight size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        onClick={handleToday}
        disabled={isInitializing || isToday}
        className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
      >
        Hari Ini
      </button>
    </div>
  )
}
