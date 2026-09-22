export function Lineup() {
  const teams = [
    {
      name: "Team Sumud",
      description: "Arts & Sports Excellence",
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      students: 45,
      specialties: ["Visual Arts", "Basketball", "Poetry", "Drama"],
      captain: "Sarah Ahmed",
      motto: "Excellence through perseverance"
    },
    {
      name: "Team Aqsa",
      description: "Creative & Athletic Champions",
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      students: 45,
      specialties: ["Music", "Football", "Dance", "Art Exhibition"],
      captain: "Omar Hassan",
      motto: "Unity in diversity"
    },
    {
      name: "Team Inthifada",
      description: "Innovation & Competition",
      color: "from-red-400 to-rose-500",
      bgColor: "from-red-50 to-rose-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
      students: 45,
      specialties: ["Athletics", "Innovation", "Performance", "Leadership"],
      captain: "Layla Mahmoud",
      motto: "Rise through innovation"
    }
  ];

  return (
    <section id="lineup" className="py-20 px-8 bg-white relative overflow-hidden"
             style={{
               backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl font-bold">🏆</span>
            </div>
            <span className="text-gray-600 text-sm font-medium">Our Competing Teams</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Meet Our
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Championship
            </span>
            Teams
          </h2>
          
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Three dynamic teams ready to showcase their talents in arts, sports, and creative competitions. 
            Each team brings unique strengths and passionate dedication to Festival 2K25.
          </p>
        </div>

        {/* Teams Showcase */}
        <div className="space-y-12">
          {teams.map((team, index) => (
            <div key={team.name} className={`${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex flex-col lg:flex gap-12 items-center`}>
              
              {/* Team Card */}
              <div className="lg:w-1/2">
                <div className={`bg-gradient-to-br ${team.bgColor} border-2 ${team.borderColor} rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-500`}>
                  
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${team.color} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-xl">{team.name.split(' ')[1].charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{team.name}</h3>
                        <p className={`${team.textColor} font-medium`}>{team.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{team.students}</div>
                      <div className="text-gray-600 text-sm">Students</div>
                    </div>
                  </div>
                  
                  {/* Team Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Team Captain</h4>
                      <p className="text-gray-700">{team.captain}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Team Motto</h4>
                      <p className={`${team.textColor} italic font-medium`}>"{team.motto}"</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {team.specialties.map((specialty, idx) => (
                          <span key={idx} className={`bg-white ${team.textColor} px-3 py-1 rounded-full text-sm font-medium border ${team.borderColor}`}>
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Element */}
                  <div className={`absolute top-4 right-4 w-20 h-20 bg-gradient-to-r ${team.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
                </div>
              </div>
              
              {/* Team Visual/Stats */}
              <div className="lg:w-1/2">
                <div className="grid grid-cols-2 gap-6">
                  
                  {/* Competition Stats */}
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-gray-200 transition-colors duration-300">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">8+</div>
                    <div className="text-gray-600 text-sm">Competitions</div>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-gray-200 transition-colors duration-300">
                    <div className="text-2xl mb-2">🏅</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">15+</div>
                    <div className="text-gray-600 text-sm">Events</div>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-gray-200 transition-colors duration-300">
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">100%</div>
                    <div className="text-gray-600 text-sm">Participation</div>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-gray-200 transition-colors duration-300">
                    <div className="text-2xl mb-2">🤝</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">Team</div>
                    <div className="text-gray-600 text-sm">Spirit</div>
                  </div>
                  
                </div>
                
                {/* Team Progress */}
                <div className="mt-6 bg-white border-2 border-gray-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Preparation Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Arts Preparation</span>
                        <span className="text-gray-900 font-medium">95%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${team.color} h-2 rounded-full`} style={{width: '95%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Sports Training</span>
                        <span className="text-gray-900 font-medium">90%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${team.color} h-2 rounded-full`} style={{width: '90%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Team Coordination</span>
                        <span className="text-gray-900 font-medium">98%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${team.color} h-2 rounded-full`} style={{width: '98%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Support Your Team?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Join the excitement and cheer for your favorite team throughout Festival 2K25
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              View Team Details
            </button>
            <button className="border-2 border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300">
              Competition Rules
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}