import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <div className="h-screen relative overflow-hidden bg-white flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/festival-logo.png"
            alt="Festival 2K25"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-bold text-xl">wattaqa 2K25</span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-gray-500">
          <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
          <a href="/teams" className="hover:text-gray-900 transition-colors">Teams</a>
          <a href="/schedule" className="hover:text-gray-900 transition-colors">Schedule</a>
          <Link href="/programmes" className="hover:text-gray-900 transition-colors">Programmes</Link>
          <Link href="/profiles" className="hover:text-gray-900 transition-colors">Profiles</Link>
          <Link href="/leaderboard" className="hover:text-gray-900 transition-colors">Leaderboard</Link>
          <Link href="/results" className="hover:text-gray-900 transition-colors">Results</Link>
        </div>

        <Link href="/login" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
          Login
        </Link>
      </nav>

      {/* Hero Section - Full Screen Height */}
      <div className="flex-1 flex flex-col justify-center text-center px-8 max-w-6xl mx-auto w-full">

        {/* User avatars and rating */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center mr-2">
            <div className="text-2xl mr-2">🎭</div>
          </div>
          <div className="flex -space-x-2 mr-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-rose-400 rounded-full border-2 border-white"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-sm font-bold">+</span>
            </div>
          </div>
          <span className="text-gray-600 text-sm">135+ talented students</span>
        </div>

        {/* Main heading */}
        <div className="relative mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            Celebrate<br />
            WATTAQA 2K25
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
          Join three dynamic teams competing across 200+ programs<br />
          in arts, sports, and creative excellence
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <Link href="/results" className="bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800 transition-colors text-lg">
            <span>🏆</span>
            <span>View Results</span>
          </Link>
          <Link href="/leaderboard" className="text-gray-500 hover:text-gray-900 transition-colors text-lg">
            View Leaderboard
          </Link>
        </div>
        {/* Three Animated Image Containers */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 max-w-5xl mx-auto">

          {/* Green container - Team Sumud */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden cursor-pointer transform transition-transform duration-500 ease-out hover:scale-105 animate-fade-in-up group"
            style={{ animationDelay: '0.2s' }}>

            {/* Floating animation background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-emerald-600/20 animate-pulse"></div>

            {/* Team Image Background */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/SUMUD TEAM.png"
                alt="Team Sumud"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Green overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/50 via-emerald-400/15 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10">
              <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Sumud</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Arts & Sports Excellence</p>
            </div>

            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20"></div>
          </div>

          {/* Gray container - Team Aqsa (taller) */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-3xl w-full md:w-80 h-96 relative overflow-hidden cursor-pointer transform transition-transform duration-500 ease-out hover:scale-105 animate-fade-in-up group"
            style={{ animationDelay: '0.4s' }}>

            {/* Floating animation background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-600/20 animate-pulse"></div>

            {/* Team Image - Front and Center */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/AL AQSA TEAM.png"
                alt="Team Aqsa"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Gray overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-700/50 via-gray-600/15 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10">
              <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Aqsa</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Creative & Athletic Champions</p>
            </div>

            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20"></div>
          </div>
          {/* Red container - Team Inthifada */}
          <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden cursor-pointer transform transition-transform duration-500 ease-out hover:scale-105 animate-fade-in-up group"
            style={{ animationDelay: '0.6s' }}>

            {/* Floating animation background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-300/20 to-rose-600/20 animate-pulse"></div>

            {/* Team Image Background */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/INTHIFADA TEAM.png"
                alt="Team Inthifada"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Red overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/50 via-rose-400/15 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10">
              <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Inthifada</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Innovation & Competition</p>
            </div>

            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20"></div>
          </div>

        </div>
      </div>
    </div>
  );
}