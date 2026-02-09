import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Holding } from '@/store/portfolioStore'

interface HoldingsPieChartProps {
  holdings: Holding[]
}

// スタイリッシュなカラーパレット（落ち着いたトーン）
const COLORS = [
  '#26a69a', // teal (メインカラー)
  '#4fc3f7', // light blue
  '#66bb6a', // green
  '#5c6bc0', // indigo
  '#78909c', // blue grey
  '#9575cd', // deep purple
  '#7986cb', // indigo light
  '#4db6ac', // teal light
  '#81c784', // green light
  '#64b5f6', // blue light
]

export default function HoldingsPieChart({ holdings }: HoldingsPieChartProps) {
  // 円グラフ用のデータを準備
  const chartData = holdings.map((holding) => ({
    name: holding.name,
    value: holding.current_value,
    weight: holding.weight,
  }))

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">{data.name}</p>
          <p className="text-gray-400 text-sm">
            評価額: ¥{data.value.toLocaleString()}
          </p>
          <p className="text-chart-green text-sm font-semibold">
            割合: {data.weight.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  // カスタムラベルライン（直角）
  const renderLabelLine = (entry: any) => {
    const { cx, cy, midAngle, outerRadius } = entry
    const RADIAN = Math.PI / 180

    // 円の端の座標
    const innerX = cx + outerRadius * Math.cos(-midAngle * RADIAN)
    const innerY = cy + outerRadius * Math.sin(-midAngle * RADIAN)

    // 横方向の延長距離
    const extension = 20
    const finalX = cx + (outerRadius + extension) * Math.cos(-midAngle * RADIAN)

    // 直角ライン: 円から少し外に出て、そこから横に曲がる
    const bendX = innerX + 10 * Math.cos(-midAngle * RADIAN)
    const bendY = innerY + 10 * Math.sin(-midAngle * RADIAN)

    return (
      <path
        d={`M ${innerX},${innerY} L ${bendX},${bendY} L ${finalX},${bendY}`}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        fill="none"
      />
    )
  }

  // カスタムラベル（銘柄名と割合を表示）
  const renderLabel = (entry: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = entry
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 25
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '13px', fontWeight: '500' }}
      >
        {entry.weight < 10
          ? `${entry.weight.toFixed(1)}%`
          : `${entry.name} ${entry.weight.toFixed(1)}%`}
      </text>
    )
  }

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-6">
      <h2 className="text-xl font-bold text-white mb-4">保有割合</h2>
      <ResponsiveContainer width="100%" height={450}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={renderLabelLine}
            label={renderLabel}
            outerRadius={130}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
