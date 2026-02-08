import { useState, useEffect } from 'react'
import { Building2, Globe, Users, MapPin, Phone, RefreshCw } from 'lucide-react'
import { companyApi, CompanyInfo as CompanyInfoType } from '@/services/api'
import { useChartStore } from '@/store/chartStore'

export default function CompanyInfo() {
  const { selectedStock } = useChartStore()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoType | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedStock) {
      loadCompanyInfo()
    }
  }, [selectedStock])

  const loadCompanyInfo = async () => {
    if (!selectedStock) return

    setLoading(true)
    setError(null)
    try {
      const data = await companyApi.getCompanyInfo(selectedStock.symbol)
      setCompanyInfo(data)
    } catch (err) {
      console.error('Failed to load company info:', err)
      setError('企業情報の取得に失敗しました')
      setCompanyInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!selectedStock) return

    setRefreshing(true)
    setError(null)
    try {
      const data = await companyApi.refreshCompanyInfo(selectedStock.symbol)
      setCompanyInfo(data)
    } catch (err) {
      console.error('Failed to refresh company info:', err)
      setError('企業情報の更新に失敗しました')
    } finally {
      setRefreshing(false)
    }
  }

  if (!selectedStock) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
        <button
          onClick={loadCompanyInfo}
          className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
        >
          再試行
        </button>
      </div>
    )
  }

  if (!companyInfo) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        企業情報が見つかりません
      </div>
    )
  }

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | null | undefined }) => {
    if (!value) return null
    return (
      <div className="flex gap-2 py-2 border-b border-dark-border last:border-0">
        <Icon size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-0.5">{label}</div>
          <div className="text-sm text-white break-words">{value}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 更新ボタン */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        <span>{refreshing ? '更新中...' : '情報を更新'}</span>
      </button>

      {/* 基本情報 */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-blue-400" />
          基本情報
        </h3>
        <div className="space-y-1">
          <InfoRow icon={Building2} label="正式名称" value={companyInfo.long_name} />
          <InfoRow icon={Building2} label="業種" value={companyInfo.industry} />
          <InfoRow icon={Building2} label="セクター" value={companyInfo.sector} />
          <InfoRow icon={Users} label="従業員数" value={companyInfo.full_time_employees?.toLocaleString()} />
        </div>
      </div>

      {/* 事業概要 */}
      {companyInfo.business_summary && (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-2">事業概要</h3>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
            {companyInfo.business_summary}
          </p>
        </div>
      )}

      {/* 連絡先情報 */}
      {(companyInfo.website || companyInfo.phone || companyInfo.address || companyInfo.city) && (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            連絡先
          </h3>
          <div className="space-y-1">
            {companyInfo.website && (
              <div className="flex gap-2 py-2 border-b border-dark-border">
                <Globe size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5">ウェブサイト</div>
                  <a
                    href={companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 break-all"
                  >
                    {companyInfo.website}
                  </a>
                </div>
              </div>
            )}
            <InfoRow icon={Phone} label="電話番号" value={companyInfo.phone} />
            <InfoRow
              icon={MapPin}
              label="所在地"
              value={[companyInfo.address, companyInfo.city, companyInfo.state, companyInfo.country]
                .filter(Boolean)
                .join(', ')}
            />
          </div>
        </div>
      )}

      {/* データソース */}
      <div className="text-xs text-gray-500 text-center">
        データソース: {companyInfo.data_source}
        <br />
        最終更新: {new Date(companyInfo.updated_at).toLocaleString('ja-JP')}
      </div>
    </div>
  )
}
