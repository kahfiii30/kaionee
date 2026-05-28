import CurrencyInput from '../components/CurrencyInput'
import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, remove } from '../services/lossService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import ConfirmModal from '../components/ConfirmModal'
import { TrendingDown, Trash2 } from 'lucide-react'

export default function Losses() {
  const { dateStr, isInitializing } = useActiveDate()
  const [losses, setLosses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ category: 'Diskon', description: '', amount: '' })
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const loadData = async () => {
    setLoading(true)
    const data = await getByDate(dateStr)
    setLosses(data || [])
    setLoading(false)
  }

  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await create({ ...form, date: dateStr, amount: Number(form.amount) })
    setForm({ ...form, description: '', amount: '' })
    loadData()
  }

  const handleDelete = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Kerugian',
      message: 'Apakah Anda yakin ingin menghapus data kerugian ini?',
      onConfirm: async () => {
        try {
          await remove(id)
          loadData()
        } catch (e) {
          console.error(e)
          alert("Gagal menghapus data")
        }
      }
    })
  }

  const total = calculateTotal(losses, 'amount')

  return (
    <div className="space-y-6">
      <PageHeader title="Total Rugi" description="Pencatatan rugi manual (misal diskon, kerusakan aset)." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Rugi Manual Hari Ini" value={formatCurrency(total)} icon={TrendingDown} colorClass="text-red-600" bgClass="bg-red-50" />
        <SummaryCard title="Jumlah Item Rugi" value={losses.length} icon={TrendingDown} colorClass="text-orange-600" bgClass="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SectionCard title="Tambah Kerugian">
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="Diskon">Diskon Unit</option>
                <option value="Kerusakan">Kerusakan Aset</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <input required type="text" placeholder="Deskripsi" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
              <CurrencyInput required placeholder="Nominal" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
              <button className="w-full bg-red-600 text-white p-2 rounded-lg">Simpan</button>
            </form>
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Data Rugi Manual">
            <PremiumTable 
              columns={['Kategori', 'Deskripsi', 'Sumber', 'Nominal', 'Aksi']}
              data={losses}
              renderRow={l => (
                <tr key={l.id}>
                  <td className="p-3 text-sm">{l.category}</td>
                  <td className="p-3 text-sm font-medium">{l.description}</td>
                  <td className="p-3 text-sm">{l.source}</td>
                  <td className="p-3 text-sm font-bold text-red-600">{formatCurrency(l.amount)}</td>
                  <td className="p-3 text-sm">
                    <button onClick={() => handleDelete(l.id)} className="text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )}
            />
          </SectionCard>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  )
}
