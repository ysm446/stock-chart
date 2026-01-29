import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ShoppingCart, ChevronDown, ChevronRight } from 'lucide-react'
import { purchaseApi, Purchase, PurchaseCreate } from '@/services/api'
import { useChartStore } from '@/store/chartStore'
import clsx from 'clsx'

export default function PurchaseManager() {
  const { selectedStock, purchases, setPurchases } = useChartStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<PurchaseCreate>({
    stock_id: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: 100,
    purchase_price: 0,
    notes: ''
  })

  useEffect(() => {
    if (selectedStock) {
      loadPurchases()
    }
  }, [selectedStock])

  const loadPurchases = async () => {
    if (!selectedStock) return
    try {
      const data = await purchaseApi.getPurchases(selectedStock.id)
      setPurchases(data)
    } catch (error) {
      console.error('Failed to load purchases:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock) return

    try {
      if (editingId) {
        await purchaseApi.updatePurchase(editingId, formData)
      } else {
        await purchaseApi.createPurchase({
          ...formData,
          stock_id: selectedStock.id
        })
      }
      await loadPurchases()
      resetForm()
    } catch (error) {
      console.error('Failed to save purchase:', error)
      alert('購入履歴の保存に失敗しました')
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setFormData({
      stock_id: purchase.stock_id,
      purchase_date: purchase.purchase_date,
      quantity: purchase.quantity,
      purchase_price: purchase.purchase_price,
      notes: purchase.notes || ''
    })
    setEditingId(purchase.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この購入履歴を削除しますか?')) return

    try {
      await purchaseApi.deletePurchase(id)
      await loadPurchases()
    } catch (error) {
      console.error('Failed to delete purchase:', error)
      alert('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      stock_id: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      quantity: 100,
      purchase_price: 0,
      notes: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const currentStockPurchases = purchases.filter(p => p.stock_id === selectedStock?.id)
  const totalQuantity = currentStockPurchases.reduce((sum, p) => sum + p.quantity, 0)
  const totalCost = currentStockPurchases.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0)
  const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0

  if (!selectedStock) {
    return null
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-hover rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-500" />
          <h3 className="text-sm font-semibold text-gray-400">購入履歴</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">({currentStockPurchases.length})</span>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!isCollapsed && (
        <div className="mt-2 px-3">
          {/* Summary */}
          {currentStockPurchases.length > 0 && (
            <div className="bg-dark-bg border border-dark-border rounded-lg p-3 mb-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">合計株数:</span>
                <span className="text-white font-medium">{totalQuantity.toLocaleString()}株</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">平均取得価格:</span>
                <span className="text-white font-medium">¥{avgPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">投資総額:</span>
                <span className="text-white font-medium">¥{totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Add Purchase Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors mb-3 text-sm"
            >
              <Plus size={16} />
              <span>購入を記録</span>
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-dark-bg border border-dark-border rounded-lg p-3 mb-3">
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">購入日</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                    className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">株数</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">購入単価 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                    required
                    min="0.01"
                    className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">メモ (任意)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="購入理由など..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                  {editingId ? '更新' : '追加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {/* Purchase List */}
          {currentStockPurchases.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-4">
              購入履歴がありません
            </div>
          ) : (
            <div className="space-y-2">
              {currentStockPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={clsx(
                    "bg-dark-bg border border-dark-border rounded-lg p-2 transition-colors",
                    editingId === purchase.id ? "border-blue-500" : "hover:border-green-500"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {purchase.purchase_date}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {purchase.quantity}株 @ ¥{purchase.purchase_price.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-400 mt-0.5">
                        合計: ¥{(purchase.quantity * purchase.purchase_price).toLocaleString()}
                      </div>
                      {purchase.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {purchase.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="p-1 hover:bg-dark-hover rounded transition-colors"
                        title="編集"
                      >
                        <Edit2 size={14} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="p-1 hover:bg-dark-hover rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
