import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DailyExpenses from './pages/DailyExpenses'
import VehicleStock from './pages/VehicleStock'
import Receivables from './pages/Receivables'
import Debts from './pages/Debts'
import Losses from './pages/Losses'
import BankDashboard from './pages/BankDashboard'
import Reports from './pages/Reports'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily-expenses" element={<DailyExpenses />} />
          <Route path="/vehicle-stock" element={<VehicleStock />} />
          <Route path="/receivables" element={<Receivables />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/losses" element={<Losses />} />
          <Route path="/bank-dashboard" element={<BankDashboard />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
