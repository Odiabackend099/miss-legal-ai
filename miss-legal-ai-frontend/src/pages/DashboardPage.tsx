// Dashboard Page for MISS Legal AI
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  FileText, 
  Shield, 
  Activity,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import AIOrb from '@/components/voice/AIOrb';

const DashboardPage: React.FC = () => {
  const stats = [
    {
      label: 'Voice Sessions',
      value: '23',
      change: '+12%',
      icon: <Mic className="w-5 h-5" />,
      color: 'purple'
    },
    {
      label: 'Documents Generated',
      value: '8',
      change: '+3',
      icon: <FileText className="w-5 h-5" />,
      color: 'blue'
    },
    {
      label: 'Emergency Alerts',
      value: '0',
      change: 'All clear',
      icon: <Shield className="w-5 h-5" />,
      color: 'green'
    },
    {
      label: 'Session Time',
      value: '2.4h',
      change: '+45min',
      icon: <Clock className="w-5 h-5" />,
      color: 'yellow'
    }
  ];

  const recentActivities = [
    {
      type: 'voice_session',
      title: 'Voice consultation about tenancy rights',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'document',
      title: 'Generated Tenancy Agreement',
      time: '1 day ago',
      status: 'downloaded'
    },
    {
      type: 'emergency',
      title: 'Emergency contact updated',
      time: '3 days ago',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">Welcome back to your legal AI assistant</p>
        </div>
        
        <Link to="/app/talk">
          <Button className="glow-button">
            <Mic className="w-4 h-4 mr-2" />
            Start Voice Session
          </Button>
        </Link>
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-600/20 flex items-center justify-center text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <Badge variant="secondary" className="text-xs">
                {stat.change}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/app/talk">
                <div className="glass-card-hover p-6 text-center cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <AIOrb size="md" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Talk to MISS</h3>
                  <p className="text-gray-300 text-sm">Start a voice consultation</p>
                </div>
              </Link>
              
              <Link to="/app/documents">
                <div className="glass-card-hover p-6 text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Generate Document</h3>
                  <p className="text-gray-300 text-sm">Create legal documents</p>
                </div>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center mr-3">
                    {activity.type === 'voice_session' && <Mic className="w-4 h-4 text-purple-400" />}
                    {activity.type === 'document' && <FileText className="w-4 h-4 text-blue-400" />}
                    {activity.type === 'emergency' && <Shield className="w-4 h-4 text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">{activity.title}</div>
                    <div className="text-gray-400 text-xs">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;