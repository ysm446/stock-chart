import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Purchase } from '@/services/api'

export interface Stock {
  id: number
  symbol: string
  name: string
  market: string
  sector: string
  user_category?: string
}

export interface Watchlist {
  id: number
  name: string
  color: string
  stocks: Stock[]
}

export type Timeframe = '1d' | '1wk' | '1mo'

export interface Indicator {
  type: 'sma25' | 'sma50' | 'sma75' | 'ema' | 'bollinger'
  visible: boolean
  period?: number
}

interface ChartStore {
  selectedStock: Stock | null
  timeframe: Timeframe
  indicators: Indicator[]
  watchlists: Watchlist[]
  showPeaks: boolean
  showVolume: boolean
  purchases: Purchase[]
  showPurchaseMarkers: boolean

  setSelectedStock: (stock: Stock | null) => void
  setTimeframe: (timeframe: Timeframe) => void
  toggleIndicator: (type: Indicator['type']) => void
  setWatchlists: (watchlists: Watchlist[]) => void
  setShowPeaks: (show: boolean) => void
  setShowVolume: (show: boolean) => void
  setPurchases: (purchases: Purchase[]) => void
  setShowPurchaseMarkers: (show: boolean) => void
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set) => ({
      selectedStock: null,
      timeframe: '1d',
      indicators: [
        { type: 'sma25', visible: false, period: 25 },
        { type: 'sma50', visible: false, period: 50 },
        { type: 'sma75', visible: false, period: 75 },
        { type: 'ema', visible: false, period: 12 },
        { type: 'bollinger', visible: false, period: 20 },
      ],
      watchlists: [],
      showPeaks: true,
      showVolume: true,
      purchases: [],
      showPurchaseMarkers: true,

      setSelectedStock: (stock) => set({ selectedStock: stock }),
      setTimeframe: (timeframe) => set({ timeframe }),
      toggleIndicator: (type) =>
        set((state) => ({
          indicators: state.indicators.map((ind) =>
            ind.type === type ? { ...ind, visible: !ind.visible } : ind
          ),
        })),
      setWatchlists: (watchlists) => set({ watchlists }),
      setShowPeaks: (show) => set({ showPeaks: show }),
      setShowVolume: (show) => set({ showVolume: show }),
      setPurchases: (purchases) => set({ purchases }),
      setShowPurchaseMarkers: (show) => set({ showPurchaseMarkers: show }),
    }),
    {
      name: 'chart-storage',
      partialize: (state) => ({
        timeframe: state.timeframe,
        indicators: state.indicators,
        showPeaks: state.showPeaks,
        showVolume: state.showVolume,
        showPurchaseMarkers: state.showPurchaseMarkers,
      }),
    }
  )
)
