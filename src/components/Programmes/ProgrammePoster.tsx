import React, { forwardRef } from 'react';

export interface PosterPrizeItem {
  id?: string;
  position: number; // 1, 2, 3, etc.
  name: string;
  team: string;
  chestNumber?: string;
}

export type PosterTemplateType = 'arts-stage' | 'arts-nonstage' | 'sports';

export interface PosterTemplateConfig {
  id: PosterTemplateType;
  name: string;
  badge: string;
  imagePath: string;
  description: string;
}

export const POSTER_TEMPLATES: PosterTemplateConfig[] = [
  {
    id: 'arts-stage',
    name: 'Arts - Stage',
    badge: 'Stage 🎭',
    imagePath: '/posters/arts-stage.png',
    description: 'Stage events (Elocution, Song, Skit, etc.)',
  },
  {
    id: 'arts-nonstage',
    name: 'Arts - Non-Stage',
    badge: 'Off-Stage 🎨',
    imagePath: '/posters/arts-nonstage.png',
    description: 'Off-stage events (Essay, Painting, Quiz, etc.)',
  },
  {
    id: 'sports',
    name: 'Sports',
    badge: 'Sports ⚽',
    imagePath: '/posters/sports.png',
    description: 'Athletics & sports competitions',
  },
];

/**
 * Automatically resolves the appropriate poster template based on programme category and subcategory.
 */
export function getDefaultPosterTemplate(programme: {
  category?: string;
  subcategory?: string;
  code?: string;
  name?: string;
} | null): PosterTemplateType {
  if (!programme) return 'arts-stage';

  const category = (programme.category || '').toLowerCase().trim();
  const subcategory = (programme.subcategory || '').toLowerCase().trim();
  const code = (programme.code || '').toUpperCase().trim();

  if (category === 'sports') {
    return 'sports';
  }

  // Non-stage checks
  if (
    subcategory === 'non-stage' ||
    subcategory === 'nonstage' ||
    code.includes('NS')
  ) {
    return 'arts-nonstage';
  }

  // Default to arts-stage for arts events
  return 'arts-stage';
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
      backgroundImage = '/posters/arts-stage.png',
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

        {/* Dynamic Left-Side Section Content - Reduced & Calibrated */}
        <div
          className="absolute flex flex-col z-10"
          style={{
            left: '12.5%',
            top: '34%',
            width: '39.5%',
          }}
        >
          {/* Section Heading: e.g. SUB-JUNIOR, JUNIOR, SENIOR, GENERAL */}
          <div className="font-poppins font-bold text-[40px] mt-10 uppercase  text-black leading-none">
            {section || 'GENERAL'}
          </div>

          {/* Programme Name: e.g. Arabic Handwriting */}
          <div
            className="font-medium text-[30px] text-[#b81d24] leading-tight break-words "
            style={{
              wordBreak: 'break-word',
            }}
          >
            {programmeName || 'Programme Name'}
          </div>

          {/* Prize Boxes: Dynamically rendered only for awarded prizes */}
          {prizes.length > 0 ? (
            <div className={`mt-6 flex flex-col ${isCompact ? 'gap-3' : 'gap-4'}`}>
              {prizes.map((prize, index) => {
                const name = prize.name?.trim() || '';
                const team = prize.team?.trim() || '';
                const isLongName = name.length > 20;

                return (
                  <div
                    key={prize.id || `prize-${prize.position}-${index}`}
                    className={`w-full ${isCompact ? 'h-[80px]' : 'h-[110px]'
                      } bg-[#282930] px-4 flex items-center gap-4 shadow-xl border border-white/5 relative overflow-hidden`}
                    style={{
                      // Radius only on top-right, bottom-right, and bottom-left. Left-top has NO radius.
                      borderRadius: isCompact ? '0 16px 16px 16px' : '0 22px 22px 22px',
                    }}
                  >
                    {/* Position Badge: Red Circle */}
                    <div
                      className={`${isCompact ? 'w-[50px] h-[50px]' : 'w-[60px] h-[60px]'
                        } rounded-full bg-[#dc2626] ml-2.5 flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <span
                        className={`text-white font-black ${isCompact ? 'text-[24px]' : 'text-[30px]'
                          } leading-none select-none`}
                      >
                        {prize.position}
                      </span>
                    </div>

                    {/* Winner Details */}
                    <div className="flex ml-1.5 flex-col justify-center min-w-0 flex-1 pr-2">
                      <div
                        className={`text-white font-poppins text-[27px] font-semibold uppercase leading-tight  tracking-wide ${isCompact
                          ? 'text-[16px]'
                          : isLongName
                            ? 'text-[18px]'
                            : 'text-[20px]'
                          }`}
                        title={name}
                      >
                        {name || 'WINNER'}
                      </div>
                      {team && (
                        <div
                          className={`text-[#9ca3af] font-poppins text-[20px] font-medium uppercase tracking-wider -mt-1 ${isCompact ? 'text-[13px]' : 'text-[16px]'
                            }`}
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
            <div className="mt-6 p-5 bg-black/5 rounded-2xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-600 font-medium text-base">No prizes declared yet</p>
              <p className="text-gray-400 text-xs mt-1">
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
