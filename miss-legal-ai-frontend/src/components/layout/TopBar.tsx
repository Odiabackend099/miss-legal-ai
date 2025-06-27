// TopBar Component for MISS Legal AI
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Globe, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { User as UserType, Language } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getLanguageDisplayName } from '@/lib/utils';

interface TopBarProps {
  user: UserType | null;
  onMenuToggle: () => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  user, 
  onMenuToggle, 
  currentLanguage, 
  onLanguageChange 
}) => {
  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'english', label: 'English', flag: '🇬🇧' },
    { value: 'pidgin', label: 'Nigerian Pidgin', flag: '🇳🇬' },
    { value: 'yoruba', label: 'Yorùbá', flag: '🇳🇬' },
    { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
    { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-secondary/80 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search legal topics..."
              className="input-field pl-10 w-64"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <Select value={currentLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-40 bg-dark-card border-purple-500/20 text-white">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-dark-card border border-purple-500/20">
              {languages.map((lang) => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                  className="text-white hover:bg-purple-500/20"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-white"
          >
            <Bell className="w-5 h-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user.firstName} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-dark-card border border-purple-500/20"
                align="end"
                forceMount
              >
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user.email}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className="w-fit mt-1 bg-purple-600/20 text-purple-400 capitalize"
                  >
                    {user.subscriptionTier}
                  </Badge>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-white hover:bg-purple-500/20 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-purple-500/20 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;