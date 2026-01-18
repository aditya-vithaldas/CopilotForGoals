import { useState } from 'react';
import { Search, BarChart3, Table, MessageSquare, Download } from 'lucide-react';
import type { Connection } from '../types';

interface DatabaseViewProps {
  connection: Connection;
  viewType: string;
}

// Mock data for demonstration
const mockTables = [
  { name: 'users', rows: 15432, columns: ['id', 'email', 'name', 'created_at', 'last_login'] },
  { name: 'orders', rows: 45231, columns: ['id', 'user_id', 'total', 'status', 'created_at'] },
  { name: 'products', rows: 1245, columns: ['id', 'name', 'price', 'stock', 'category'] },
  { name: 'analytics', rows: 892341, columns: ['id', 'event', 'user_id', 'timestamp', 'data'] },
];

const mockSampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', orders: 12, total_spent: '$1,234' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', orders: 8, total_spent: '$892' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', orders: 23, total_spent: '$3,456' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', orders: 5, total_spent: '$567' },
  { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', orders: 17, total_spent: '$2,123' },
];

const mockMetrics = [
  { label: 'Total Users', value: '15,432', change: '+12%' },
  { label: 'Total Orders', value: '45,231', change: '+8%' },
  { label: 'Revenue', value: '$892,341', change: '+15%' },
  { label: 'Avg Order Value', value: '$78.50', change: '+3%' },
];

export default function DatabaseView({ connection, viewType }: DatabaseViewProps) {
  const [activeTab, setActiveTab] = useState(viewType);
  const [searchQuery, setSearchQuery] = useState('');
  const [nlQuery, setNlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const config = connection.config;

  const handleNaturalLanguageQuery = () => {
    // Simulate a query result based on the natural language input
    if (nlQuery.toLowerCase().includes('top') || nlQuery.toLowerCase().includes('highest')) {
      setQueryResult('Based on your query, here are the top 5 customers by total spending...');
    } else if (nlQuery.toLowerCase().includes('total') || nlQuery.toLowerCase().includes('sum')) {
      setQueryResult('The total revenue for the selected period is $892,341');
    } else if (nlQuery.toLowerCase().includes('average') || nlQuery.toLowerCase().includes('avg')) {
      setQueryResult('The average order value across all customers is $78.50');
    } else {
      setQueryResult('Query executed successfully. Found 234 matching records.');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {mockMetrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">{metric.label}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold text-gray-900">{metric.value}</span>
              <span className="text-sm text-green-600 mb-1">{metric.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Over Time</h3>
          <div className="h-48 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg flex items-center justify-center">
            <div className="flex items-end gap-2 h-32">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div
                  key={i}
                  className="w-8 bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          <div className="h-48 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }} />
              <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%, 0 50%)' }} />
              <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 100% 0)' }} />
              <div className="absolute inset-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Tables overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Database Tables</h3>
        <div className="grid grid-cols-2 gap-4">
          {mockTables.map((table) => (
            <div key={table.name} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{table.name}</span>
                <span className="text-sm text-gray-500">{table.rows.toLocaleString()} rows</span>
              </div>
              <div className="text-xs text-gray-500">
                Columns: {table.columns.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search records..."
          />
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Customer Report</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockSampleData
                .filter(row =>
                  !searchQuery ||
                  row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  row.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{row.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.orders}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{row.total_spent}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNaturalQuery = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Query with Natural Language</h3>
        <p className="text-gray-500 mb-4">
          Ask questions about your data in plain English. For example:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setNlQuery('Show me the top 5 customers by total spending')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Top 5 customers by spending
          </button>
          <button
            onClick={() => setNlQuery('What is the total revenue this month?')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Total revenue this month
          </button>
          <button
            onClick={() => setNlQuery('Average order value by category')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Avg order value by category
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ask a question about your data..."
              onKeyDown={(e) => e.key === 'Enter' && handleNaturalLanguageQuery()}
            />
          </div>
          <button
            onClick={handleNaturalLanguageQuery}
            disabled={!nlQuery}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </div>

        {queryResult && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-sm text-indigo-800 font-medium mb-2">Result:</div>
            <div className="text-indigo-900">{queryResult}</div>

            {nlQuery.toLowerCase().includes('top') && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-indigo-700 uppercase">Rank</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-indigo-700 uppercase">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-indigo-700 uppercase">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-200">
                    {mockSampleData.slice(0, 5).map((row, i) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 text-sm text-indigo-900">#{i + 1}</td>
                        <td className="px-3 py-2 text-sm text-indigo-900">{row.name}</td>
                        <td className="px-3 py-2 text-sm text-indigo-900 font-medium">{row.total_spent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
        <p className="text-gray-500">
          {config.host}:{config.port}/{config.database}
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('create_dashboard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'create_dashboard'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('generate_report')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'generate_report'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Table className="w-4 h-4 inline mr-2" />
          Reports
        </button>
        <button
          onClick={() => setActiveTab('natural_query')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'natural_query'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Natural Language Query
        </button>
      </div>

      {activeTab === 'create_dashboard' && renderDashboard()}
      {activeTab === 'generate_report' && renderReport()}
      {activeTab === 'natural_query' && renderNaturalQuery()}
    </div>
  );
}
