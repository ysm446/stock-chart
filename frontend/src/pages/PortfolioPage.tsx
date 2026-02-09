import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useChartStore } from '@/store/chartStore'
import { portfolioApi } from '@/services/api'
import HoldingsPieChart from '@/components/portfolio/HoldingsPieChart'

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { summary, holdings, loading, error, setPortfolioData, setLoading, setError } = usePortfolioStore()
  const setSelectedStock = useChartStore(state => state.setSelectedStock)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true)
        const data = await portfolioApi.getPortfolioSummary()
        setPortfolioData(data)
      } catch (err) {
        console.error('Failed to fetch portfolio:', err)
        setError('ポートフォリオデータの取得に失敗しました')
      }
    }

    fetchPortfolio()
  }, [setPortfolioData, setLoading, setError])

  // 銘柄クリックでチャート画面へ遷移
  const handleStockClick = (holding: typeof holdings[0]) => {
    setSelectedStock({
      id: holding.stock_id,
      symbol: holding.symbol,
      name: holding.name,
      market: 'Tokyo',
      sector: holding.sector,
      user_category: '保有銘柄'
    })
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-xl">{error}</p>
        </div>
      </div>
    )
  }

  if (!summary || holdings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl">購入履歴がありません</p>
          <p className="text-sm mt-2">チャート画面で銘柄の購入履歴を登録してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">ポートフォリオ</h1>
          <p className="text-gray-400 mt-1">保有銘柄の分析</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 総評価額 */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <p className="text-sm text-gray-400 mb-2">総評価額</p>
            <p className="text-3xl font-bold text-white">
              ¥{summary.total_value.toLocaleString()}
            </p>
          </div>

          {/* 総取得金額 */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <p className="text-sm text-gray-400 mb-2">総取得金額</p>
            <p className="text-2xl font-semibold text-white">
              ¥{summary.total_cost.toLocaleString()}
            </p>
          </div>

          {/* 総損益 */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <p className="text-sm text-gray-400 mb-2">総損益</p>
            <p className={`text-2xl font-semibold ${summary.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.total_profit_loss >= 0 ? '+' : ''}¥{summary.total_profit_loss.toLocaleString()}
            </p>
            <p className={`text-sm mt-1 ${summary.profit_loss_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.profit_loss_rate >= 0 ? '+' : ''}{summary.profit_loss_rate.toFixed(2)}%
            </p>
          </div>

          {/* 年間配当金 */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <p className="text-sm text-gray-400 mb-2">年間配当金</p>
            <p className="text-2xl font-semibold text-blue-400">
              ¥{summary.total_annual_dividend.toLocaleString()}
            </p>
          </div>

          {/* 銘柄数 */}
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <p className="text-sm text-gray-400 mb-2">保有銘柄数</p>
            <p className="text-2xl font-semibold text-white">
              {holdings.length}
            </p>
          </div>
        </div>

        {/* 保有割合円グラフ */}
        <HoldingsPieChart holdings={holdings} />

        {/* 保有銘柄テーブル */}
        <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-border">
            <h2 className="text-xl font-bold text-white">保有銘柄</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">銘柄</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">保有数</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">平均単価</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">現在価格</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">評価額</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">損益</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">損益率</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">割合</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {holdings.map((holding) => (
                  <tr
                    key={holding.stock_id}
                    onClick={() => handleStockClick(holding)}
                    className="hover:bg-dark-hover transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{holding.name}</div>
                      <div className="text-xs text-gray-400">{holding.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      {holding.total_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      ¥{holding.average_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      ¥{holding.current_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      ¥{holding.current_value.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${holding.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.profit_loss >= 0 ? '+' : ''}¥{holding.profit_loss.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${holding.profit_loss_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.profit_loss_rate >= 0 ? '+' : ''}{holding.profit_loss_rate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                      {holding.weight.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
