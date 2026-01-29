import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, LineData } from 'lightweight-charts'
import { useChartStore } from '@/store/chartStore'
import { chartApi, ChartData, purchaseApi } from '@/services/api'
import TimeframeSelector from './TimeframeSelector'
import IndicatorControls from './IndicatorControls'
import { Eye, EyeOff } from 'lucide-react'

export default function ChartPanel() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  
  const { selectedStock, timeframe, indicators, showPeaks, setShowPeaks, showVolume, purchases, setPurchases, showPurchaseMarkers, setShowPurchaseMarkers } = useChartStore()
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [peaks, setPeaks] = useState<ChartData[]>([])
  const [valleys, setValleys] = useState<ChartData[]>([])
  const [fullChartData, setFullChartData] = useState<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // チャート初期化
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0f0f0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderUpColor: '#ef5350',
      borderDownColor: '#26a69a',
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    })

    // 出来高ヒストグラムを追加
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // リサイズ処理
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (selectedStock) {
      loadChartData()
      loadPurchases()
    }
  }, [selectedStock, timeframe])

  useEffect(() => {
    // インジケーター表示の切り替え
    if (fullChartData) {
      renderIndicators(fullChartData)
    }
  }, [indicators])

  useEffect(() => {
    // ピーク・谷・購入履歴マーカー表示の切り替え
    if (candlestickSeriesRef.current && chartData.length > 0) {
      const markers = []

      // Peak/Valley markers (if enabled)
      if (showPeaks && (peaks.length > 0 || valleys.length > 0)) {
        markers.push(
          ...peaks.map(peak => ({
            time: peak.time as Time,
            position: 'aboveBar' as const,
            color: '#FF9800',
            shape: 'arrowDown' as const,
            text: `¥${Math.floor(peak.high).toLocaleString()}`
          })),
          ...valleys.map(valley => ({
            time: valley.time as Time,
            position: 'belowBar' as const,
            color: '#2196F3',
            shape: 'arrowUp' as const,
            text: `¥${Math.floor(valley.low).toLocaleString()}`
          }))
        )
      }

      // Purchase markers (if enabled)
      if (showPurchaseMarkers && selectedStock) {
        const stockPurchases = purchases.filter(p => p.stock_id === selectedStock.id)

        // Group purchases by date to handle multiple purchases on same day
        const purchasesByDate = new Map<string, typeof stockPurchases>()
        stockPurchases.forEach(purchase => {
          const dateKey = purchase.purchase_date
          if (!purchasesByDate.has(dateKey)) {
            purchasesByDate.set(dateKey, [])
          }
          purchasesByDate.get(dateKey)!.push(purchase)
        })

        // Create markers for each date
        purchasesByDate.forEach((datePurchases, dateKey) => {
          const totalQty = datePurchases.reduce((sum, p) => sum + p.quantity, 0)
          const avgPrice = datePurchases.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0) / totalQty

          markers.push({
            time: dateKey as Time,
            position: 'inBar' as const,
            color: '#FF9800', // Orange color for purchases
            shape: 'circle' as const,
          })
        })
      }

      // Sort markers by time
      markers.sort((a, b) => {
        const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time
        const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time
        return timeA - timeB
      })

      candlestickSeriesRef.current.setMarkers(markers)
    }
  }, [showPeaks, showPurchaseMarkers, peaks, valleys, purchases, selectedStock, chartData])

  useEffect(() => {
    // 出来高表示の切り替え
    if (volumeSeriesRef.current && chartData.length > 0) {
      if (showVolume) {
        const volumeData = chartData.map((item: ChartData) => ({
          time: item.time as Time,
          value: item.volume,
          color: item.close >= item.open ? '#ef535080' : '#26a69a80',
        }))
        volumeSeriesRef.current.setData(volumeData)
      } else {
        volumeSeriesRef.current.setData([])
      }
    }
  }, [showVolume, chartData])

  const loadPurchases = async () => {
    if (!selectedStock) return
    try {
      const data = await purchaseApi.getPurchases(selectedStock.id)
      setPurchases(data)
    } catch (error) {
      console.error('Failed to load purchases:', error)
    }
  }

  const loadChartData = async () => {
    if (!selectedStock || !chartRef.current || !candlestickSeriesRef.current) return

    setLoading(true)
    console.log('Loading chart data for:', selectedStock.symbol, 'timeframe:', timeframe)
    try {
      const data = await chartApi.getChartData(selectedStock.symbol, timeframe)
      console.log('Received chart data:', data)
      
      // ローソク足データをセット
      const candlestickData: CandlestickData<Time>[] = data.data.map((item: ChartData) => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      console.log('Candlestick data count:', candlestickData.length)
      candlestickSeriesRef.current.setData(candlestickData)

      // 出来高データをセット
      if (volumeSeriesRef.current) {
        if (showVolume) {
          const volumeData = data.data.map((item: ChartData) => ({
            time: item.time as Time,
            value: item.volume,
            color: item.close >= item.open ? '#ef535080' : '#26a69a80',
          }))
          volumeSeriesRef.current.setData(volumeData)
        } else {
          volumeSeriesRef.current.setData([])
        }
      }

      // データとピーク・谷を保存
      setChartData(data.data)
      setFullChartData(data)
      const detectedPeaks = detectPeaks(data.data)
      const detectedValleys = detectValleys(data.data)
      setPeaks(detectedPeaks)
      setValleys(detectedValleys)
      console.log('Detected peaks:', detectedPeaks.length, 'valleys:', detectedValleys.length)

      // インジケーター描画
      renderIndicators(data)

      // チャートを最新データにフィット
      chartRef.current.timeScale().fitContent()
      console.log('Chart loaded successfully')
    } catch (error) {
      console.error('Failed to load chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectPeaks = (data: ChartData[]) => {
    if (!data || data.length < 21) return []
    
    const peaks: ChartData[] = []
    const windowSize = 10
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const current = data[i]
      let isPeak = true
      
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && j >= 0 && j < data.length && data[j].high >= current.high) {
          isPeak = false
          break
        }
      }
      
      if (isPeak) {
        peaks.push(current)
      }
    }
    
    return peaks
  }

  const detectValleys = (data: ChartData[]) => {
    if (!data || data.length < 21) return []
    
    const valleys: ChartData[] = []
    const windowSize = 10
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const current = data[i]
      let isValley = true
      
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && j >= 0 && j < data.length && data[j].low <= current.low) {
          isValley = false
          break
        }
      }
      
      if (isValley) {
        valleys.push(current)
      }
    }
    
    return valleys
  }

  const renderIndicators = (data: any) => {
    if (!chartRef.current) return

    // 既存のインジケーター系列を削除
    indicatorSeriesRef.current.forEach(series => {
      chartRef.current?.removeSeries(series)
    })
    indicatorSeriesRef.current.clear()

    // 各インジケーターを描画
    indicators.forEach(indicator => {
      if (!indicator.visible) return

      if (indicator.type === 'sma25' && data.sma25) {
        const sma25Series = chartRef.current!.addLineSeries({
          color: '#FFD600',
          lineWidth: 1,
          title: 'SMA(25)',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const sma25Data: LineData<Time>[] = data.sma25.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        sma25Series.setData(sma25Data)
        indicatorSeriesRef.current.set('sma25', sma25Series)
      }

      if (indicator.type === 'sma50' && data.sma50) {
        const sma50Series = chartRef.current!.addLineSeries({
          color: '#FF6D00',
          lineWidth: 1,
          title: 'SMA(50)',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const sma50Data: LineData<Time>[] = data.sma50.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        sma50Series.setData(sma50Data)
        indicatorSeriesRef.current.set('sma50', sma50Series)
      }

      if (indicator.type === 'sma75' && data.sma75) {
        const sma75Series = chartRef.current!.addLineSeries({
          color: '#00C853',
          lineWidth: 1,
          title: 'SMA(75)',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const sma75Data: LineData<Time>[] = data.sma75.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        sma75Series.setData(sma75Data)
        indicatorSeriesRef.current.set('sma75', sma75Series)
      }

      if (indicator.type === 'ema' && data.ema) {
        const emaSeries = chartRef.current!.addLineSeries({
          color: '#FFD600',
          lineWidth: 2,
          title: `EMA(${indicator.period})`,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const emaData: LineData<Time>[] = data.ema.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        emaSeries.setData(emaData)
        indicatorSeriesRef.current.set('ema', emaSeries)
      }

      if (indicator.type === 'bollinger' && data.bollinger) {
        // 上限バンド
        const upperSeries = chartRef.current!.addLineSeries({
          color: '#00BCD4',
          lineWidth: 1,
          title: 'BB Upper',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const upperData: LineData<Time>[] = data.bollinger.upper.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        upperSeries.setData(upperData)
        indicatorSeriesRef.current.set('bb_upper', upperSeries)

        // 中央線
        const middleSeries = chartRef.current!.addLineSeries({
          color: '#00BCD4',
          lineWidth: 1,
          title: 'BB Middle',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const middleData: LineData<Time>[] = data.bollinger.middle.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        middleSeries.setData(middleData)
        indicatorSeriesRef.current.set('bb_middle', middleSeries)

        // 下限バンド
        const lowerSeries = chartRef.current!.addLineSeries({
          color: '#00BCD4',
          lineWidth: 1,
          title: 'BB Lower',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const lowerData: LineData<Time>[] = data.bollinger.lower.map((item: any) => ({
          time: item.time as Time,
          value: item.value,
        }))
        lowerSeries.setData(lowerData)
        indicatorSeriesRef.current.set('bb_lower', lowerSeries)
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedStock?.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{selectedStock?.symbol}</span>
              <span>•</span>
              <span>{selectedStock?.sector}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPeaks(!showPeaks)}
              className="flex items-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-hover transition-colors"
              title={showPeaks ? 'ピークを非表示' : 'ピークを表示'}
            >
              {showPeaks ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="text-sm">ピーク</span>
            </button>
            <button
              onClick={() => setShowPurchaseMarkers(!showPurchaseMarkers)}
              className="flex items-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-hover transition-colors"
              title={showPurchaseMarkers ? '購入履歴を非表示' : '購入履歴を表示'}
            >
              {showPurchaseMarkers ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="text-sm">購入履歴</span>
            </button>
            <TimeframeSelector />
            <IndicatorControls />
          </div>
        </div>
      </header>

      {/* チャートエリア */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg bg-opacity-50 z-10">
            <div className="text-gray-400">データ読み込み中...</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
