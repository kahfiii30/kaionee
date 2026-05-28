import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, update } from '../services/receivableService'
import { getAccountsByDate, createTransaction } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import Badge from '../components/Badge'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import { ArrowDownToLine, Users, CheckCircle } from 'lucide-react'

export default function Receivables() {
  const { dateStr, isInitializing } = useActiveDate()
  const [data, setData] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ customer_name: '', description: '', amount: '', paid_amount: 0, status: 'Belum Dibayar', bank_account_id: '' })
  const [paymentForm, setPaymentForm] = useState({ id: null, amount: '', bank_account_id: '' })

  const loadData = async () => {
    setLoading(true)
    const res = await getByDate(dateStr)
    setData(res || [])
    const bks = await getAccountsByDate(dateStr)
    setBanks(bks || [])
    setLoading(false)
  }
  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await create({ ...form, date: dateStr, amount: Number(form.amount) })
    setForm({ ...form, customer_name: '', description: '', amount: '' })
    loadData()
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    const item = data.find(d => d.id === paymentForm.id)
    const payAmt = Number(paymentForm.amount)
    const newPaid = Number(item.paid_amount) + payAmt
    const status = newPaid >= Number(item.amount) ? 'Lunas' : 'Sebagian'
    
    await update(paymentForm.id, { paid_amount: newPaid, status })
    
    if (paymentForm.bank_account_id) {
      await createTransaction({
        date: dateStr, bank_account_id: paymentForm.bank_account_id,
        transaction_type: 'Masuk', category: 'Pembayaran Piutang',
        description: `Pembayaran dari ${item.customer_name}`, amount: payAmt
      })
    }
    setPaymentForm({ id: null, amount: '', bank_account_id: '' })
    loadData()
  }

  const total = calculateTotal(data, 'amount')
  const paid = calculateTotal(data, 'paid_amount')
  const sisa = total - paid

  return (
    <div className="space-y-6">
      <PageHeader title="Piutang (Tagihan ke Customer)" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Piutang" value={formatCurrency(total)} icon={ArrowDownToLine} />
        <SummaryCard title="Sudah Dibayar" value={formatCurrency(paid)} icon={CheckCircle} colorClass="text-green-600" bgClass="bg-green-50" />
        <SummaryCard title="Sisa Piutang" value={formatCurrency(sisa)} icon={ArrowDownToLine} colorClass="text-red-600" bgClass="bg-red-50" />
        <SummaryCard title="Jumlah Customer" value={data.length} icon={Users} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Tambah Piutang">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" placeholder="Nama Customer" value={form.customer_name} onChange={e=>setForm({...form, customer_name: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input required type="text" placeholder="Deskripsi" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input required type="number" placeholder="Nominal" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
              <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan</button>
            </form>
          </SectionCard>
          
          {paymentForm.id && (
             <SectionCard title="Terima Pembayaran">
               <form onSubmit={handlePayment} className="space-y-3">
                 <p className="text-sm font-medium">Customer: {data.find(d=>d.id===paymentForm.id)?.customer_name}</p>
                 <input required type="number" placeholder="Nominal Bayar" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
                 <select required value={paymentForm.bank_account_id} onChange={e=>setPaymentForm({...paymentForm, bank_account_id: e.target.value})} className="w-full p-2 border rounded-lg">
                    <option value="">-- Pilih Bank --</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                 </select>
                 <div className="flex gap-2">
                   <button type="button" onClick={() => setPaymentForm({id:null, amount:'', bank_account_id:''})} className="w-1/3 bg-gray-200 p-2 rounded-lg">Batal</button>
                   <button type="submit" className="w-2/3 bg-green-600 text-white p-2 rounded-lg">Proses</button>
                 </div>
               </form>
             </SectionCard>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <SectionCard title="Data Piutang">
             <PremiumTable 
                columns={['Customer', 'Deskripsi', 'Total', 'Dibayar', 'Sisa', 'Status', 'Aksi']}
                data={data}
                renderRow={item => (
                  <tr key={item.id}>
                    <td className="p-3 text-sm font-medium">{item.customer_name}</td>
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm">{formatCurrency(item.amount)}</td>
                    <td className="p-3 text-sm">{formatCurrency(item.paid_amount)}</td>
                    <td className="p-3 text-sm font-bold text-red-600">{formatCurrency(item.amount - item.paid_amount)}</td>
                    <td className="p-3 text-sm"><Badge status={item.status} /></td>
                    <td className="p-3 text-sm">
                      {item.status !== 'Lunas' && (
                        <button onClick={() => setPaymentForm({ ...paymentForm, id: item.id })} className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">Bayar</button>
                      )}
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
