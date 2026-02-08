import { useEffect, useState } from 'react'
import { Menu, X, Settings, Search, MoreVertical, Edit, ChevronDown, ChevronRight, ShoppingCart, Building2 } from 'lucide-react'
import { useChartStore } from '@/store/chartStore'
import { chartApi } from '@/services/api'
import api from '@/services/api'
import StockManager from './StockManager'
import StockSearch from './StockSearch'
import PurchaseManager from './PurchaseManager'
import CompanyInfo from './CompanyInfo'
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
  const [showPurchasePanel, setShowPurchasePanel] = useState(false)
  const [showCompanyPanel, setShowCompanyPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allStocks, setAllStocks] = useState<any[]>([])
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'indices' | 'owned' | 'watchlist'>('owned')

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
    { id: -1, symbol: '^N225', name: '日経平均株価', sector: '主要指標', market: 'Tokyo' },
    { id: -2, symbol: 'USDJPY=X', name: '米ドル/円', sector: '主要指標', market: 'FX' }
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

  const ownedStocks = filteredStocks.filter(stock => stock.user_category === '保有銘柄')
  const watchlistStocks = filteredStocks.filter(stock => stock.user_category === 'ウォッチリスト')

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

  const renderStockList = (stocks: any[], showMenu: boolean = true) => {
    if (stocks.length === 0) {
      return <div className="text-gray-500 text-sm px-3 py-8 text-center">銘柄がありません</div>
    }

    return (
      <div className="space-y-1">
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
                      onClick={() => handleCategoryChange(stock.id, stock.user_category === '保有銘柄' ? 'ウォッチリスト' : '保有銘柄')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-dark-hover transition-colors"
                    >
                      {stock.user_category === '保有銘柄' ? '注目銘柄へ' : '保有銘柄へ'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-80 bg-dark-surface border-r border-dark-border transition-transform duration-300 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-4 pb-4">
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

          {/* タブ */}
          <div className="px-4 mb-4">
            <div className="flex gap-1 bg-dark-bg p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('indices')}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                  activeTab === 'indices'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                )}
              >
                主要指標
              </button>
              <button
                onClick={() => setActiveTab('owned')}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                  activeTab === 'owned'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                )}
              >
                保有銘柄
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                  activeTab === 'watchlist'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                )}
              >
                注目銘柄
              </button>
            </div>
          </div>

          {/* 銘柄一覧 */}
          <div className="flex-1 overflow-y-auto px-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8">読み込み中...</div>
            ) : (
              <>
                {activeTab === 'indices' && renderStockList(filteredIndices, false)}
                {activeTab === 'owned' && renderStockList(ownedStocks, true)}
                {activeTab === 'watchlist' && renderStockList(watchlistStocks, true)}
              </>
            )}
          </div>

          {/* フッター */}
          <div className="px-4 pt-4 border-t border-dark-border space-y-2">
            {selectedStock && (
              <>
                <button
                  onClick={() => setShowPurchasePanel(!showPurchasePanel)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <ShoppingCart size={16} />
                  <span>購入履歴</span>
                </button>
                <button
                  onClick={() => setShowCompanyPanel(!showCompanyPanel)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <Building2 size={16} />
                  <span>企業情報</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowStockSearch(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
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

      {/* 購入履歴パネル */}
      <aside
        className={clsx(
          'fixed left-80 top-0 h-screen w-80 bg-dark-surface border-r border-dark-border transition-transform duration-300 z-30 overflow-y-auto',
          showPurchasePanel && selectedStock ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-16 pb-4">
          {/* ヘッダー */}
          <div className="px-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">購入履歴</h2>
              <p className="text-sm text-gray-400 mt-1">{selectedStock?.name}</p>
            </div>
            <button
              onClick={() => setShowPurchasePanel(false)}
              className="p-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-dark-hover transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 購入履歴コンテンツ */}
          <div className="flex-1 overflow-y-auto px-4">
            <PurchaseManager />
          </div>
        </div>
      </aside>

      {/* 企業情報パネル */}
      <aside
        className={clsx(
          'fixed left-80 top-0 h-screen w-80 bg-dark-surface border-r border-dark-border transition-transform duration-300 z-30 overflow-y-auto',
          showCompanyPanel && selectedStock ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-16 pb-4">
          {/* ヘッダー */}
          <div className="px-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">企業情報</h2>
              <p className="text-sm text-gray-400 mt-1">{selectedStock?.name}</p>
            </div>
            <button
              onClick={() => setShowCompanyPanel(false)}
              className="p-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-dark-hover transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 企業情報コンテンツ */}
          <div className="flex-1 overflow-y-auto px-4">
            <CompanyInfo />
          </div>
        </div>
      </aside>
    </>
  )
}
