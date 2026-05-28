import { useState, useEffect } from 'react'
import { useActiveDate } from '../context/ActiveDateContext'
import { getByDate, create, update, getCapitalLogs, addCapitalLog, removeCapitalLog, remove } from '../services/vehicleStockService'
import PageHeader from '../components/PageHeader'
import SummaryCard from '../components/SummaryCard'
import SectionCard from '../components/SectionCard'
import PremiumTable from '../components/PremiumTable'
import Badge from '../components/Badge'
import CurrencyInput from '../components/CurrencyInput'
import { formatCurrency } from '../utils/format'; 
import { calculateTotal } from '../utils/calculations'
import { Car, TrendingUp, Tags, X, Plus, History, Edit, Trash2 } from 'lucide-react'
import { calculateProfit as utilCalculateProfit } from '../utils/calculations'

export default function VehicleStock() {
  const { dateStr, isInitializing } = useActiveDate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  const initialForm = { vehicle_type: 'Mobil', brand: '', model: '', plate_number: '', year: '', status: 'Ready', estimated_sell_price: '', sell_price: '', note: '' }
  const [form, setForm] = useState(initialForm)
  const [patungan, setPatungan] = useState([{ investor_name: '', amount: '' }])
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  // Modal states
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [historyLogs, setHistoryLogs] = useState([])
  const [logForm, setLogForm] = useState({ investor_name: '', description: '', amount: '', type: 'Perbaikan' })
  const [loadingLogs, setLoadingLogs] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getByDate(dateStr)
      setVehicles(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (!isInitializing) loadData() }, [dateStr, isInitializing])

  const handleAddPatungan = () => setPatungan([...patungan, { investor_name: '', amount: '' }])
  
  const handlePatunganChange = (index, field, value) => {
    const newP = [...patungan]
    newP[index][field] = value
    setPatungan(newP)
  }

  const handleRemovePatungan = (index) => {
    const newP = [...patungan]
    newP.splice(index, 1)
    setPatungan(newP)
  }

  const handleEditClick = (vehicle) => {
    setForm({
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand || '',
      model: vehicle.model,
      plate_number: vehicle.plate_number || '',
      year: vehicle.year || '',
      status: vehicle.status,
      estimated_sell_price: vehicle.estimated_sell_price || '',
      sell_price: vehicle.sell_price || '',
      note: vehicle.note || ''
    })
    setEditId(vehicle.id)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setForm(initialForm)
    setEditId(null)
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await update(editId, {
          ...form,
          year: form.year ? Number(form.year) : null,
          estimated_sell_price: Number(form.estimated_sell_price) || 0,
          sell_price: Number(form.sell_price) || 0
        })
        handleCancelEdit()
      } else {
        const totalModal = patungan.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        if (totalModal <= 0) return alert('Total Modal patungan tidak boleh nol.')
        
        const logsToInsert = patungan.filter(p => p.investor_name && p.amount).map(p => ({
          investor_name: p.investor_name,
          amount: Number(p.amount),
          description: 'Modal Awal',
          type: 'Patungan'
        }))

        await create({
          ...form,
          date: dateStr,
          year: form.year ? Number(form.year) : null,
          purchase_price: totalModal,
          estimated_sell_price: Number(form.estimated_sell_price) || 0,
          sell_price: Number(form.sell_price) || 0
        }, logsToInsert)

        setForm(initialForm)
        setPatungan([{ investor_name: '', amount: '' }])
      }
      loadData()
    } catch (err) { alert("Gagal menyimpan kendaraan") }
  }

  const handleStatusChange = async (id, newStatus) => {
    await update(id, { status: newStatus })
    loadData()
  }

  const openHistory = async (vehicle) => {
    setSelectedVehicle(vehicle)
    setLoadingLogs(true)
    try {
      const logs = await getCapitalLogs(vehicle.vehicle_group_id)
      setHistoryLogs(logs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLogs(false)
    }
  }

  const submitLog = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) return
    try {
      await addCapitalLog(selectedVehicle.id, selectedVehicle.vehicle_group_id, {
        date: dateStr,
        investor_name: logForm.investor_name,
        description: logForm.description,
        amount: Number(logForm.amount),
        type: logForm.type
      })
      
      const logs = await getCapitalLogs(selectedVehicle.vehicle_group_id)
      setHistoryLogs(logs || [])
      setLogForm({ investor_name: '', description: '', amount: '', type: 'Perbaikan' })
      
      // Update selected vehicle local state to reflect new price
      setSelectedVehicle({...selectedVehicle, purchase_price: Number(selectedVehicle.purchase_price) + Number(logForm.amount)})
      
      loadData()
    } catch (err) {
      alert("Gagal menambah histori modal")
    }
  }

  const handleDeleteLog = async (log) => {
    if(!window.confirm(`Yakin ingin menghapus histori ${log.investor_name} (${formatCurrency(log.amount)})?`)) return
    try {
      await removeCapitalLog(log.id, selectedVehicle.id, log.amount)
      
      const logs = await getCapitalLogs(selectedVehicle.vehicle_group_id)
      setHistoryLogs(logs || [])
      
      setSelectedVehicle({...selectedVehicle, purchase_price: Number(selectedVehicle.purchase_price) - Number(log.amount)})
      loadData()
    } catch (err) {
      alert("Gagal menghapus histori")
    }
  }

  const handleDeleteVehicle = async (vehicle) => {
    if(!window.confirm(`Yakin ingin menghapus kendaraan ${vehicle.brand} ${vehicle.model} beserta seluruh historinya?`)) return
    try {
      await remove(vehicle.id)
      loadData()
    } catch (err) {
      alert("Gagal menghapus kendaraan")
    }
  }

  const activeVehicles = vehicles.filter(v => v.status !== 'Terjual')
  const totalModal = calculateTotal(activeVehicles, 'purchase_price')
  const totalEstimasi = calculateTotal(activeVehicles, 'estimated_sell_price')
  const calculatedPurchasePrice = patungan.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

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
          <SectionCard title={isEditing ? "Edit Kendaraan" : "Tambah Kendaraan"}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.vehicle_type} onChange={e=>setForm({...form, vehicle_type: e.target.value})} className="w-full p-2 border rounded-lg"><option value="Mobil">Mobil</option><option value="Motor">Motor</option></select>
              <input type="text" placeholder="Brand (Toyota)" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="text" required placeholder="Model (Avanza)" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} className="w-full p-2 border rounded-lg" />
              <input type="text" placeholder="Plat (B 1234 XX)" value={form.plate_number} onChange={e=>setForm({...form, plate_number: e.target.value})} className="w-full p-2 border rounded-lg" />
              
              {!isEditing ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Rincian Patungan Modal</label>
                  {patungan.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input required type="text" placeholder="Nama" value={p.investor_name} onChange={e=>handlePatunganChange(i, 'investor_name', e.target.value)} className="w-1/3 p-2 border rounded-lg text-sm" />
                      <CurrencyInput required placeholder="Nominal" value={p.amount} onChange={e=>handlePatunganChange(i, 'amount', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                      {patungan.length > 1 && (
                        <button type="button" onClick={() => handleRemovePatungan(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddPatungan} className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1 hover:underline"><Plus size={14}/> Tambah Pemodal</button>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Modal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculatedPurchasePrice)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                  Untuk mengedit atau menambah rincian Harga Modal, silakan gunakan tombol <strong>Histori</strong> di tabel data.
                </div>
              )}

              <CurrencyInput placeholder="Estimasi Jual" required value={form.estimated_sell_price} onChange={e=>setForm({...form, estimated_sell_price: e.target.value})} className="w-full p-2 border rounded-lg" />
              <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="Ready">Ready</option><option value="Booking">Booking</option><option value="Servis">Servis</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-medium shadow-sm hover:bg-blue-700">
                  {isEditing ? 'Update' : 'Simpan'}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="px-4 bg-gray-100 text-gray-700 p-2 rounded-lg font-medium hover:bg-gray-200">
                    Batal
                  </button>
                )}
              </div>
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
                    <td className="p-3 text-sm font-semibold">{formatCurrency(v.purchase_price)}</td>
                    <td className="p-3 text-sm">{formatCurrency(v.estimated_sell_price)}</td>
                    <td className="p-3 text-sm font-bold text-green-600">{formatCurrency(utilCalculateProfit(v.estimated_sell_price, v.purchase_price))}</td>
                    <td className="p-3 text-sm flex items-center gap-2">
                      <button onClick={() => openHistory(v)} title="Histori Modal" className="p-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg transition-colors">
                        <History size={16} />
                      </button>
                      <button onClick={() => handleEditClick(v)} title="Edit Kendaraan" className="p-1.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteVehicle(v)} title="Hapus Kendaraan" className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <select value={v.status} onChange={(e) => handleStatusChange(v.id, e.target.value)} className="text-xs border rounded p-1 bg-white cursor-pointer ml-1">
                        <option value="Ready">Ready</option><option value="Booking">Booking</option><option value="Terjual">Terjual</option><option value="Servis">Servis</option>
                      </select>
                    </td>
                  </tr>
                )}
             />
          </SectionCard>
        </div>
      </div>

      {/* Modal Histori Modal (Patungan & Perbaikan) */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl">
             <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">Histori Modal & Patungan: {selectedVehicle.brand} {selectedVehicle.model}</h3>
                <button onClick={() => setSelectedVehicle(null)} className="text-gray-500 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-200"><X size={20} /></button>
             </div>
             
             <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* List Histori */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="text-blue-800 font-medium text-sm">Total Modal Saat Ini</span>
                    <span className="text-blue-900 font-bold text-lg">{formatCurrency(selectedVehicle.purchase_price)}</span>
                  </div>
                  
                  {loadingLogs ? <p className="text-gray-500 animate-pulse text-sm">Memuat histori...</p> : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {historyLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-start p-3 bg-white border border-gray-100 shadow-sm rounded-xl group">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{log.investor_name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.type === 'Patungan' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'}`}>{log.type}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(log.date).toLocaleDateString('id-ID')}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="font-bold text-gray-900">{formatCurrency(log.amount)}</span>
                            <button onClick={() => handleDeleteLog(log)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Hapus Histori">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {historyLogs.length === 0 && <p className="text-sm text-gray-500 italic">Belum ada histori modal terpisah.</p>}
                    </div>
                  )}
                </div>

                {/* Form Tambah Histori */}
                <div className="w-full md:w-[300px] bg-gray-50 p-4 rounded-xl border border-gray-100 h-fit">
                   <h4 className="font-semibold text-gray-800 mb-3 text-sm">Tambah Perbaikan / Modal</h4>
                   <form onSubmit={submitLog} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Jenis</label>
                        <select value={logForm.type} onChange={e=>setLogForm({...logForm, type: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white">
                          <option value="Perbaikan">Perbaikan (Nambah Modal)</option>
                          <option value="Patungan">Tambah Patungan Baru</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nama (Siapa / Bengkel)</label>
                        <input required type="text" value={logForm.investor_name} onChange={e=>setLogForm({...logForm, investor_name: e.target.value})} placeholder="Contoh: Bengkel Jaya" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Deskripsi</label>
                        <input required type="text" value={logForm.description} onChange={e=>setLogForm({...logForm, description: e.target.value})} placeholder="Contoh: Ganti Oli & Kampas" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nominal Biaya</label>
                        <CurrencyInput required value={logForm.amount} onChange={e=>setLogForm({...logForm, amount: e.target.value})} placeholder="1.500.000" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium text-sm transition-colors mt-2">
                        Simpan Tambahan
                      </button>
                   </form>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
