// Sidebar Component for MISS Legal AI Documentation
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Code,
  Activity,
  Shield,
  Users,
  Rocket,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Mic,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: 'Overview',
    href: '/',
    icon: Home,
    description: 'System overview and quick access',
  },
  {
    name: 'Documentation',
    href: '/docs',
    icon: BookOpen,
    description: 'Complete system documentation',
  },
  {
    name: 'API Reference',
    href: '/api',
    icon: Code,
    description: 'API endpoints and examples',
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Deployment and system metrics',
  },
  {
    name: 'System Health',
    href: '/health',
    icon: Activity,
    description: 'Real-time system monitoring',
  },
  {
    name: 'Launch Readiness',
    href: '/launch',
    icon: CheckCircle,
    description: 'Launch checklist and status',
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: Shield,
    description: 'NDPR and legal compliance',
  },
  {
    name: 'User Guides',
    href: '/guides',
    icon: Users,
    description: 'Multi-language user guides',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: isOpen ? 0 : -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'flex flex-col lg:translate-x-0 shadow-lg',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-16'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mr-3">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">MISS Docs</h2>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Legal AI System</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hidden lg:flex"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  isActive 
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                    : 'text-gray-700 dark:text-gray-300',
                  !isOpen && 'justify-center px-2'
                )}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className={cn('w-5 h-5', isOpen && 'mr-3')} />
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden"
                    >
                      <span className="whitespace-nowrap">{item.name}</span>
                      {item.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={cn('flex items-center', !isOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-3 overflow-hidden"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    System Online
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    All services operational
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Desktop toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'fixed top-4 left-4 z-50 text-gray-400 hover:text-gray-600 p-2',
          'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800',
          'transition-all duration-300 hidden lg:flex shadow-sm',
          isOpen ? 'left-[240px]' : 'left-4'
        )}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>
    </>
  );
};

export default Sidebar;