// Deployment Dashboard for MISS Legal AI System
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  FileText,
  Mic,
  Shield,
  Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MapPin,
  Languages,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { MOCK_SYSTEM_METRICS, NIGERIAN_STATES } from '@/config';

const DeploymentDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for charts
  const userGrowthData = [
    { name: 'Jan', users: 1200, sessions: 2400, documents: 800 },
    { name: 'Feb', users: 1900, sessions: 3800, documents: 1200 },
    { name: 'Mar', users: 3200, sessions: 6400, documents: 2100 },
    { name: 'Apr', users: 5800, sessions: 11600, documents: 3800 },
    { name: 'May', users: 8900, sessions: 17800, documents: 5900 },
    { name: 'Jun', users: 12500, sessions: 25000, documents: 8300 },
  ];

  const voiceSessionsData = [
    { name: '00:00', sessions: 45 },
    { name: '04:00', sessions: 12 },
    { name: '08:00', sessions: 89 },
    { name: '12:00', sessions: 156 },
    { name: '16:00', sessions: 203 },
    { name: '20:00', sessions: 178 },
  ];

  const languageDistribution = [
    { name: 'English', value: 45, color: '#8b5cf6' },
    { name: 'Pidgin', value: 25, color: '#06b6d4' },
    { name: 'Yoruba', value: 15, color: '#10b981' },
    { name: 'Hausa', value: 10, color: '#f59e0b' },
    { name: 'Igbo', value: 5, color: '#ef4444' },
  ];

  const stateDistribution = [
    { state: 'Lagos', users: 15230, percentage: 35 },
    { state: 'Abuja', users: 8945, percentage: 20 },
    { state: 'Kano', users: 6234, percentage: 14 },
    { state: 'Rivers', users: 4521, percentage: 10 },
    { state: 'Oyo', users: 3456, percentage: 8 },
    { state: 'Others', users: 5614, percentage: 13 },
  ];

  const emergencyData = [
    { name: 'Mon', alerts: 5, resolved: 5 },
    { name: 'Tue', alerts: 8, resolved: 7 },
    { name: 'Wed', alerts: 3, resolved: 3 },
    { name: 'Thu', alerts: 12, resolved: 11 },
    { name: 'Fri', alerts: 7, resolved: 6 },
    { name: 'Sat', alerts: 4, resolved: 4 },
    { name: 'Sun', alerts: 2, resolved: 2 },
  ];

  const systemHealth = [
    { service: 'Frontend', status: 'healthy', uptime: 99.9, responseTime: 120 },
    { service: 'Backend API', status: 'healthy', uptime: 99.8, responseTime: 89 },
    { service: 'Voice AI', status: 'healthy', uptime: 99.5, responseTime: 156 },
    { service: 'Database', status: 'healthy', uptime: 99.9, responseTime: 45 },
    { service: 'Emergency System', status: 'warning', uptime: 98.9, responseTime: 234 },
    { service: 'Payment Gateway', status: 'healthy', uptime: 99.7, responseTime: 167 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Deployment Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time system metrics and Nigerian market analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Data
          </Badge>
          <Badge variant="outline">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4">
                  <Mic className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.voiceSessions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Voice Sessions</div>
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+18%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.documentsGenerated.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Documents Generated</div>
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {MOCK_SYSTEM_METRICS.emergencyAlerts.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Emergency Alerts</div>
                </div>
              </div>
              <div className="flex items-center text-yellow-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">-5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Dashboard Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="voice">Voice AI</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Trends</CardTitle>
                  <CardDescription>User registration and activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Voice Sessions by Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Sessions by Time</CardTitle>
                  <CardDescription>Daily voice session patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={voiceSessionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Nigerian Market Analytics */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Language Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Languages className="w-5 h-5 mr-2" />
                    Language Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={languageDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {languageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* State Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Top States
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stateDistribution.map((state, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-600 mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{state.state}</div>
                          <div className="text-xs text-gray-500">{state.users.toLocaleString()} users</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {state.percentage}%
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Device & Network */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Device & Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mobile</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Desktop</span>
                      <span>20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tablet</span>
                      <span>5%</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-3">Network Quality</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>4G/5G</span>
                        <span className="text-green-600">68%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>3G</span>
                        <span className="text-yellow-600">25%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>2G/Edge</span>
                        <span className="text-red-600">7%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health Overview</CardTitle>
                  <CardDescription>Real-time status of all system components</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemHealth.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-4 ${getStatusColor(service.status)}`}>
                            {getStatusIcon(service.status)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {service.service}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {service.uptime}% uptime • {service.responseTime}ms avg response
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Alerts Trend</CardTitle>
                  <CardDescription>Daily emergency alerts and resolution rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={emergencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Response Metrics</CardTitle>
                  <CardDescription>Key performance indicators for emergency system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">98.5%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">2.3min</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Critical Alerts</span>
                      <span>15%</span>
                    </div>
                    <Progress value={15} className="h-2 bg-red-100" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>High Priority</span>
                      <span>35%</span>
                    </div>
                    <Progress value={35} className="h-2 bg-yellow-100" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Medium Priority</span>
                      <span>50%</span>
                    </div>
                    <Progress value={50} className="h-2 bg-blue-100" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DeploymentDashboard;