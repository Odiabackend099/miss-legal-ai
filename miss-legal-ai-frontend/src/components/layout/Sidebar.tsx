// Sidebar Component for MISS Legal AI
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  FileText,
  Building,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AIOrb from '@/components/voice/AIOrb';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: UserType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, user }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/app/dashboard',
    },
    {
      name: 'Talk to MISS',
      href: '/app/talk',
      icon: Mic,
      current: location.pathname === '/app/talk',
    },
    {
      name: 'Documents',
      href: '/app/documents',
      icon: FileText,
      current: location.pathname === '/app/documents',
    },
    {
      name: 'Clone MISS',
      href: '/app/clone',
      icon: Building,
      current: location.pathname === '/app/clone',
    },
  ];

  const secondaryNavigation = [
    {
      name: 'Settings',
      href: '/app/settings',
      icon: Settings,
    },
    {
      name: 'Help',
      href: '/app/help',
      icon: HelpCircle,
    },
  ];

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
          'fixed top-0 left-0 z-50 h-full w-64 bg-dark-secondary border-r border-purple-500/20',
          'flex flex-col lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-16'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <AIOrb size="sm" className="mr-3" />
                <div>
                  <h2 className="text-lg font-bold text-white">MISS</h2>
                  <p className="text-xs text-purple-400">Legal AI</p>
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
                <AIOrb size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1 lg:hidden"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-nav-item',
                  item.current && 'active',
                  !isOpen && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-5 h-5', isOpen && 'mr-3')} />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          <div className="border-t border-gray-700 my-4" />

          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-nav-item',
                  !isOpen && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-5 h-5', isOpen && 'mr-3')} />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-purple-500/20">
            <div className={cn(
              'flex items-center',
              !isOpen && 'justify-center'
            )}>
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 flex-1 overflow-hidden"
                  >
                    <div className="text-sm font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-purple-400 capitalize">
                      {user.subscriptionTier}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1 ml-2"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* Desktop toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'fixed top-4 left-4 z-50 text-gray-400 hover:text-white p-2',
          'bg-dark-secondary/80 backdrop-blur-sm border border-purple-500/20',
          'transition-all duration-300 hidden lg:flex',
          isOpen ? 'left-[240px]' : 'left-4'
        )}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>
    </>
  );
};

export default Sidebar;