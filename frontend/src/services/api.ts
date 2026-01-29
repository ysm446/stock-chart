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

export interface Purchase {
  id: number
  stock_id: number
  purchase_date: string
  quantity: number
  purchase_price: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface PurchaseCreate {
  stock_id: number
  purchase_date: string
  quantity: number
  purchase_price: number
  notes?: string
}

export interface PurchaseUpdate {
  purchase_date?: string
  quantity?: number
  purchase_price?: number
  notes?: string
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

export const purchaseApi = {
  async getPurchases(stockId?: number): Promise<Purchase[]> {
    const params = stockId ? { stock_id: stockId } : {}
    const response = await api.get('/purchases', { params })
    return response.data
  },

  async createPurchase(purchase: PurchaseCreate): Promise<Purchase> {
    const response = await api.post('/purchases', purchase)
    return response.data
  },

  async updatePurchase(id: number, updates: PurchaseUpdate): Promise<Purchase> {
    const response = await api.put(`/purchases/${id}`, updates)
    return response.data
  },

  async deletePurchase(id: number): Promise<void> {
    await api.delete(`/purchases/${id}`)
  }
}

export default api
