import CurrencyInput from '../components/CurrencyInput'
import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getAccountsByDate, getTransactionsByDate, createAccount, updateAccount, deleteAccount, createTransaction, createTransfer } from '../services/bankService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import { formatCurrency } from '../utils/format'; import { calculateTotal } from '../utils/calculations'
import ConfirmModal from '../components/ConfirmModal'
import { Landmark, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Edit, Trash2, X } from 'lucide-react'

export default function BankDashboard() {
  const { dateStr, isInitializing } = useActiveDate()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const [accountForm, setAccountForm] = useState({ bank_name: '', account_number: '', opening_balance: '' })
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [editAccountId, setEditAccountId] = useState(null)
  
  const [txForm, setTxForm] = useState({ bank_account_id: '', transaction_type: 'Masuk', description: '', amount: '' })
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '' })

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const [expenses, setExpenses] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const accs = await getAccountsByDate(dateStr)
      const txs = await getTransactionsByDate(dateStr)
      
      // Fetch expenses to adjust global bank balance
      const { getByDate: getExpenses } = await import('../services/expenseService')
      const exps = await getExpenses(dateStr)
      setExpenses(exps || [])

      setAccounts(accs || [])
      setTransactions(txs || [])
    } catch (err) {
      alert("Gagal memuat data bank: " + err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditingAccount) {
        await updateAccount(editAccountId, {
          bank_name: accountForm.bank_name,
          account_number: accountForm.account_number,
          opening_balance: Number(accountForm.opening_balance)
        })
        setAccountForm({ bank_name: '', account_number: '', opening_balance: '' })
        setIsEditingAccount(false)
        setEditAccountId(null)
      } else {
        await createAccount({ ...accountForm, date: dateStr, opening_balance: Number(accountForm.opening_balance) })
        setAccountForm({ bank_name: '', account_number: '', opening_balance: '' })
      }
      loadData()
    } catch (err) {
      alert("Gagal menyimpan rekening: " + err.message)
    }
  }

  const handleEditAccountClick = (acc) => {
    setAccountForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number || '',
      opening_balance: acc.opening_balance
    })
    setIsEditingAccount(true)
    setEditAccountId(acc.id)
  }

  const handleCancelEditAccount = () => {
    setAccountForm({ bank_name: '', account_number: '', opening_balance: '' })
    setIsEditingAccount(false)
    setEditAccountId(null)
  }

  const handleDeleteAccount = (acc) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Rekening',
      message: `Yakin ingin menghapus rekening ${acc.bank_name}? Semua transaksi yang terkait dengan rekening ini akan ikut terhapus.`,
      onConfirm: async () => {
        try {
          await deleteAccount(acc.id)
          loadData()
        } catch (err) {
          alert("Gagal menghapus rekening: " + err.message)
        }
      }
    })
  }

  const handleTxSubmit = async (e) => {
    e.preventDefault()
    try {
      await createTransaction({ ...txForm, date: dateStr, amount: Number(txForm.amount) })
      setTxForm({ ...txForm, description: '', amount: '' })
      loadData()
    } catch (err) {
      alert("Gagal menambahkan transaksi: " + err.message)
    }
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      alert('Rekening sumber dan tujuan tidak boleh sama')
      return
    }
    try {
      await createTransfer({ ...transferForm, date: dateStr, amount: Number(transferForm.amount) })
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', description: '' })
      loadData()
    } catch (err) {
      alert("Gagal melakukan transfer: " + err.message)
    }
  }

  const totalPengeluaran = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  const netGlobalTransactions = transactions
    .filter(t => !t.bank_account_id)
    .reduce((sum, tx) => tx.transaction_type === 'Masuk' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0)
    
  const totalKasRekening = calculateTotal(accounts, 'closing_balance')
  const totalSaldo = totalKasRekening - totalPengeluaran + netGlobalTransactions
  const mutasiMasuk = calculateTotal(transactions.filter(t => t.transaction_type === 'Masuk'), 'amount')
  const mutasiKeluar = calculateTotal(transactions.filter(t => t.transaction_type === 'Keluar'), 'amount')

  const subtitleMath = `Kas: ${formatCurrency(totalKasRekening)} - Pengeluaran: ${formatCurrency(totalPengeluaran)}${netGlobalTransactions ? ` + Global Tx: ${formatCurrency(netGlobalTransactions)}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Bank & Kas" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Saldo Bank" value={formatCurrency(totalSaldo)} subtitle={subtitleMath} icon={Landmark} delay={0.1} />
        <SummaryCard title="Mutasi Masuk" value={formatCurrency(mutasiMasuk)} icon={ArrowDownLeft} colorClass="text-green-600" bgClass="bg-green-50" delay={0.2} />
        <SummaryCard title="Mutasi Keluar" value={formatCurrency(mutasiKeluar)} icon={ArrowUpRight} colorClass="text-red-600" bgClass="bg-red-50" delay={0.3} />
        <SummaryCard title="Jumlah Rekening" value={accounts.length} icon={Landmark} colorClass="text-indigo-600" bgClass="bg-indigo-50" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title={isEditingAccount ? "Edit Rekening" : "Tambah Rekening Baru"} delay={0.2}>
             <form onSubmit={handleAccountSubmit} className="space-y-3">
               <input required type="text" placeholder="Nama Bank (BCA, Kas, dll)" value={accountForm.bank_name} onChange={e=>setAccountForm({...accountForm, bank_name: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input type="text" placeholder="Nomor Rekening" value={accountForm.account_number} onChange={e=>setAccountForm({...accountForm, account_number: e.target.value})} className="w-full p-2 border rounded-lg" />
               <CurrencyInput required placeholder="Saldo Awal" value={accountForm.opening_balance} onChange={e=>setAccountForm({...accountForm, opening_balance: e.target.value})} className="w-full p-2 border rounded-lg" />
               <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">{isEditingAccount ? 'Update' : 'Simpan'}</button>
                 {isEditingAccount && (
                   <button type="button" onClick={handleCancelEditAccount} className="px-4 bg-gray-100 text-gray-700 p-2 rounded-lg font-medium hover:bg-gray-200">Batal</button>
                 )}
               </div>
             </form>
          </SectionCard>

          <SectionCard title="Transaksi Manual" delay={0.3}>
             <form onSubmit={handleTxSubmit} className="space-y-3">
               <select required value={txForm.bank_account_id} onChange={e=>setTxForm({...txForm, bank_account_id: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Pilih Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <select required value={txForm.transaction_type} onChange={e=>setTxForm({...txForm, transaction_type: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="Masuk">Mutasi Masuk</option><option value="Keluar">Mutasi Keluar</option>
               </select>
               <input required type="text" placeholder="Deskripsi" value={txForm.description} onChange={e=>setTxForm({...txForm, description: e.target.value})} className="w-full p-2 border rounded-lg" />
               <CurrencyInput required placeholder="Nominal" value={txForm.amount} onChange={e=>setTxForm({...txForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
               <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Simpan Transaksi</button>
             </form>
          </SectionCard>

          <SectionCard title="Transfer Antar Rekening" delay={0.4}>
             <form onSubmit={handleTransferSubmit} className="space-y-3">
               <select required value={transferForm.fromAccountId} onChange={e=>setTransferForm({...transferForm, fromAccountId: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Dari Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <select required value={transferForm.toAccountId} onChange={e=>setTransferForm({...transferForm, toAccountId: e.target.value})} className="w-full p-2 border rounded-lg">
                 <option value="">-- Ke Rekening --</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
               </select>
               <CurrencyInput required placeholder="Nominal Transfer" value={transferForm.amount} onChange={e=>setTransferForm({...transferForm, amount: e.target.value})} className="w-full p-2 border rounded-lg" />
               <input required type="text" placeholder="Deskripsi Transfer" value={transferForm.description} onChange={e=>setTransferForm({...transferForm, description: e.target.value})} className="w-full p-2 border rounded-lg" />
               <button className="w-full bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"><ArrowRightLeft size={16} /> Proses Transfer</button>
             </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Daftar Rekening" delay={0.5}>
            <PremiumTable 
              columns={['Bank', 'No. Rek', 'Saldo Awal', 'Saldo Akhir', 'Aksi']}
              data={accounts}
              renderRow={a => (
                <tr key={a.id}>
                  <td className="p-3 text-sm font-medium">{a.bank_name}</td>
                  <td className="p-3 text-sm">{a.account_number || '-'}</td>
                  <td className="p-3 text-sm">{formatCurrency(a.opening_balance)}</td>
                  <td className="p-3 text-sm font-bold text-blue-600">{formatCurrency(a.closing_balance)}</td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditAccountClick(a)} title="Edit Rekening" className="p-1.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteAccount(a)} title="Hapus Rekening" className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
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
                  <td className="p-3 text-sm">{t.bank_accounts?.bank_name || 'Total Semua Bank'}</td>
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
