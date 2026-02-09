import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChartPanel from '../components/ChartPanel'
import { useChartStore } from '../store/chartStore'

export default function ChartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const selectedStock = useChartStore(state => state.selectedStock)

  console.log('ChartPage - Selected stock:', selectedStock)

  return (
    <>
      {/* サイドバー */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* メインコンテンツ */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {selectedStock ? (
          <ChartPanel />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-xl">銘柄を選択してください</p>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
