import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { portfolioApi } from '@/services/api'
import type { PortfolioHistoryPoint } from '@/services/api'

const PERIODS = [
  { value: '1w',  label: '1週間' },
  { value: '1mo', label: '1ヶ月' },
  { value: '3mo', label: '3ヶ月' },
  { value: '6mo', label: '6ヶ月' },
  { value: '1y',  label: '1年' },
]

const formatYAxis = (value: number): string => {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億`
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}万`
  return value.toLocaleString()
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { total_value, dayChange, dayChangeRate } = payload[0].payload
    const isPos = dayChange == null ? null : dayChange >= 0
    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        <p className="text-white font-semibold mb-1">¥{total_value.toLocaleString()}</p>
        {dayChange != null && (
          <p className={`text-sm font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
            前日比 {isPos ? '+' : ''}¥{dayChange.toLocaleString()}
            <span className="ml-1">({isPos ? '+' : ''}{dayChangeRate}%)</span>
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function PortfolioTrendChart() {
  const [period, setPeriod] = useState('1w')
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    portfolioApi.getPortfolioHistory(period)
      .then((data) => setHistory(data.history))
      .catch((err) => console.error('Failed to fetch portfolio history:', err))
      .finally(() => setLoading(false))
  }, [period])

  const isEmpty = !loading && history.length === 0

  // ---- 統計計算 ----
  const first = history[0]?.total_value ?? 0
  const last = history[history.length - 1]?.total_value ?? 0
  const prev = history.length >= 2 ? history[history.length - 2].total_value : last

  const periodChange = last - first
  const periodChangeRate = first > 0 ? ((periodChange / first) * 100).toFixed(2) : '0.00'
  const isPeriodPositive = periodChange >= 0

  const dayChange = Math.round(last - prev)
  const dayChangeRate = prev > 0 ? ((dayChange / prev) * 100).toFixed(2) : '0.00'
  const isDayPositive = dayChange >= 0

  const strokeColor = isPeriodPositive ? '#4ade80' : '#f87171'
  const gradientId = isPeriodPositive ? 'trendGreenGradient' : 'trendRedGradient'
  const stopColor = isPeriodPositive ? '#4ade80' : '#f87171'

  // Y軸範囲
  const values = history.map((p) => p.total_value)
  const minVal = values.length ? Math.min(...values) : 0
  const maxVal = values.length ? Math.max(...values) : 0
  const padding = (maxVal - minVal) * 0.5 || maxVal * 0.02
  const yMin = Math.floor((minVal - padding) / 1000) * 1000
  const yMax = Math.ceil((maxVal + padding) / 1000) * 1000

  const chartData = history.map((p, i) => {
    const prevValue = i > 0 ? history[i - 1].total_value : null
    const dc = prevValue != null ? Math.round(p.total_value - prevValue) : null
    const dcr = prevValue != null && prevValue > 0
      ? ((p.total_value - prevValue) / prevValue * 100).toFixed(2)
      : null
    return { ...p, date: formatDate(p.date), dayChange: dc, dayChangeRate: dcr }
  })

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">評価額推移</h2>
          {/* 期間プルダウン */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-dark-bg border border-dark-border text-gray-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {!loading && history.length > 0 && (
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-sm text-gray-400">前日比</p>
              <p className={`text-lg font-semibold ${isDayPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isDayPositive ? '+' : ''}¥{dayChange.toLocaleString()}
                <span className="text-sm ml-1">({isDayPositive ? '+' : ''}{dayChangeRate}%)</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">期間変動</p>
              <p className={`text-lg font-semibold ${isPeriodPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPeriodPositive ? '+' : ''}¥{periodChange.toLocaleString()}
                <span className="text-sm ml-1">({isPeriodPositive ? '+' : ''}{periodChangeRate}%)</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* チャート本体 */}
      {loading ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          読み込み中...
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
          データがありません
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stopColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={stopColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
              domain={[yMin, yMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total_value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ fill: strokeColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
