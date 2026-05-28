import CurrencyInput from '../components/CurrencyInput'
import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, update } from '../services/receivableService'
import { getAccountsByDate, createTransaction, getTransactionsByCategory } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import Badge from '../components/Badge'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import { ArrowDownToLine, Users, CheckCircle, Search, History } from 'lucide-react'

export default function Receivables() {
  const { dateStr, isInitializing } = useActiveDate()
  const [data, setData] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ customer_name: '', description: '', amount: '', paid_amount: 0, status: 'Belum Dibayar', bank_account_id: '' })
  const [paymentForm, setPaymentForm] = useState({ id: null, amount: '', bank_account_id: '' })
  
  const [historyData, setHistoryData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await getByDate(dateStr)
    setData(res || [])
    const bks = await getAccountsByDate(dateStr)
    setBanks(bks || [])
    
    // Fetch histori pembayaran piutang
    const history = await getTransactionsByCategory('Pembayaran Piutang')
    setHistoryData(history || [])
    
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
    
    await createTransaction({
      date: dateStr, bank_account_id: null,
      transaction_type: 'Masuk', category: 'Pembayaran Piutang',
      description: `Pembayaran dari ${item.customer_name}`, amount: payAmt
    })
    
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
              <CurrencyInput required placeholder="Nominal" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
              <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan</button>
            </form>
          </SectionCard>

          
          {paymentForm.id && (
             <SectionCard title="Terima Pembayaran">
               <form onSubmit={handlePayment} className="space-y-3">
                 <p className="text-sm font-medium">Customer: {data.find(d=>d.id===paymentForm.id)?.customer_name}</p>
                 <CurrencyInput required placeholder="Nominal Bayar" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
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
                columns={['Customer', 'Deskripsi', 'Total', 'Status', 'Aksi']}
                data={data}
                renderRow={item => (
                  <tr key={item.id}>
                    <td className="p-3 text-sm font-medium">{item.customer_name}</td>
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</td>
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

          <div className="mt-6">
             <SectionCard title="Histori Pembayaran Piutang">
               <div className="mb-4 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search size={18} className="text-gray-400" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Cari berdasarkan nama customer atau deskripsi..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                 />
               </div>
               
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                 {historyData
                   .filter(h => h.description.toLowerCase().includes(searchQuery.toLowerCase()))
                   .map(log => (
                     <div key={log.id} className="flex justify-between items-start p-4 bg-white border border-gray-100 shadow-sm rounded-xl hover:border-blue-200 transition-colors">
                       <div className="flex gap-4">
                         <div className="mt-1 bg-green-100 p-2 rounded-lg text-green-600">
                           <History size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-gray-900 text-sm">{log.description}</p>
                           <p className="text-xs text-gray-500 mt-1">Diterima di: <span className="font-medium text-gray-700">{log.bank_accounts?.bank_name || 'Total Semua Bank'}</span></p>
                           <p className="text-[10px] text-gray-400 mt-1">{new Date(log.created_at || log.date).toLocaleString('id-ID')}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <span className="font-bold text-green-600">{formatCurrency(log.amount)}</span>
                         <div className="mt-1">
                           <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">Pembayaran</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 {historyData.filter(h => h.description.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                   <p className="text-sm text-gray-500 italic text-center py-6">Tidak ada histori pembayaran ditemukan.</p>
                 )}
               </div>
             </SectionCard>
           </div>
        </div>
      </div>
    </div>
  )
}
