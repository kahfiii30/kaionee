import { useState, useEffect } from 'react'
import { getRangeReport } from '../services/reportService'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import SummaryCard from '../components/SummaryCard'
import { formatCurrency, formatDate } from '../utils/format'
import { downloadCSV } from '../utils/csv'
import { FileText, Download } from 'lucide-react'

export default function Reports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  // Default to 7 days
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  
  const [startDate, setStartDate] = useState(lastWeek.toLocaleDateString('en-CA'))
  const [endDate, setEndDate] = useState(today.toLocaleDateString('en-CA'))

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getRangeReport(startDate, endDate)
      
      // Process data for table
      const processed = (res || []).map(day => {
        const pengeluaran = day.daily_expenses.reduce((s, e) => s + Number(e.amount), 0)
        const piutang = day.receivables.filter(r => r.status !== 'Lunas').reduce((s, r) => s + (Number(r.amount) - Number(r.paid_amount)), 0)
        const hutang = day.debts.filter(d => d.status !== 'Lunas').reduce((s, d) => s + (Number(d.amount) - Number(d.paid_amount)), 0)
        const rugi = day.losses.reduce((s, l) => s + Number(l.amount), 0) + pengeluaran
        const saldoBank = day.bank_accounts.reduce((s, b) => s + Number(b.closing_balance), 0)
        const stokMobil = day.vehicle_stocks.filter(v => v.vehicle_type === 'Mobil' && v.status !== 'Terjual').reduce((s, v) => s + Number(v.estimated_sell_price), 0)
        const stokMotor = day.vehicle_stocks.filter(v => v.vehicle_type === 'Motor' && v.status !== 'Terjual').reduce((s, v) => s + Number(v.estimated_sell_price), 0)
        const selisih = saldoBank + piutang + stokMobil + stokMotor - hutang - rugi

        return {
          date: day.date,
          pengeluaran,
          stokMobil,
          stokMotor,
          piutang,
          hutang,
          rugi,
          saldoBank,
          selisih
        }
      })
      setData(processed)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  const handleExport = () => {
    const exportData = data.map(d => ({
      'Tanggal': d.date,
      'Pengeluaran': d.pengeluaran,
      'Stok Mobil': d.stokMobil,
      'Stok Motor': d.stokMotor,
      'Piutang Aktif': d.piutang,
      'Hutang Aktif': d.hutang,
      'Total Rugi': d.rugi,
      'Saldo Bank': d.saldoBank,
      'Selisih Bersih': d.selisih
    }))
    downloadCSV(exportData, `Laporan_${startDate}_${endDate}.csv`)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Laporan & Export" 
        description="Analisis performa bisnis dan export ke CSV."
        action={
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-green-700">
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <SectionCard title="Filter Tanggal">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Mulai</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Sampai</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="p-2 border rounded-lg" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data Laporan">
        {loading ? <p>Loading...</p> : (
          <PremiumTable 
            columns={['Tanggal', 'Pengeluaran', 'Total Stok', 'Piutang', 'Hutang', 'Saldo Bank', 'Selisih']}
            data={data}
            renderRow={d => (
              <tr key={d.date}>
                <td className="p-3 text-sm font-medium">{formatDate(d.date)}</td>
                <td className="p-3 text-sm text-orange-600">{formatCurrency(d.pengeluaran)}</td>
                <td className="p-3 text-sm">{formatCurrency(d.stokMobil + d.stokMotor)}</td>
                <td className="p-3 text-sm text-emerald-600">{formatCurrency(d.piutang)}</td>
                <td className="p-3 text-sm text-red-600">{formatCurrency(d.hutang)}</td>
                <td className="p-3 text-sm text-blue-600 font-medium">{formatCurrency(d.saldoBank)}</td>
                <td className="p-3 text-sm font-bold">{formatCurrency(d.selisih)}</td>
              </tr>
            )}
          />
        )}
      </SectionCard>
    </div>
  )
}
