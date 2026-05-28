import CurrencyInput from '../components/CurrencyInput'
import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, update, remove } from '../services/receivableService'
import { getAccountsByDate, createTransaction, getTransactionsByCategory, deleteTransaction } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import Badge from '../components/Badge'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import ConfirmModal from '../components/ConfirmModal'
import { ArrowDownToLine, Users, CheckCircle, Search, History } from 'lucide-react'

export default function Receivables() {
  const { dateStr, isInitializing } = useActiveDate()
  const [data, setData] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ customer_name: '', description: '', amount: '', paid_amount: 0, status: 'Belum Dibayar', bank_account_id: '' })
  const [paymentForm, setPaymentForm] = useState({ id: null, amount: '', bank_account_id: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [historyData, setHistoryData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

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
    if (isEditing) {
      await update(editId, { 
        customer_name: form.customer_name, 
        description: form.description, 
        amount: Number(form.amount),
        paid_amount: Number(form.paid_amount),
        status: form.status
      })
      setIsEditing(false)
      setEditId(null)
    } else {
      await create({ ...form, date: dateStr, amount: Number(form.amount) })
    }
    setForm({ customer_name: '', description: '', amount: '', paid_amount: 0, status: 'Belum Dibayar', bank_account_id: '' })
    loadData()
  }
  
  const handleEditClick = (item) => {
    setIsEditing(true)
    setEditId(item.id)
    setForm({
      customer_name: item.customer_name,
      description: item.description,
      amount: item.amount,
      paid_amount: item.paid_amount,
      status: item.status,
      bank_account_id: ''
    })
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditId(null)
    setForm({ customer_name: '', description: '', amount: '', paid_amount: 0, status: 'Belum Dibayar', bank_account_id: '' })
  }

  const handleDelete = (item) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Piutang',
      message: `Yakin ingin menghapus data piutang dari ${item.customer_name}? Histori pembayaran terkait piutang ini di kas/bank tidak akan terhapus otomatis.`,
      onConfirm: async () => {
        await remove(item.id)
        loadData()
      }
    })
  }

  const handleDeleteHistory = (log) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Histori Pembayaran',
      message: `Yakin ingin menghapus histori pembayaran sebesar ${formatCurrency(log.amount)}? Jika ini pembayaran baru, total yang sudah dibayar pada piutang akan otomatis dikurangi.`,
      onConfirm: async () => {
        if (log.related_source_id) {
          const receivable = data.find(d => d.id === log.related_source_id)
          if (receivable) {
            const newPaid = Math.max(0, Number(receivable.paid_amount) - Number(log.amount))
            const status = newPaid >= Number(receivable.amount) ? 'Lunas' : (newPaid > 0 ? 'Sebagian' : 'Belum Dibayar')
            await update(receivable.id, { paid_amount: newPaid, status })
          }
        }
        await deleteTransaction(log.id)
        loadData()
      }
    })
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
      description: `Terima pembayaran dari ${item.customer_name}`, amount: payAmt,
      related_source: 'receivables', related_source_id: item.id
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Piutang (Sisa)" value={formatCurrency(sisa)} icon={ArrowDownToLine} />
        <SummaryCard title="Sudah Dibayar" value={formatCurrency(paid)} icon={CheckCircle} colorClass="text-green-600" bgClass="bg-green-50" />
        <SummaryCard title="Jumlah Customer" value={data.length} icon={Users} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title={isEditing ? "Edit Piutang" : "Tambah Piutang"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" placeholder="Nama Customer" value={form.customer_name} onChange={e=>setForm({...form, customer_name: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input required type="text" placeholder="Deskripsi" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
              <CurrencyInput required placeholder="Nominal" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
              {isEditing && (
                <>
                  <CurrencyInput required placeholder="Jumlah Terbayar" value={form.paid_amount} onChange={e=>setForm({...form, paid_amount: e.target.value})} className="w-full p-2 border rounded-lg" />
                  <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full p-2 border rounded-lg">
                    <option value="Belum Dibayar">Belum Dibayar</option>
                    <option value="Sebagian">Sebagian</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </>
              )}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">{isEditing ? 'Update' : 'Simpan'}</button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="px-4 bg-gray-100 text-gray-700 p-2 rounded-lg font-medium hover:bg-gray-200">Batal</button>
                )}
              </div>
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
                columns={['Customer', 'Deskripsi', 'Sisa Tagihan', 'Status', 'Aksi']}
                data={data}
                renderRow={item => (
                  <tr key={item.id}>
                    <td className="p-3 text-sm font-medium">{item.customer_name}</td>
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm font-bold text-gray-900">
                      {formatCurrency(item.amount - (item.paid_amount || 0))}
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">Total: {formatCurrency(item.amount)}</div>
                    </td>
                    <td className="p-3 text-sm"><Badge status={item.status} /></td>
                    <td className="p-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {item.status !== 'Lunas' && (
                          <button onClick={() => setPaymentForm({ ...paymentForm, id: item.id })} className="text-blue-600 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">Bayar</button>
                        )}
                        <button onClick={() => handleEditClick(item)} className="text-orange-600 text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors">Edit</button>
                        <button onClick={() => handleDelete(item)} className="text-red-600 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Hapus</button>
                      </div>
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
                         <div className="mt-1 flex gap-2 justify-end">
                           <button onClick={() => handleDeleteHistory(log)} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors">Hapus</button>
                           <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">Penerimaan</span>
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
