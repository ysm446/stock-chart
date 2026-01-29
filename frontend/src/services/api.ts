import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export interface ChartData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IndicatorData {
  time: string
  value: number
}

export interface ChartResponse {
  symbol: string
  data: ChartData[]
  sma?: IndicatorData[]
  ema?: IndicatorData[]
  bollinger?: {
    upper: IndicatorData[]
    middle: IndicatorData[]
    lower: IndicatorData[]
  }
}

export const chartApi = {
  async getChartData(symbol: string, timeframe: string): Promise<ChartResponse> {
    const response = await api.get(`/chart/${symbol}`, {
      params: { timeframe },
    })
    return response.data
  },

  async getWatchlists() {
    const response = await api.get('/watchlists')
    return response.data
  },

  async addToWatchlist(watchlistId: number, stockId: number) {
    const response = await api.post(`/watchlists/${watchlistId}/stocks`, { stock_id: stockId })
    return response.data
  },

  async createWatchlist(name: string, color: string) {
    const response = await api.post('/watchlists', { name, color })
    return response.data
  },

  async searchStocks(query: string) {
    const response = await api.get('/stocks/search', {
      params: { q: query }
    })
    return response.data
  }
}

export default api
