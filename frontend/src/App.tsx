import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/layout/Navigation'
import ChartPage from './pages/ChartPage'
import PortfolioPage from './pages/PortfolioPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-dark-bg">
        <Navigation />
        <Routes>
          <Route path="/" element={<ChartPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
