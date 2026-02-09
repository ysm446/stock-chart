import { Link, useLocation } from 'react-router-dom'
import { LineChart, PieChart } from 'lucide-react'

export default function Navigation() {
  const location = useLocation()

  return (
    <nav style={{
      width: '60px',
      backgroundColor: '#1a1a1a',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* 最初のリンク - チャート */}
      <Link
        to="/"
        style={{
          height: '64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: location.pathname === '/' ? '#252525' : 'transparent',
          textDecoration: 'none',
          position: 'relative',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/') {
            e.currentTarget.style.backgroundColor = '#252525'
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/') {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        {location.pathname === '/' && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: '#26a69a'
          }} />
        )}
        <LineChart size={24} style={{ color: location.pathname === '/' ? '#26a69a' : '#d1d5db' }} />
        <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>チャート</span>
      </Link>

      {/* 2番目のリンク - ポートフォリオ */}
      <Link
        to="/portfolio"
        style={{
          height: '64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: location.pathname === '/portfolio' ? '#252525' : 'transparent',
          textDecoration: 'none',
          position: 'relative',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/portfolio') {
            e.currentTarget.style.backgroundColor = '#252525'
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/portfolio') {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        {location.pathname === '/portfolio' && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: '#26a69a'
          }} />
        )}
        <PieChart size={24} style={{ color: location.pathname === '/portfolio' ? '#26a69a' : '#d1d5db' }} />
        <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>ポート</span>
      </Link>
    </nav>
  )
}
