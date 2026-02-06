import { useState } from 'react'

interface MetricBadgeProps {
  label: string
  value: number | null | undefined
  unit?: string
}

const tooltips: Record<string, string> = {
  'PER': '株価収益率（Price Earnings Ratio）。株価÷1株当たり利益。低いほど割安とされ、一般的に15倍以下が割安の目安。',
  'PBR': '株価純資産倍率（Price Book-value Ratio）。株価÷1株当たり純資産。1倍以下は解散価値を下回り割安とされる。',
  'ROE': '自己資本利益率（Return On Equity）。純利益÷自己資本×100。高いほど効率的に利益を出しており、8%以上が一つの目安。',
  '配当利回り': '1株当たりの年間配当金÷株価×100。高いほど投資額に対するリターンが大きい。3%以上で高配当とされる。',
  '時価総額': '株価×発行済株式数。企業の市場における評価規模を表す。',
}

export default function MetricBadge({ label, value, unit = '' }: MetricBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const formatValue = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A'

    // 大きな数値（時価総額など）はn兆n億形式で表示
    if (Math.abs(val) >= 100000000) {
      const oku = Math.floor(val / 100000000) // 億単位
      const cho = Math.floor(oku / 10000)     // 兆単位
      const remainOku = oku % 10000           // 兆未満の億
      if (cho > 0) {
        return remainOku > 0 ? `${cho}兆${remainOku}億円` : `${cho}兆円`
      }
      return `${oku}億円`
    }

    // 小数点以下2桁まで表示
    return val.toFixed(2)
  }

  const tooltip = tooltips[label]

  return (
    <div
      className="relative px-3 py-1 bg-dark-surface border border-dark-border rounded cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-xs text-gray-400">{label}</span>
      <span className="ml-2 text-sm font-semibold text-white">
        {value !== null && value !== undefined ? (
          // 時価総額は専用フォーマット、それ以外は通常フォーマット + 単位
          label === '時価総額' ? formatValue(value) : `${formatValue(value)}${unit}`
        ) : (
          'N/A'
        )}
      </span>
      {showTooltip && tooltip && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg text-xs text-gray-200 leading-relaxed">
          <div className="font-bold text-white mb-1">{label}</div>
          {tooltip}
        </div>
      )}
    </div>
  )
}
