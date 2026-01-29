import { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2 } from 'lucide-react'
import { Stock } from '@/store/chartStore'
import api from '@/services/api'

interface StockManagerProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function StockManager({ isOpen, onClose, onUpdate }: StockManagerProps) {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    market: 'Tokyo',
    sector: '',
    user_category: 'ウォッチリスト'
  })

  useEffect(() => {
    if (isOpen) {
      loadStocks()
    }
  }, [isOpen])

  const loadStocks = async () => {
    setLoading(true)
    try {
      const response = await api.get('/stocks')
      setStocks(response.data)
    } catch (error) {
      console.error('Failed to load stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStock) {
        // 更新
        await api.put(`/stocks/${editingStock.id}`, {
          name: formData.name,
          market: formData.market,
          sector: formData.sector,
          user_category: formData.user_category
        })
      } else {
        // 新規追加
        await api.post('/stocks', formData)
      }
      
      loadStocks()
      onUpdate()
      resetForm()
    } catch (error: any) {
      alert(error.response?.data?.detail || '保存に失敗しました')
    }
  }

  const handleDelete = async (stockId: number) => {
    if (!confirm('この銘柄を削除しますか？')) return
    
    try {
      await api.delete(`/stocks/${stockId}`)
      loadStocks()
      onUpdate()
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock)
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      sector: (stock as any).sector || '',
      user_category: (stock as any).user_category || stock.category || 'ウォッチリスト'
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({ symbol: '', name: '', market: 'Tokyo', sector: '', user_category: 'ウォッチリスト' })
    setEditingStock(null)
    setShowAddForm(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-xl font-bold">銘柄管理</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              <span>新規追加</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 追加/編集フォーム */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-4 border-b border-dark-border bg-dark-bg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">銘柄コード</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  disabled={!!editingStock}
                  placeholder="例: 7203.T"
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">銘柄名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: トヨタ自動車"
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">市場</label>
                <input
                  type="text"
                  value={formData.market}
                  onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">業種</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="例: 輸送用機器"
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分類</label>
                <select
                  value={formData.user_category}
                  onChange={(e) => setFormData({ ...formData, user_category: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg"
                  required
                >
                  <option value="ウォッチリスト">ウォッチリスト</option>
                  <option value="保有銘柄">保有銘柄</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                {editingStock ? '更新' : '追加'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        {/* 銘柄リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">読み込み中...</div>
          ) : (
            <div className="space-y-2">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-dark-hover"
                >
                  <div className="flex-1">
                    <div className="font-medium">{stock.name}</div>
                    <div className="text-sm text-gray-400">
                      {stock.symbol} / {stock.market} / {(stock as any).sector || '-'} / {(stock as any).user_category || stock.category}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(stock)}
                      className="p-2 hover:bg-dark-surface rounded-lg text-blue-400"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(stock.id)}
                      className="p-2 hover:bg-dark-surface rounded-lg text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
