import { useEffect, useState } from 'react'
import { Menu, X, Settings, Search, MoreVertical, Edit, ChevronDown, ChevronRight } from 'lucide-react'
import { useChartStore } from '@/store/chartStore'
import { chartApi } from '@/services/api'
import api from '@/services/api'
import StockManager from './StockManager'
import StockSearch from './StockSearch'
import clsx from 'clsx'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { setWatchlists, selectedStock, setSelectedStock } = useChartStore()
  const [loading, setLoading] = useState(true)
  const [showStockManager, setShowStockManager] = useState(false)
  const [showStockSearch, setShowStockSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allStocks, setAllStocks] = useState<any[]>([])
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('collapsed-categories')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  useEffect(() => {
    loadStocks()
  }, [])

  const loadStocks = async () => {
    try {
      const response = await chartApi.getWatchlists()
      // 全ウォッチリストから銘柄を取得して重複を除去
      const stocksMap = new Map()
      response.forEach((wl: any) => {
        wl.stocks.forEach((stock: any) => {
          if (!stocksMap.has(stock.id)) {
            stocksMap.set(stock.id, stock)
          }
        })
      })
      const stocks = Array.from(stocksMap.values()).sort((a: any, b: any) => 
        a.symbol.localeCompare(b.symbol)
      )
      setAllStocks(stocks)
      setWatchlists(response)
    } catch (error) {
      console.error('Failed to load stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  // 指標データ（固定）
  const indices = [
    { id: -1, symbol: '^N225', name: '日経平均株価', category: '主要指標', market: 'Tokyo' },
    { id: -2, symbol: 'USDJPY=X', name: '米ドル/円', category: '主要指標', market: 'FX' }
  ]

  const filteredStocks = allStocks.filter(stock => 
    !searchQuery.trim() || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredIndices = indices.filter(index =>
    !searchQuery.trim() ||
    index.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    index.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const ownedStocks = filteredStocks.filter(stock => stock.user_category === '保有銘柄' || stock.category === '保有銘柄')
  const watchlistStocks = filteredStocks.filter(stock => stock.user_category === 'ウォッチリスト' || stock.category === 'ウォッチリスト')

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      localStorage.setItem('collapsed-categories', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const handleCategoryChange = async (stockId: number, newCategory: string) => {
    try {
      await api.put(`/stocks/${stockId}`, { user_category: newCategory })
      loadStocks()
      setMenuOpenFor(null)
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('カテゴリの変更に失敗しました')
    }
  }

  const renderStockList = (stocks: any[], title: string, categoryKey: string, showMenu: boolean = true) => {
    const isCollapsed = collapsedCategories.has(categoryKey)
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleCategory(categoryKey)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-hover rounded transition-colors"
        >
          <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">({stocks.length})</span>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        
        {!isCollapsed && (
          <>
            {stocks.length === 0 ? (
              <div className="text-gray-500 text-sm px-3 py-2">銘柄がありません</div>
            ) : (
              <div className="space-y-1 mt-1">
                {stocks.map((stock) => (
                  <div key={stock.id} className="relative group">
                    <button
                      onClick={() => setSelectedStock(stock)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        selectedStock?.id === stock.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-dark-hover text-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{stock.name}</div>
                          <div className="text-xs text-gray-400">{stock.symbol}</div>
                        </div>
                      </div>
                    </button>
                    
                    {/* カテゴリ変更メニュー */}
                    {showMenu && (
                      <>
                        <button
                          onClick={() => setMenuOpenFor(menuOpenFor === stock.id ? null : stock.id)}
                          className={clsx(
                            'absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                            selectedStock?.id === stock.id ? 'text-white' : 'text-gray-400 hover:text-white'
                          )}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {menuOpenFor === stock.id && (
                          <div className="absolute right-0 top-10 z-50 bg-dark-surface border border-dark-border rounded-lg shadow-xl py-1 min-w-[150px]">
                            <button
                              onClick={() => handleCategoryChange(stock.id, (stock.user_category || stock.category) === '保有銘柄' ? 'ウォッチリスト' : '保有銘柄')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-dark-hover transition-colors"
                            >
                              {(stock.user_category || stock.category) === '保有銘柄' ? 'ウォッチリストへ' : '保有銘柄へ'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {/* トグルボタン */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-80 bg-dark-surface border-r border-dark-border transition-transform duration-300 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-16 pb-4">
          {/* ヘッダー */}
          <div className="px-4 mb-4">
            <h1 className="text-2xl font-bold text-white">Stock Chart</h1>
            <p className="text-sm text-gray-400 mt-1">Technical Analysis Tool</p>
          </div>

          {/* 検索ボックス */}
          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="銘柄を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="text-xs text-gray-400 mt-1">
                検索中: "{searchQuery}"
              </div>
            )}
          </div>

          {/* 銘柄一覧 */}
          <div className="flex-1 overflow-y-auto px-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8">読み込み中...</div>
            ) : filteredStocks.length === 0 && filteredIndices.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {searchQuery ? '検索結果がありません' : '銘柄がありません'}
              </div>
            ) : (
              <>
                {filteredIndices.length > 0 && renderStockList(filteredIndices, '主要指標', 'indices', false)}
                {renderStockList(ownedStocks, '保有銘柄', 'owned')}
                {renderStockList(watchlistStocks, 'ウォッチリスト', 'watchlist')}
              </>
            )}
          </div>

          {/* フッター */}
          <div className="px-4 pt-4 border-t border-dark-border space-y-2">
            <button
              onClick={() => setShowStockSearch(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Search size={16} />
              <span>銘柄を検索して登録</span>
            </button>
            <button
              onClick={() => setShowStockManager(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Settings size={16} />
              <span>銘柄管理</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 銘柄検索モーダル */}
      <StockSearch
        isOpen={showStockSearch}
        onClose={() => setShowStockSearch(false)}
        onStockAdded={loadStocks}
      />

      {/* 銘柄管理モーダル */}
      <StockManager
        isOpen={showStockManager}
        onClose={() => setShowStockManager(false)}
        onUpdate={loadStocks}
      />
    </>
  )
}
