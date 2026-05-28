import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getDailySummary } from '../services/reportService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import { formatCurrency } from '../utils/format'
import { Wallet, Car, ArrowDownToLine, ArrowUpFromLine, TrendingDown, Landmark, DollarSign, Activity } from 'lucide-react'

export default function Dashboard() {
  const { dateStr, isInitializing } = useActiveDate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isInitializing) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const summary = await getDailySummary(dateStr)
        setData(summary)
      } catch (error) {
        console.error('Failed to load dashboard', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateStr, isInitializing])

  if (isInitializing || loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">Memuat dashboard...</div>
  }

  // Calculate totals
  const totalPengeluaran = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  const totalStokMobil = data.vehicles
    .filter(v => v.vehicle_type === 'Mobil' && v.status !== 'Terjual')
    .reduce((sum, v) => sum + Number(v.estimated_sell_price), 0)
    
  const totalStokMotor = data.vehicles
    .filter(v => v.vehicle_type === 'Motor' && v.status !== 'Terjual')
    .reduce((sum, v) => sum + Number(v.estimated_sell_price), 0)

  const piutangAktif = data.receivables
    .filter(r => r.status !== 'Lunas')
    .reduce((sum, r) => sum + (Number(r.amount) - Number(r.paid_amount)), 0)

  const hutangAktif = data.debts
    .filter(d => d.status !== 'Lunas')
    .reduce((sum, d) => sum + (Number(d.amount) - Number(d.paid_amount)), 0)

  const totalRugiManual = data.losses.reduce((sum, l) => sum + Number(l.amount), 0)
  const totalRugi = totalRugiManual + totalPengeluaran

  const totalSaldoBank = data.banks.reduce((sum, b) => sum + Number(b.closing_balance), 0)

  const selisihBersih = totalSaldoBank + piutangAktif + totalStokMobil + totalStokMotor - hutangAktif - totalRugi

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Ringkasan posisi keuangan dan aset hari ini."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Saldo Bank" value={formatCurrency(totalSaldoBank)} icon={Landmark} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <SummaryCard title="Selisih Bersih" value={formatCurrency(selisihBersih)} icon={Activity} colorClass={selisihBersih >= 0 ? "text-green-600" : "text-red-600"} bgClass={selisihBersih >= 0 ? "bg-green-50" : "bg-red-50"} />
        <SummaryCard title="Piutang Aktif" value={formatCurrency(piutangAktif)} icon={ArrowDownToLine} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="Hutang Aktif" value={formatCurrency(hutangAktif)} icon={ArrowUpFromLine} colorClass="text-rose-600" bgClass="bg-rose-50" />
        
        <SummaryCard title="Stok Mobil" value={formatCurrency(totalStokMobil)} icon={Car} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <SummaryCard title="Stok Motor" value={formatCurrency(totalStokMotor)} icon={Car} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <SummaryCard title="Total Pengeluaran" value={formatCurrency(totalPengeluaran)} icon={Wallet} colorClass="text-orange-600" bgClass="bg-orange-50" />
        <SummaryCard title="Total Rugi Keseluruhan" value={formatCurrency(totalRugi)} icon={TrendingDown} colorClass="text-red-600" bgClass="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Status Aset & Kewajiban">
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            [Area Chart/Grafik akan dirender disini]
          </div>
        </SectionCard>
        
        <SectionCard title="Ringkasan Data">
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Kendaraan (Ready/Booking)</span>
                <span className="font-bold text-navy-900">{data.vehicles.filter(v => v.status !== 'Terjual').length} Unit</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Invoice Piutang Aktif</span>
                <span className="font-bold text-navy-900">{data.receivables.filter(r => r.status !== 'Lunas').length} Transaksi</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tagihan Hutang Aktif</span>
                <span className="font-bold text-navy-900">{data.debts.filter(d => d.status !== 'Lunas').length} Transaksi</span>
             </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
