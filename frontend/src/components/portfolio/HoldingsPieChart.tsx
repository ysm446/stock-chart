import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Holding } from '@/store/portfolioStore'

interface HoldingsPieChartProps {
  holdings: Holding[]
}

export default function HoldingsPieChart({ holdings }: HoldingsPieChartProps) {
  // 保有割合の大きい順にソート
  const sortedHoldings = [...holdings].sort((a, b) => b.weight - a.weight)

  // 円グラフ用のデータを準備
  const chartData = sortedHoldings.map((holding) => ({
    name: holding.name,
    value: holding.current_value,
    weight: holding.weight,
  }))

  // キーカラーの色相を定義
  const keyHues = [
    210, // ブルー
    330, // ピンク
    180, // シアン
    270, // パープル
  ]

  // カラーバリエーションを生成
  const generateColorVariations = () => {
    const variations: string[] = []

    keyHues.forEach((hue) => {
      // 各色相について、明度の異なる4つのバリエーションを作成
      // 明度が低いほど彩度を高く
      const lightnessLevels = [
        { lightness: 35, saturation: 80 }, // 非常に暗い・彩度非常に高
        { lightness: 45, saturation: 75 }, // 暗い・彩度高
        { lightness: 55, saturation: 65 }, // 中間
        { lightness: 65, saturation: 55 }, // 明るい・彩度低
      ]

      lightnessLevels.forEach(({ lightness, saturation }) => {
        variations.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
      })
    })

    return variations
  }

  // カラーバリエーションを生成
  const colorVariations = generateColorVariations()

  // 各銘柄に色を順番に割り当て（保有割合の大きい順）
  const colors = chartData.map((_, index) => colorVariations[index % colorVariations.length])

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
                fill={colors[index]}
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
