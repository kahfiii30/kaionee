import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getAccountsByDate, getTransactionsByDate, createAccount, createTransaction, createTransfer } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import { Landmark, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react'

export default function BankDashboard() {
  const { dateStr, isInitializing } = useActiveDate()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const [accountForm, setAccountForm] = useState({ bank_name: '', account_number: '', opening_balance: '' })
  const [txForm, setTxForm] = useState({ bank_account_id: '', transaction_type: 'Masuk', description: '', amount: '' })
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '' })

  const loadData = async () => {
    setLoading(true)
    const accs = await getAccountsByDate(dateStr)
    const txs = await getTransactionsByDate(dateStr)
    setAccounts(accs || [])
    setTransactions(txs || [])
    setLoading(false)
  }
  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    await createAccount({ ...accountForm, date: dateStr, opening_balance: Number(accountForm.opening_balance) })
    setAccountForm({ bank_name: '', account_number: '', opening_balance: '' })
    loadData()
  }

  const handleTxSubmit = async (e) => {
    e.preventDefault()
    await createTransaction({ ...txForm, date: dateStr, amount: Number(txForm.amount) })
    setTxForm({ ...txForm, description: '', amount: '' })
    loadData()
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      alert('Rekening sumber dan tujuan tidak boleh sama')
      return
    }
    await createTransfer({ ...transferForm, date: dateStr, amount: Number(transferForm.amount) })
    setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', description: '' })
    loadData()
  }

  const totalSaldo = calculateTotal(accounts, 'closing_balance')
  const mutasiMasuk = calculateTotal(transactions.filter(t => t.transaction_type === 'Masuk'), 'amount')
  const mutasiKeluar = calculateTotal(transactions.filter(t => t.transaction_type === 'Keluar'), 'amount')

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Bank & Kas" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Saldo Bank" value={formatCurrency(totalSaldo)} icon={Landmark} />
        <SummaryCard title="Mutasi Masuk" value={formatCurrency(mutasiMasuk)} icon={ArrowDownLeft} colorClass="text-green-600" bgClass="bg-green-50" />
        <SummaryCard title="Mutasi Keluar" value={formatCurrency(mutasiKeluar)} icon={ArrowUpRight} colorClass="text-red-600" bgClass="bg-red-50" />
        <SummaryCard title="Jumlah Rekening" value={accounts.length} icon={Landmark} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Tambah Rekening Baru">
             <form onSubmit={handleAccountSubmit} className="space-y-3">
               <input required type="text" placeholder="Nama Bank (BCA, Kas, dll)" value={accountForm.bank_name} onChange={e=>setAccountForm({...accountForm, bank_name: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input type="text" placeholder="Nomor Rekening" value={accountForm.account_number} onChange={e=>setAccountForm({...accountForm, account_number: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input required type="number" placeholder="Saldo Awal" value={accountForm.opening_balance} onChange={e=>setAccountForm({...accountForm, opening_balance: e.target.value})} className="w-full p-2 border rounded-lg" />
               <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan</button>
             </form>
          </SectionCard>

          <SectionCard title="Transaksi Manual">
             <form onSubmit={handleTxSubmit} className="space-y-3">
               <select required value={txForm.bank_account_id} onChange={e=>setTxForm({...txForm, bank_account_id: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Pilih Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <select required value={txForm.transaction_type} onChange={e=>setTxForm({...txForm, transaction_type: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="Masuk">Mutasi Masuk</option><option value="Keluar">Mutasi Keluar</option>
               </select>
               <input required type="text" placeholder="Deskripsi" value={txForm.description} onChange={e=>setTxForm({...txForm, description: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input required type="number" placeholder="Nominal" value={txForm.amount} onChange={e=>setTxForm({...txForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
               <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan Transaksi</button>
             </form>
          </SectionCard>

          <SectionCard title="Transfer Antar Rekening">
             <form onSubmit={handleTransferSubmit} className="space-y-3">
               <select required value={transferForm.fromAccountId} onChange={e=>setTransferForm({...transferForm, fromAccountId: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Dari Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <select required value={transferForm.toAccountId} onChange={e=>setTransferForm({...transferForm, toAccountId: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Ke Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <input required type="number" placeholder="Nominal Transfer" value={transferForm.amount} onChange={e=>setTransferForm({...transferForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input required type="text" placeholder="Deskripsi Transfer" value={transferForm.description} onChange={e=>setTransferForm({...transferForm, description: e.target.value})} className="w-full p-2 border rounded-lg" />
               <button className="w-full bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"><ArrowRightLeft size={16} /> Proses Transfer</button>
             </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Daftar Rekening">
            <PremiumTable 
              columns={['Bank', 'No. Rek', 'Saldo Awal', 'Saldo Akhir']}
              data={accounts}
              renderRow={a => (
                <tr key={a.id}>
                  <td className="p-3 text-sm font-medium">{a.bank_name}</td>
                  <td className="p-3 text-sm">{a.account_number || '-'}</td>
                  <td className="p-3 text-sm">{formatCurrency(a.opening_balance)}</td>
                  <td className="p-3 text-sm font-bold text-blue-600">{formatCurrency(a.closing_balance)}</td>
                </tr>
              )}
            />
          </SectionCard>
          <SectionCard title="Mutasi Hari Ini">
            <PremiumTable 
              columns={['Rekening', 'Deskripsi', 'Jenis', 'Nominal']}
              data={transactions}
              renderRow={t => (
                <tr key={t.id}>
                  <td className="p-3 text-sm">{t.bank_accounts?.bank_name}</td>
                  <td className="p-3 text-sm font-medium">{t.description}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${t.transaction_type==='Masuk'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{t.transaction_type}</span>
                  </td>
                  <td className="p-3 text-sm font-bold">{formatCurrency(t.amount)}</td>
                </tr>
              )}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
