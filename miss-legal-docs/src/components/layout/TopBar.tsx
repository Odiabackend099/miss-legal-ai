// TopBar Component for MISS Legal AI Documentation
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Globe,
  ExternalLink,
  Menu,
  Sun,
  Moon,
  Github,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEPLOYMENT_URLS, SYSTEM_INFO } from '@/config';

interface TopBarProps {
  onMenuToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // In a real app, you'd implement theme switching logic here
  };

  const notifications = [
    { id: 1, title: 'System Update Available', time: '2 minutes ago', type: 'info' },
    { id: 2, title: 'New API Version Released', time: '1 hour ago', type: 'success' },
    { id: 3, title: 'Scheduled Maintenance', time: '2 hours ago', type: 'warning' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              className="pl-10 w-64 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* System Status */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Version Badge */}
          <Badge variant="outline" className="hidden sm:flex">
            v{SYSTEM_INFO.version}
          </Badge>

          {/* Quick Links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a href={DEPLOYMENT_URLS.frontend} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <Globe className="w-4 h-4 mr-2" />
                  Live Application
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={DEPLOYMENT_URLS.backend} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <Zap className="w-4 h-4 mr-2" />
                  API Status
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="https://github.com/odia-intelligence/miss-legal-ai" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Repository
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Bell className="w-4 h-4" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
                >
                  {notifications.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
              </div>
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                  <div className="flex items-start w-full">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      notification.type === 'success' ? 'bg-green-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 text-center cursor-pointer">
                <span className="text-sm text-gray-500 dark:text-gray-400">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="cursor-pointer">
                <span className="mr-2">🇬🇧</span>
                English
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="mr-2">🇳🇬</span>
                Pidgin
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="mr-2">🇳🇬</span>
                Yorùbá
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="mr-2">🇳🇬</span>
                Hausa
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <span className="mr-2">🇳🇬</span>
                Igbo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;