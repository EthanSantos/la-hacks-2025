'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, TrophyIcon, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SideNavbar() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white border-r border-gray-200 h-screen w-60 flex-shrink-0 flex flex-col">
      {/* Logo/Title */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">BLOOM.AI</h2>
      </div>
      
      {/* Navigation Links */}
      <div className="flex flex-col p-3 space-y-2 flex-1">
        <Button 
          variant={pathname === '/' ? "default" : "ghost"} 
          asChild
          className="justify-start"
          size="sm"
        >
          <Link href="/">
            <HomeIcon className="mr-3 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        
        <Button 
          variant={pathname === '/leaderboard' ? "default" : "ghost"} 
          asChild
          className="justify-start"
          size="sm"
        >
          <Link href="/leaderboard">
            <TrophyIcon className="mr-3 h-4 w-4" />
            Leaderboard
          </Link>
        </Button>
        
        <Button 
          variant={pathname === '/analytics' ? "default" : "ghost"} 
          asChild
          className="justify-start"
          size="sm"
        >
          <Link href="/analytics">
            <BarChart2 className="mr-3 h-4 w-4" />
            Analytics
          </Link>
        </Button>
      </div>
      
      {/* Footer area - could add user settings here */}
      <div className="p-4 border-t border-gray-200">
        {/* Empty for now, could add user profile */}
      </div>
    </nav>
  );
}