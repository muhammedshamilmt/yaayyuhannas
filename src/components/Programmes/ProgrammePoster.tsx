import React, { forwardRef } from 'react';

export interface PosterPrizeItem {
  id?: string;
  position: number; // 1, 2, 3, etc.
  name: string;
  team: string;
  chestNumber?: string;
}

export interface ProgrammePosterProps {
  section: string;
  programmeName: string;
  prizes: PosterPrizeItem[];
  backgroundImage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgrammePoster = forwardRef<HTMLDivElement, ProgrammePosterProps>(
  (
    {
      section,
      programmeName,
      prizes = [],
      backgroundImage = '/posters/sports.png',
      className = '',
      style = {},
    },
    ref
  ) => {
    // Determine compact scaling if 4 or more winners/ties are present
    const isCompact = prizes.length >= 4;

    return (
      <div
        ref={ref}
        className={`relative w-[1200px] h-[1200px] bg-white overflow-hidden shadow-2xl select-none font-sans ${className}`}
        style={{
          aspectRatio: '1 / 1',
          ...style,
        }}
      >
        {/* Background Template Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage}
          alt="Poster Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          crossOrigin="anonymous"
        />

        {/* Dynamic Left-Side Section Content */}
        <div
          className="absolute flex flex-col z-10"
          style={{
            left: '12.5%',
            top: '35.8%',
            width: '39.5%',
          }}
        >
          {/* Section Heading: e.g. SUB-JUNIOR, JUNIOR, SENIOR, GENERAL */}
          <div className="font-poppins font-semibold text-[35px] uppercase tracking-wide text-black leading-none">
            {section || 'GENERAL'}
          </div>

          {/* Programme Name: e.g. Arabic Handwriting */}
          <div
            className=" -mt-1 font-medium text-[32px] text-[#b81d24] leading-tight break-words"
            style={{
              wordBreak: 'break-word',
            }}
          >
            {programmeName || 'Programme Name'}
          </div>

          {/* Prize Boxes: Dynamically rendered only for awarded prizes */}
          {prizes.length > 0 ? (
            <div className={`mt-7 flex flex-col ${isCompact ? 'gap-3' : 'gap-[18px]'}`}>
              {prizes.map((prize, index) => {
                const name = prize.name?.trim() || '';
                const team = prize.team?.trim() || '';
                const isLongName = name.length > 22;

                return (
                  <div
                    key={prize.id || `prize-${prize.position}-${index}`}
                    className={`w-full ${isCompact ? 'h-[76px]' : 'h-[120px]'
                      } bg-[#282930] px-4 flex items-center gap-4 shadow-xl border border-white/5 relative overflow-hidden`}
                    style={{
                      // Radius only on top-right, bottom-right, and bottom-left. Left-top has NO radius.
                      borderRadius: '0 24px 24px 24px',
                    }}
                  >
                    {/* Position Badge: Red Circle */}
                    <div
                      className={`${isCompact ? 'w-[60px] h-[60px]' : 'w-[60px] h-[60px]'
                        } rounded-full bg-[#dc2626] ml-5 flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <span
                        className={`text-white font-black ${isCompact ? 'text-[26px]' : 'text-[32px]'
                          } leading-none select-none`}
                      >
                        {prize.position}
                      </span>
                    </div>

                    {/* Winner Details */}
                    <div className="flex ml-1 flex-col justify-center min-w-0 flex-1 pr-2">
                      <div
                        className={`text-white font-poppins font-semibold uppercase leading-tight truncate tracking-wide ${isLongName || isCompact ? 'text-[19px]' : 'text-[22px]'
                          }`}
                        title={name}
                      >
                        {name || 'WINNER'}
                      </div>
                      {team && (
                        <div
                          className="text-[#9ca3af] font-poppins font-medium text-[18px] uppercase tracking-wider  truncate"
                          title={team}
                        >
                          {team}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 p-6 bg-black/5 rounded-2xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 font-medium text-lg">No prizes declared yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Results for this event have not been published
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProgrammePoster.displayName = 'ProgrammePoster';
