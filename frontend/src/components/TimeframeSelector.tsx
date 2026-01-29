import { useChartStore, Timeframe } from '@/store/chartStore'
import clsx from 'clsx'

const timeframes: { value: Timeframe; label: string }[] = [
  { value: '1d', label: '日足' },
  { value: '1wk', label: '週足' },
  { value: '1mo', label: '月足' },
]

export default function TimeframeSelector() {
  const { timeframe, setTimeframe } = useChartStore()

  return (
    <div className="flex gap-1 bg-dark-bg rounded-lg p-1">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => setTimeframe(tf.value)}
          className={clsx(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            timeframe === tf.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-hover'
          )}
        >
          {tf.label}
        </button>
      ))}
    </div>
  )
}
