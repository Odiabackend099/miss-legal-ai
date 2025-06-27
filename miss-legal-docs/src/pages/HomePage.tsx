// Home Page for MISS Legal AI Documentation System
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code,
  Activity,
  Shield,
  Users,
  Rocket,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Globe,
  Mic,
  FileText,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SYSTEM_INFO, DEPLOYMENT_URLS, MOCK_SYSTEM_METRICS } from '@/config';

const HomePage: React.FC = () => {
  const quickActions = [
    {
      title: 'API Documentation',
      description: 'Complete API reference with examples',
      icon: Code,
      href: '/api',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'System Health',
      description: 'Real-time monitoring dashboard',
      icon: Activity,
      href: '/health',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Launch Readiness',
      description: 'Pre-launch checklist and status',
      icon: CheckCircle,
      href: '/launch',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'User Guides',
      description: 'Multi-language user documentation',
      icon: Users,
      href: '/guides',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const systemStats = [
    {
      label: 'Total Users',
      value: MOCK_SYSTEM_METRICS.totalUsers.toLocaleString(),
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Documents Generated',
      value: MOCK_SYSTEM_METRICS.documentsGenerated.toLocaleString(),
      change: '+8%',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      label: 'Voice Sessions',
      value: MOCK_SYSTEM_METRICS.voiceSessions.toLocaleString(),
      change: '+15%',
      icon: Mic,
      color: 'text-purple-600',
    },
    {
      label: 'System Uptime',
      value: `${MOCK_SYSTEM_METRICS.uptime}%`,
      change: 'Excellent',
      icon: Zap,
      color: 'text-emerald-600',
    },
  ];

  const recentUpdates = [
    {
      title: 'API v1.0 Released',
      description: 'Complete API with all endpoints now available',
      time: '2 hours ago',
      type: 'release',
    },
    {
      title: 'Mobile App Beta',
      description: 'Android app ready for Play Store Beta testing',
      time: '4 hours ago',
      type: 'update',
    },
    {
      title: 'NDPR Compliance Certified',
      description: 'Full Nigerian Data Protection Regulation compliance achieved',
      time: '1 day ago',
      type: 'compliance',
    },
    {
      title: 'Emergency System Active',
      description: 'Emergency detection and response system operational',
      time: '2 days ago',
      type: 'security',
    },
  ];

  const deploymentStatus = [
    { name: 'Frontend Application', status: 'deployed', url: DEPLOYMENT_URLS.frontend },
    { name: 'Backend API', status: 'deployed', url: DEPLOYMENT_URLS.backend },
    { name: 'Documentation Site', status: 'deployed', url: DEPLOYMENT_URLS.docs },
    { name: 'Mobile App', status: 'beta', url: DEPLOYMENT_URLS.mobile.playStore },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mr-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {SYSTEM_INFO.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {SYSTEM_INFO.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Badge variant="outline" className="px-3 py-1">
            Version {SYSTEM_INFO.version}
          </Badge>
          <Badge className="px-3 py-1 bg-green-100 text-green-800 border-green-200">
            Production Ready
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {SYSTEM_INFO.organization}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <a href={DEPLOYMENT_URLS.frontend} target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4 mr-2" />
              View Live Application
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/docs">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Documentation
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* System Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Deployment Status & Recent Updates */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Deployment Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-purple-600" />
                Deployment Status
              </CardTitle>
              <CardDescription>
                Current status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deploymentStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.url}
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      item.status === 'deployed' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Updates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Recent Updates
              </CardTitle>
              <CardDescription>
                Latest system updates and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUpdates.map((update, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    update.type === 'release' ? 'bg-blue-500' :
                    update.type === 'update' ? 'bg-green-500' :
                    update.type === 'compliance' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {update.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {update.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {update.time}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Launch Readiness Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Launch Readiness Status
            </CardTitle>
            <CardDescription>
              Overall system readiness for Nigerian market launch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Overall Progress
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  94% Complete
                </span>
              </div>
              <Progress value={94} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Technical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Security</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">96%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Compliance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">88%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Documentation</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HomePage;