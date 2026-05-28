import ActiveDatePicker from './ActiveDatePicker'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-end gap-4">
        <ActiveDatePicker />
      </div>
    </header>
  )
}
