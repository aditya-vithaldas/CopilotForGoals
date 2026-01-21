import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';

// Header
function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">Copilot for Goals</span>
          </a>
        </div>
      </div>
    </header>
  );
}

// Main layout
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <GoalsPage />
          </Layout>
        } />
        <Route path="/goals/:id" element={
          <Layout>
            <GoalDetailPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
