'use client';

import { Team } from '@/types';

interface TeamHeaderProps {
  teamData?: Team;
}

export default function TeamHeader({ teamData }: TeamHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: teamData?.color }}
            >
              {teamData?.code}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{teamData?.name} Admin</h1>
              <p className="text-sm text-gray-600">{teamData?.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-lg font-bold text-gray-900">{teamData?.members || 0}</div>
              <div className="text-xs text-gray-500">Members</div>
            </div>
            <div className="text-center px-4 py-2 rounded-lg border shadow-sm text-white"
                 style={{ backgroundColor: teamData?.color }}>
              <div className="text-lg font-bold">{teamData?.points || 0}</div>
              <div className="text-xs opacity-90">Points</div>
            </div>
            <div className="text-center px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">Active</div>
              <div className="text-xs text-green-500">Status</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}