import CurrencyInput from '../components/CurrencyInput'
import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, remove } from '../services/expenseService'
import { getAccountsByDate, createTransaction } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import { formatCurrency } from '../utils/format'
import ConfirmModal from '../components/ConfirmModal'
import { Wallet, Receipt, CreditCard, Trash2 } from 'lucide-react'

export default function DailyExpenses() {
  const { dateStr, isInitializing } = useActiveDate()
  const [expenses, setExpenses] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ category: 'Operasional', description: '', amount: '', payment_method: 'Tunai', bank_account_id: '' })
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const loadData = async () => {
    setLoading(true)
    try {
      const exps = await getByDate(dateStr)
      setExpenses(exps || [])
      const bks = await getAccountsByDate(dateStr)
      setBanks(bks || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isInitializing) loadData()
  }, [dateStr, isInitializing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.amount) return
    
    try {
      const newExp = await create({
        date: dateStr,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        payment_method: form.payment_method
      })
      setForm({ ...form, description: '', amount: '' })
      loadData()
    } catch (err) {
      console.error(err)
      alert("Gagal menyimpan data")
    }
  }

  const handleDelete = async (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Pengeluaran',
      message: 'Apakah Anda yakin ingin menghapus catatan pengeluaran ini?',
      onConfirm: async () => {
        try {
          await remove(id)
          loadData()
        } catch (e) {
          console.error(e)
          alert("Gagal menghapus pengeluaran")
        }
      }
    })
  }

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  if (isInitializing) return <div className="animate-pulse">Loading...</div>

  return (
    <div className="space-y-6">
      <PageHeader title="Pengeluaran Harian" description="Catat operasional harian." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Pengeluaran" value={formatCurrency(totalAmount)} icon={Wallet} delay={0.1} />
        <SummaryCard title="Jumlah Transaksi" value={expenses.length} icon={Receipt} colorClass="text-indigo-600" bgClass="bg-indigo-50" delay={0.2} />
        <SummaryCard title="Rata-rata Transaksi" value={formatCurrency(expenses.length ? totalAmount / expenses.length : 0)} icon={CreditCard} colorClass="text-emerald-600" bgClass="bg-emerald-50" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SectionCard title="Tambah Pengeluaran" delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border">
                  <option value="Operasional">Operasional</option>
                  <option value="Iklan">Iklan</option>
                  <option value="Servis">Servis</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                <CurrencyInput required min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700">Simpan</button>
            </form>
          </SectionCard>
        </div>
        
        <div className="lg:col-span-2">
          <SectionCard title="Data Pengeluaran" delay={0.4}>
            {loading ? <p>Loading data...</p> : (
              <PremiumTable 
                columns={['Kategori', 'Deskripsi', 'Nominal', 'Aksi']}
                data={expenses}
                renderRow={(item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )}
              />
            )}
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
