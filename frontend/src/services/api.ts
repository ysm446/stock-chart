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

export interface QuoteData {
  current_price: number
  previous_close: number
  change: number
  change_percent: number
  market_time?: string
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
  quote?: QuoteData
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

export interface FundamentalData {
  symbol: string
  date: string
  market_cap: number | null
  per: number | null
  pbr: number | null
  eps: number | null
  bps: number | null
  roe: number | null
  dividend_yield: number | null
  revenue: number | null
  operating_income: number | null
  net_income: number | null
  data_source: string
}

export interface CompanyInfo {
  id: number
  symbol: string
  long_name: string | null
  industry: string | null
  sector: string | null
  business_summary: string | null
  website: string | null
  full_time_employees: number | null
  city: string | null
  state: string | null
  country: string | null
  address: string | null
  zip_code: string | null
  phone: string | null
  previous_close: number | null
  market_cap: number | null
  data_source: string
  created_at: string
  updated_at: string
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

export const fundamentalApi = {
  async getFundamental(symbol: string): Promise<FundamentalData> {
    const response = await api.get(`/fundamentals/${symbol}`)
    return response.data
  }
}

export const companyApi = {
  async getCompanyInfo(symbol: string): Promise<CompanyInfo> {
    const response = await api.get(`/company/${symbol}`)
    return response.data
  },

  async refreshCompanyInfo(symbol: string): Promise<CompanyInfo> {
    const response = await api.post(`/company/${symbol}/refresh`)
    return response.data
  }
}

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

export const portfolioApi = {
  async getPortfolioSummary(): Promise<PortfolioData> {
    const response = await api.get('/portfolio/summary')
    return response.data
  }
}

export default api
