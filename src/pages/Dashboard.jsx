import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getDailySummary } from '../services/reportService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import { formatCurrency } from '../utils/format'
import { Wallet, Car, ArrowDownToLine, ArrowUpFromLine, TrendingDown, Landmark, DollarSign, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

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
  const totalRugi = totalRugiManual // Pengeluaran harian dipisah dari kerugian manual karena langsung memotong total saldo bank

  const saldoBankKotor = data.banks.reduce((sum, b) => sum + Number(b.closing_balance), 0)
  
  // Hitung penyesuaian dari transaksi global (Hutang/Piutang yang dibayar tanpa pilih bank)
  const netGlobalTransactions = (data.globalTransactions || []).reduce((sum, tx) => {
    return tx.transaction_type === 'Masuk' ? sum + Number(tx.amount) : sum - Number(tx.amount)
  }, 0)

  const totalSaldoBank = saldoBankKotor - totalPengeluaran + netGlobalTransactions

  const totalSaldoKeseluruhan = totalSaldoBank + piutangAktif + totalStokMobil + totalStokMotor - hutangAktif - totalRugi
  
  const subtitleMath = `Kas: ${formatCurrency(saldoBankKotor)} - Pengeluaran: ${formatCurrency(totalPengeluaran)}${netGlobalTransactions ? ` + Global Tx: ${formatCurrency(netGlobalTransactions)}` : ''}`

  // Data for Recharts
  const chartData = [
    { name: 'Saldo Bank', value: totalSaldoBank > 0 ? totalSaldoBank : 0, fill: '#3b82f6' }, // blue-500
    { name: 'Piutang', value: piutangAktif > 0 ? piutangAktif : 0, fill: '#10b981' }, // emerald-500
    { name: 'Stok Kendaraan', value: (totalStokMobil + totalStokMotor) > 0 ? (totalStokMobil + totalStokMotor) : 0, fill: '#6366f1' }, // indigo-500
    { name: 'Hutang', value: hutangAktif > 0 ? hutangAktif : 0, fill: '#f43f5e' }, // rose-500
    { name: 'Rugi & Pengeluaran', value: totalRugi > 0 ? totalRugi : 0, fill: '#f97316' }, // orange-500
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Ringkasan posisi keuangan dan aset hari ini."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Saldo Bank" value={formatCurrency(totalSaldoBank)} subtitle={subtitleMath} icon={Landmark} colorClass="text-blue-600" bgClass="bg-blue-50" delay={0.1} />
        <SummaryCard title="Total Saldo Keseluruhan" value={formatCurrency(totalSaldoKeseluruhan)} icon={Activity} colorClass={totalSaldoKeseluruhan >= 0 ? "text-green-600" : "text-red-600"} bgClass={totalSaldoKeseluruhan >= 0 ? "bg-green-50" : "bg-red-50"} delay={0.2} />
        <SummaryCard title="Piutang Aktif" value={formatCurrency(piutangAktif)} icon={ArrowDownToLine} colorClass="text-emerald-600" bgClass="bg-emerald-50" delay={0.3} />
        <SummaryCard title="Hutang Aktif" value={formatCurrency(hutangAktif)} icon={ArrowUpFromLine} colorClass="text-rose-600" bgClass="bg-rose-50" delay={0.4} />
        
        <SummaryCard title="Stok Mobil" value={formatCurrency(totalStokMobil)} icon={Car} colorClass="text-indigo-600" bgClass="bg-indigo-50" delay={0.5} />
        <SummaryCard title="Stok Motor" value={formatCurrency(totalStokMotor)} icon={Car} colorClass="text-indigo-600" bgClass="bg-indigo-50" delay={0.6} />
        <SummaryCard title="Total Pengeluaran" value={formatCurrency(totalPengeluaran)} icon={Wallet} colorClass="text-orange-600" bgClass="bg-orange-50" delay={0.7} />
        <SummaryCard title="Total Rugi Keseluruhan" value={formatCurrency(totalRugi)} icon={TrendingDown} colorClass="text-red-600" bgClass="bg-red-50" delay={0.8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Distribusi Aset & Kewajiban" delay={0.4}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 mt-2">
            {chartData.length > 0 ? (
              <>
                <div className="h-64 w-full md:w-1/2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-md hover:opacity-80 transition-all duration-300 cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
                                <p className="text-sm text-gray-500 font-medium mb-1">{payload[0].name}</p>
                                <p className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
                                  {formatCurrency(payload[0].value)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Bersih</span>
                    <span className={`text-xl font-bold ${totalSaldoKeseluruhan >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalSaldoKeseluruhan >= 0 ? '+' : ''}{(totalSaldoKeseluruhan / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <ul className="space-y-4">
                    {chartData.map((entry, index) => (
                      <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.fill }}></div>
                          <span className="text-gray-600 font-medium text-sm">{entry.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(entry.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 w-full">Tidak ada data untuk ditampilkan</div>
            )}
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
