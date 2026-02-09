import { create } from 'zustand'

export interface PortfolioSummary {
  total_value: number
  total_cost: number
  total_profit_loss: number
  profit_loss_rate: number
  total_annual_dividend: number
}

export interface Holding {
  stock_id: number
  symbol: string
  name: string
  sector: string
  total_quantity: number
  average_price: number
  total_cost: number
  current_price: number
  current_value: number
  profit_loss: number
  profit_loss_rate: number
  dividend_yield: number
  annual_dividend: number
  weight: number
}

export interface PortfolioData {
  summary: PortfolioSummary
  holdings: Holding[]
}

interface PortfolioStore {
  summary: PortfolioSummary | null
  holdings: Holding[]
  loading: boolean
  error: string | null

  setPortfolioData: (data: PortfolioData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  summary: null,
  holdings: [],
  loading: false,
  error: null,

  setPortfolioData: (data) =>
    set({
      summary: data.summary,
      holdings: data.holdings,
      loading: false,
      error: null,
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) =>
    set({
      error,
      loading: false,
    }),

  clearError: () => set({ error: null }),
}))
