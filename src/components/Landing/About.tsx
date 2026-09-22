export function About() {
  return (
    <section id="about" className="py-20 px-8 bg-white relative overflow-hidden"
             style={{
               backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}>
      <div className="max-w-6xl mx-auto">
        
        {/* About Festival Section - Split Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">🎭</span>
                </div>
                <span className="text-gray-600 text-sm font-medium">About Our Festival</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Celebrating
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                  Arts & Sports
                </span>
                Excellence
              </h2>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Festival 2K25 brings together three dynamic teams in an exciting showcase of creativity and athletic excellence. 
                With 135 talented students participating across 200+ diverse programs spanning visual arts, performing arts, 
                and competitive sports.
              </p>
              
              {/* <p className="text-gray-600 leading-relaxed mb-8">
                Our festival celebrates the talents of dedicated students who will compete, create, and inspire in a spirit 
                of healthy competition and artistic expression. Join us for an unforgettable experience of teamwork, 
                creativity, and sportsmanship.
              </p> */}
            </div>
            
            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">🎨</span>
                </div>
                <span className="text-gray-700 font-medium">Creative Arts Competitions</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🏆</span>
                </div>
                <span className="text-gray-700 font-medium">Sports Tournaments</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">👥</span>
                </div>
                <span className="text-gray-700 font-medium">Team Collaboration</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">🌟</span>
                </div>
                <span className="text-gray-700 font-medium">200+ Exciting Programs</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="pt-4">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                Learn More About Festival
              </button>
            </div>
          </div>
          
          {/* Right Side - Stats & Visual */}
          <div className="space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">3</div>
                <div className="text-green-700 font-medium text-sm">Dynamic Teams</div>
                <div className="text-green-600 text-xs mt-1">Competing with passion</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">135</div>
                <div className="text-blue-700 font-medium text-sm">Talented Students</div>
                <div className="text-blue-600 text-xs mt-1">Showcasing skills</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
                <div className="text-purple-700 font-medium text-sm">Programs</div>
                <div className="text-purple-600 text-xs mt-1">Arts & Sports</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">2025</div>
                <div className="text-orange-700 font-medium text-sm">Festival Year</div>
                <div className="text-orange-600 text-xs mt-1">Grand celebration</div>
              </div>
            </div>
            
            {/* Team Overview */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Competing Teams</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Team Sumud</div>
                      <div className="text-gray-600 text-sm">Arts & Sports Excellence</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">45 Students</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Team Aqsa</div>
                      <div className="text-gray-600 text-sm">Creative & Athletic</div>
                    </div>
                  </div>
                  <div className="text-blue-600 font-bold">45 Students</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-rose-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">I</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Team Inthifada</div>
                      <div className="text-gray-600 text-sm">Innovation & Competition</div>
                    </div>
                  </div>
                  <div className="text-red-600 font-bold">45 Students</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
}