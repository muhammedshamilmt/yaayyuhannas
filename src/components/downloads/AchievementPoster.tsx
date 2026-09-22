import React, { forwardRef } from 'react';

interface AchievementPosterProps {
  candidateName: string;
  chestNumber: string;
  teamName: string;
  teamColor: string;
  programmeName: string;
  category: string;
  position: string;
  grade: string;
  profileImage?: string;
}

export const AchievementPoster = forwardRef<HTMLDivElement, AchievementPosterProps>(
  ({ candidateName, chestNumber, teamName, teamColor, programmeName, category, position, grade, profileImage }, ref) => {

    // Determine colors/glows based on position
    let glowColor = 'rgba(255, 215, 0, 0.6)'; // Gold glow default
    let badgeText = '1st';

    if (position === '1st') {
      glowColor = 'rgba(255, 215, 0, 0.7)'; // Gold
      badgeText = '1st';
    } else if (position === '2nd') {
      glowColor = 'rgba(192, 192, 192, 0.7)'; // Silver
      badgeText = '2nd';
    } else if (position === '3rd') {
      glowColor = 'rgba(205, 127, 50, 0.7)'; // Bronze
      badgeText = '3rd';
    } else {
      badgeText = position;
    }

    return (
      <div
        ref={ref}
        className="w-[800px] h-[1000px] relative overflow-hidden font-sans shadow-2xl"
        style={{
          // Warm golden/beige radial gradient
          background: 'radial-gradient(circle at 40% 50%, #ffffff 0%, #faecd2 35%, #e9ce9d 100%)',
        }}
      >
        {/* Background Light Flares & Glows */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-white opacity-40 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-[#ffd700] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Faint Background Trophy Watermark */}
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="none" stroke="#3a1715" strokeWidth="2">
            <circle cx="50" cy="45" r="30" />
            <path d="M50 75 L50 90 M30 90 L70 90 M20 45 Q10 45 10 35 Q10 25 20 25 M80 45 Q90 45 90 35 Q90 25 80 25" />
          </svg>
        </div>

        {/* Scattered Confetti */}
        <div className="absolute top-20 left-40 w-4 h-12 bg-[#FFD700] rotate-45 opacity-80 shadow-sm blur-[1px]"></div>
        <div className="absolute top-60 left-20 w-3 h-8 bg-[#FFD700] -rotate-12 opacity-60"></div>
        <div className="absolute top-32 right-1/3 w-5 h-10 bg-[#FFD700] rotate-[60deg] opacity-90 blur-[0.5px]"></div>
        <div className="absolute bottom-40 left-1/3 w-6 h-16 bg-[#FFD700] rotate-[30deg] opacity-80"></div>
        <div className="absolute bottom-20 left-16 w-3 h-8 bg-[#FFD700] -rotate-[45deg] opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/4 w-4 h-10 bg-[#FFD700] rotate-[75deg] opacity-60 blur-[1px]"></div>

        {/* Streaks of Light */}
        <div className="absolute top-12 left-1/4 w-[200px] h-[8px] bg-white opacity-60 rotate-[-15deg] blur-md"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[12px] bg-white opacity-40 rotate-[-25deg] blur-lg"></div>

        {/* Top Header */}
        <div className="absolute -left-52 top-20 w-full text-center z-20">
          <span className="text-[#3a1715] text-2xl font-semibold">Wattaqa Arts Fest 2K25</span>
        </div>

        {/* Left Side Content Container */}
        <div className="absolute inset-0 p-16 w-[70%] flex flex-col justify-center z-20 mt-8">

          <p className="text-[#5a2e2b] text-2xl font-medium mb-1 leading-snug">
            Hearty congratulations to
          </p>
          <p className="text-[#3a1715] text-3xl font-bold mb-6 leading-snug">
            our brilliant student for securing
          </p>

          <h2
            className="text-[65px] font-black text-[#3a1715] leading-[1.0] mb-6 uppercase tracking-tighter"
            style={{
              wordBreak: 'break-word',
              // textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`
            }}
          >
            {candidateName}
          </h2>

          {/* Chest Number and Team in One Row */}
          <div className="flex flex-wrap items-center gap-4 mb-10 text-xl text-[#4a2320] font-bold">
            <div className="flex items-center gap-2">
              <span className="text-[#5a2e2b] font-medium">Chest No:</span>
              <span className="text-3xl text-[#3a1715]">{chestNumber}</span>
            </div>
            <div className="w-2 h-8 bg-[#3a1715]/20 rounded-full mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-[#5a2e2b] font-medium">Team:</span>
              <span className="text-2xl" style={{ color: teamColor || '#3a1715' }}>{teamName}</span>
            </div>
          </div>

          <h3 className="text-[50px] font-black text-[#3a1715] leading-[0.9] mb-4 uppercase tracking-tighter">
            {programmeName}
          </h3>

          <div className="inline-flex flex-col items-start mt-4">
            <span className="text-4xl font-extrabold text-[#3a1715] bg-[#e9ce9d] px-4 py-2 border-l-8 border-[#3a1715]">
              {position} {position !== 'Participation' ? 'PLACE' : ''} {grade ? `• GRADE ${grade}` : ''}
            </span>
            <span className="text-[#5a2e2b] font-bold uppercase tracking-widest mt-2 ml-1">{category}</span>
          </div>
        </div>

        {/* Right Side Prize Image */}
        {position !== 'Participation' ? (
          <div className="absolute top-0 right-[-60px] w-[500px] h-[900px] z-10 pointer-events-none drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)]">
            <img
              src={`/posters/${position}.png`}
              alt={position}
              className="w-full h-full object-contain object-top"
              crossOrigin="anonymous"
            />
          </div>
        ) : profileImage ? (
          <div className="absolute top-[15%] right-8 w-[320px] h-[480px] rounded-[100px] overflow-hidden border-8 border-white shadow-2xl z-10 rotate-3">
            <img
              src={profileImage}
              alt={candidateName}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="absolute top-1/3 right-12 w-[300px] h-[300px] rounded-full bg-white/40 shadow-2xl flex items-center justify-center z-10 backdrop-blur-sm border-4 border-white/50">
            <span className="text-8xl">🏆</span>
          </div>
        )}

        {/* Bottom Right Footer */}
        <div className="absolute bottom-12 right-12 z-20 flex flex-col items-end text-right ">
          <h4 className="text-[#3a1715] text-2xl font-black uppercase tracking-tight">Wattaqa Arts</h4>
          <p className="text-[#5a2e2b] font-bold text-lg">Official Result Declaration</p>
        </div>

      </div>
    );
  }
);

AchievementPoster.displayName = 'AchievementPoster';
