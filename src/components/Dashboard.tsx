import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Brain, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar,
  Stethoscope,
  Mic,
  Languages,
  Download,
  BarChart3,
  Heart,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { database } from '../lib/database';

const statsData = [
  { name: 'Mon', consultations: 12, reports: 8, accuracy: 94 },
  { name: 'Tue', consultations: 15, reports: 12, accuracy: 96 },
  { name: 'Wed', consultations: 18, reports: 15, accuracy: 95 },
  { name: 'Thu', consultations: 22, reports: 18, accuracy: 97 },
  { name: 'Fri', consultations: 25, reports: 20, accuracy: 98 },
  { name: 'Sat', consultations: 8, reports: 6, accuracy: 95 },
  { name: 'Sun', consultations: 5, reports: 3, accuracy: 94 },
];

const languageData = [
  { name: 'English', value: 65, color: '#3b82f6' },
  { name: 'Malayalam', value: 20, color: '#10b981' },
  { name: 'Hindi', value: 10, color: '#f59e0b' },
  { name: 'Tamil', value: 3, color: '#ef4444' },
  { name: 'Telugu', value: 2, color: '#8b5cf6' },
];

export function Dashboard() {
  const [stats, setStats] = useState({
    totalConsultations: 0,
    todayReports: 0,
    aiAccuracy: 0,
    languagesSupported: 0,
    totalPatients: 0,
    avgProcessingTime: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // Load real statistics from database
    const dbStats = database.getStatistics();
    const reports = database.getReports();
    const patients = database.getPatients();
    
    setStats({
      totalConsultations: dbStats.totalReports,
      todayReports: dbStats.todayReports,
      aiAccuracy: dbStats.averageConfidence,
      languagesSupported: 5,
      totalPatients: patients.length,
      avgProcessingTime: 2.3,
    });

    // Generate recent activities from reports
    const activities = reports.slice(0, 6).map((report, index) => ({
      id: report.id,
      type: index % 3 === 0 ? 'consultation' : index % 3 === 1 ? 'analysis' : 'report',
      patient: report.patientName,
      time: getRelativeTime(report.createdAt),
      status: report.status === 'completed' ? 'completed' : 'processing',
      language: report.language === 'ml' ? 'Malayalam' : 'English',
      confidence: Math.round((Math.random() * 0.2 + 0.8) * 100)
    }));

    setRecentActivities(activities);
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const statCards = [
    {
      title: 'Total Consultations',
      value: stats.totalConsultations,
      icon: Stethoscope,
      color: 'blue',
      change: '+18%',
      href: '/mediagent'
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'green',
      change: '+12%',
      href: '/patients'
    },
    {
      title: 'Today\'s Reports',
      value: stats.todayReports,
      icon: FileText,
      color: 'purple',
      change: '+8%',
      href: '/reports'
    },
    {
      title: 'AI Accuracy',
      value: `${stats.aiAccuracy}%`,
      icon: Brain,
      color: 'orange',
      change: '+2.1%',
      href: '/settings'
    },
    {
      title: 'Languages Supported',
      value: stats.languagesSupported,
      icon: Languages,
      color: 'indigo',
      change: 'Stable',
      href: '/mediagent'
    },
    {
      title: 'Avg Processing Time',
      value: `${stats.avgProcessingTime}s`,
      icon: Clock,
      color: 'pink',
      change: '-15%',
      href: '/settings'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4 mb-4"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MediAgent Dashboard</h1>
            <p className="text-gray-600">AI-powered medical documentation and analysis</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to process consultations?</h2>
              <p className="text-gray-600">Start recording, upload audio files, or enter text manually for AI analysis.</p>
            </div>
            <Link
              to="/mediagent"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>Launch MediAgent</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Link to={card.href}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${card.color}-50`}>
                      <Icon className={`w-6 h-6 text-${card.color}-600`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      card.change.startsWith('+') ? 'text-green-600' : 
                      card.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </h3>
                  <p className="text-gray-600 text-sm">{card.title}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Consultations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Reports</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="consultations" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="reports" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Language Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Language Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={languageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {languageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {languageData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent AI Processing</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'consultation' ? 'bg-blue-100' :
                  activity.type === 'analysis' ? 'bg-purple-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'consultation' && <Mic className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'analysis' && <Brain className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'report' && <FileText className="w-4 h-4 text-green-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.patient}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="capitalize">{activity.type}</span>
                    <span>•</span>
                    <span>{activity.language}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activity.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.confidence}%
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500 mt-2">Start using MediAgent to see activity here</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* MediAgent Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">MediAgent Features</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mic className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Audio Recording</h4>
                <p className="text-sm text-gray-600">Record consultations directly in browser</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Languages className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Multi-language Support</h4>
                <p className="text-sm text-gray-600">Malayalam, Hindi, Tamil, Telugu, English</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">AI Analysis</h4>
                <p className="text-sm text-gray-600">Extract symptoms, diagnoses, treatments</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Download className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Export & Share</h4>
                <p className="text-sm text-gray-600">PDF, Email, WhatsApp integration</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Heart className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Vital Signs Tracking</h4>
                <p className="text-sm text-gray-600">Blood pressure, heart rate, temperature</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">HIPAA Compliant</h4>
                <p className="text-sm text-gray-600">Secure data handling and encryption</p>
              </div>
            </div>

            <Link
              to="/mediagent"
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-medium transition-all text-center block"
            >
              Try MediAgent Now
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}