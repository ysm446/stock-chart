import { useState } from 'react'
import { TrendingUp, ChevronDown } from 'lucide-react'
import { useChartStore, Indicator } from '@/store/chartStore'
import clsx from 'clsx'

export default function IndicatorControls() {
  const [isOpen, setIsOpen] = useState(false)
  const { indicators, toggleIndicator, showVolume, setShowVolume } = useChartStore()

  const indicatorLabels: Record<Indicator['type'], string> = {
    sma25: '移動平均線 25日',
    sma50: '移動平均線 50日',
    sma75: '移動平均線 75日',
    ema: '指数移動平均 (EMA)',
    bollinger: 'ボリンジャーバンド',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors"
      >
        <TrendingUp size={18} />
        <span className="text-sm font-medium">指標</span>
        <ChevronDown size={16} className={clsx('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-20">
            <div className="p-2">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors"
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded border-2 transition-colors',
                    showVolume
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-500'
                  )}
                >
                  {showVolume && (
                    <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6 11L13 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">出来高</div>
                </div>
              </button>
              <div className="my-2 border-t border-dark-border" />
              {indicators.map((indicator) => (
                <button
                  key={indicator.type}
                  onClick={() => toggleIndicator(indicator.type)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors"
                >
                  <div
                    className={clsx(
                      'w-4 h-4 rounded border-2 transition-colors',
                      indicator.visible
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-500'
                    )}
                  >
                    {indicator.visible && (
                      <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8L6 11L13 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{indicatorLabels[indicator.type]}</div>
                    {indicator.period && (
                      <div className="text-xs text-gray-500">期間: {indicator.period}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
