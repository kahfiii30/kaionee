import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, remove, update } from '../services/vehicleStockService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import Badge from '../components/Badge'
import { formatCurrency } from '../utils/format'; import { calculateTotal, calculateProfit } from '../utils/calculations'
import { Car, TrendingUp, Tags } from 'lucide-react'
import { calculateProfit as utilCalculateProfit } from '../utils/calculations' // fixed import

export default function VehicleStock() {
  const { dateStr, isInitializing } = useActiveDate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  const initialForm = { vehicle_type: 'Mobil', brand: '', model: '', plate_number: '', year: '', status: 'Ready', purchase_price: '', estimated_sell_price: '', sell_price: '', note: '' }
  const [form, setForm] = useState(initialForm)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getByDate(dateStr)
      setVehicles(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await create({
        ...form,
        date: dateStr,
        year: form.year ? Number(form.year) : null,
        purchase_price: Number(form.purchase_price) || 0,
        estimated_sell_price: Number(form.estimated_sell_price) || 0,
        sell_price: Number(form.sell_price) || 0
      })
      setForm(initialForm)
      loadData()
    } catch (err) { alert("Gagal") }
  }

  const handleStatusChange = async (id, newStatus) => {
    await update(id, { status: newStatus })
    loadData()
  }

  const activeVehicles = vehicles.filter(v => v.status !== 'Terjual')
  const totalModal = calculateTotal(activeVehicles, 'purchase_price')
  const totalEstimasi = calculateTotal(activeVehicles, 'estimated_sell_price')

  return (
    <div className="space-y-6">
      <PageHeader title="Stok Mobil & Motor" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Unit Aktif" value={activeVehicles.length} icon={Car} />
        <SummaryCard title="Total Modal" value={formatCurrency(totalModal)} icon={Tags} colorClass="text-orange-600" bgClass="bg-orange-50" />
        <SummaryCard title="Estimasi Nilai Jual" value={formatCurrency(totalEstimasi)} icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="Potensi Margin" value={formatCurrency(totalEstimasi - totalModal)} icon={TrendingUp} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SectionCard title="Tambah Kendaraan">
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.vehicle_type} onChange={e=>setForm({...form, vehicle_type: e.target.value})} className="w-full p-2 border rounded-lg"><option value="Mobil">Mobil</option><option value="Motor">Motor</option></select>
              <input type="text" placeholder="Brand (Toyota)" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="text" required placeholder="Model (Avanza)" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="text" placeholder="Plat (B 1234 XX)" value={form.plate_number} onChange={e=>setForm({...form, plate_number: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="number" placeholder="Harga Modal" required value={form.purchase_price} onChange={e=>setForm({...form, purchase_price: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="number" placeholder="Estimasi Jual" required value={form.estimated_sell_price} onChange={e=>setForm({...form, estimated_sell_price: e.target.value})} className="w-full p-2 border rounded-lg" />
              <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="Ready">Ready</option><option value="Booking">Booking</option><option value="Servis">Servis</option>
              </select>
              <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan</button>
            </form>
          </SectionCard>
        </div>
        <div className="lg:col-span-3">
          <SectionCard title="Data Kendaraan">
             <PremiumTable 
                columns={['Kendaraan', 'Plat', 'Status', 'Modal', 'Estimasi Jual', 'Margin', 'Aksi']}
                data={vehicles}
                renderRow={v => (
                  <tr key={v.id}>
                    <td className="p-3 text-sm font-medium">{v.brand} {v.model}</td>
                    <td className="p-3 text-sm">{v.plate_number}</td>
                    <td className="p-3 text-sm"><Badge status={v.status} /></td>
                    <td className="p-3 text-sm">{formatCurrency(v.purchase_price)}</td>
                    <td className="p-3 text-sm">{formatCurrency(v.estimated_sell_price)}</td>
                    <td className="p-3 text-sm font-semibold text-green-600">{formatCurrency(utilCalculateProfit(v.estimated_sell_price, v.purchase_price))}</td>
                    <td className="p-3 text-sm">
                      <select value={v.status} onChange={(e) => handleStatusChange(v.id, e.target.value)} className="text-xs border rounded p-1">
                        <option value="Ready">Ready</option><option value="Booking">Booking</option><option value="Terjual">Terjual</option><option value="Servis">Servis</option>
                      </select>
                    </td>
                  </tr>
                )}
             />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
