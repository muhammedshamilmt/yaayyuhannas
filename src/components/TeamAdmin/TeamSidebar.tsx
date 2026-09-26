'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Team } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface TeamSidebarProps {
  selectedTeam: string;
  teamData?: Team;
  onSwitchTeam?: () => void;
}

const getNavigation = (teamCode: string) => [
  {
    name: 'Dashboard',
    href: `/team-admin?team=${teamCode}`,
    icon: '📊',
    description: 'Overview & Statistics'
  },
  {
    name: 'Team Details',
    href: `/team-admin/details?team=${teamCode}`,
    icon: '🏆',
    description: 'Team Information'
  },
  {
    name: 'Candidates',
    href: `/team-admin/candidates?team=${teamCode}`,
    icon: '👥',
    description: 'Manage Team Members'
  },
  // {
  //   name: 'Team Draft',
  //   href: `/team-admin/draft?team=${teamCode}`,
  //   icon: '🎯',
  //   description: 'Select Team Members'
  // },
  {
    name: 'Programmes',
    href: `/team-admin/programmes?team=${teamCode}`,
    icon: '🎯',
    description: 'Programme Participation'
  },
  {
    name: 'Results',
    href: `/team-admin/results?team=${teamCode}`,
    icon: '🏅',
    description: 'Competition Results'
  },
  {
    name: 'Rankings',
    href: `/team-admin/rankings?team=${teamCode}`,
    icon: '📈',
    description: 'Team Rankings'
  }
];

export default function TeamSidebar({ selectedTeam, teamData, onSwitchTeam }: TeamSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showPrankOverlay, setShowPrankOverlay] = useState(false);
  const navigation = getNavigation(selectedTeam);

  return (
    <>
      <div className="w-64 bg-white shadow-lg h-screen flex flex-col border-r border-gray-200">
        {/* Team Header */}
        <div className="p-6 border-b border-gray-200"
          style={{
            background: `linear-gradient(135deg, ${teamData?.color}15 0%, ${teamData?.color}05 100%)`
          }}>
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: teamData?.color }}
            >
              {selectedTeam}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{teamData?.name}</h2>
              <p className="text-xs text-gray-500">Team Admin Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPrankOverlay(true)}
            className="w-full px-3 py-2 text-sm bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 shadow-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Switch Team
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                  ? `text-white shadow-md`
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                style={isActive ? {
                  backgroundColor: teamData?.color,
                  boxShadow: `0 4px 12px ${teamData?.color}40`
                } : {}}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs ${isActive ? 'text-white opacity-80' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Team Stats */}
      <div className="p-4 border-t border-gray-200">
        <div className="rounded-lg p-4 border border-gray-200"
          style={{
            background: `linear-gradient(135deg, ${teamData?.color}10 0%, ${teamData?.color}05 100%)`
          }}>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Members:</span>
              <span className="font-bold text-gray-900 px-2 py-1 bg-white rounded-md shadow-sm">
                {teamData?.members || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Points:</span>
              <span className="font-bold text-white px-2 py-1 rounded-md shadow-sm"
                style={{ backgroundColor: teamData?.color }}>
                {teamData?.points || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Captain:</span>
              <span className="font-medium text-xs bg-white px-2 py-1 rounded-md shadow-sm max-w-20 truncate">
                {teamData?.captain || 'TBA'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
        >
          <span className="mr-2">🚪</span> Logout
        </button>
      </div>
    </div>

    {/* Prank Troll Overlay for Switch Team */ }
  {
    showPrankOverlay && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-opacity duration-200"
        onClick={() => setShowPrankOverlay(false)}
      >
        <div
          className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => setShowPrankOverlay(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors z-10"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Video */}
          <div className="relative mx-auto my-2 w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-black flex items-center justify-center">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/videos/emoji.mp4" type="video/mp4" />
              <source src="/videos/emoji.mov" type="video/quicktime" />
              Your browser does not support video.
            </video>
          </div>

          {/* Malayalam Text with Smile Emoji */}
          <div className="mt-5 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide drop-shadow-md">
              പോയി മൂഞ്ചിക്കോ 😊
            </h2>
            <p className="text-xs text-gray-400">
              Team switching is disabled for team admins!
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setShowPrankOverlay(false)}
            className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-extrabold text-sm rounded-xl transition-all duration-150 shadow-lg shadow-amber-500/25 active:scale-95"
          >
            ശരി സാർ 🫡
          </button>
        </div>
      </div>
    )
  }
  </>
  );
}