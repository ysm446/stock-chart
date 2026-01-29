import { useState } from 'react'
import { X, Search, Plus, Loader2 } from 'lucide-react'
import { chartApi } from '@/services/api'
import api from '@/services/api'

interface StockSearchProps {
  isOpen: boolean
  onClose: () => void
  onStockAdded: () => void
}

interface SearchResult {
  symbol: string
  name: string
  market: string
  currency: string
  sector?: string
}

export default function StockSearch({ isOpen, onClose, onStockAdded }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<{ [key: string]: string }>({})

  if (!isOpen) return null

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await chartApi.searchStocks(searchQuery)
      setSearchResults(results)
      // デフォルトでウォッチリストを選択
      const defaults: { [key: string]: string } = {}
      results.forEach(r => defaults[r.symbol] = 'ウォッチリスト')
      setSelectedCategory(defaults)
    } catch (error) {
      console.error('検索エラー:', error)
      alert('検索に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStock = async (result: SearchResult) => {
    setAdding(result.symbol)
    try {
      // 銘柄を登録（URLの末尾スラッシュを追加）
      await api.post('/stocks/', {
        symbol: result.symbol,
        name: result.name,
        market: result.market,
        sector: result.sector || 'その他',
        user_category: selectedCategory[result.symbol] || 'ウォッチリスト'
      })
      
      alert(`${result.name} を${selectedCategory[result.symbol]}に登録しました`)
      onStockAdded()
    } catch (error: any) {
      console.error('登録エラー:', error)
      if (error.response?.status === 400) {
        alert('この銘柄は既に登録されています')
      } else {
        alert(`銘柄の登録に失敗しました: ${error.response?.data?.detail || error.message}`)
      }
    } finally {
      setAdding(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">銘柄検索</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 検索ボックス */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="銘柄コードまたは銘柄名を入力（例: 7203, トヨタ, Sony）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>検索中...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>検索</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            東証上場銘柄を検索できます。銘柄コード（4桁）または銘柄名を入力してください。
          </div>
        </div>

        {/* 検索結果 */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {searchQuery.trim() && !loading ? (
                <div>
                  <p className="text-lg mb-2">検索結果がありません</p>
                  <p className="text-sm">別のキーワードで検索してください</p>
                </div>
              ) : (
                <div>
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">銘柄を検索してください</p>
                  <p className="text-sm mt-2">例: 7203, トヨタ, Sony, 任天堂</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.symbol}
                  className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{result.symbol}</span>
                      <span className="text-sm px-2 py-0.5 bg-blue-600 rounded text-white">
                        {result.market}
                      </span>
                    </div>
                    <div className="text-gray-300 mb-2">{result.name}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCategory({...selectedCategory, [result.symbol]: '保有銘柄'})}
                        className={`px-3 py-1 text-sm rounded ${
                          selectedCategory[result.symbol] === '保有銘柄'
                            ? 'bg-green-600 text-white'
                            : 'bg-dark-surface text-gray-400 hover:text-white'
                        }`}
                      >
                        保有銘柄
                      </button>
                      <button
                        onClick={() => setSelectedCategory({...selectedCategory, [result.symbol]: 'ウォッチリスト'})}
                        className={`px-3 py-1 text-sm rounded ${
                          selectedCategory[result.symbol] === 'ウォッチリスト'
                            ? 'bg-blue-600 text-white'
                            : 'bg-dark-surface text-gray-400 hover:text-white'
                        }`}
                      >
                        ウォッチリスト
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddStock(result)}
                    disabled={adding === result.symbol}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors ml-4"
                  >
                    {adding === result.symbol ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>登録中...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>登録</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
