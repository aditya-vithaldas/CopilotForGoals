import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CW</span>
                </div>
                <span className="font-semibold text-gray-900 text-lg">Cowork for Enterprise</span>
              </a>
            </div>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<GoalsPage />} />
            <Route path="/goals/:id" element={<GoalDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
