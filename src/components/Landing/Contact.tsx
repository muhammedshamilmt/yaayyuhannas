export function Contact() {
  return (
    <section id="contact" className="py-20 px-8 bg-white relative overflow-hidden"
             style={{
               backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center mr-2">
              <div className="text-2xl mr-2">📞</div>
            </div>
            <div className="flex -space-x-2 mr-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-gray-600 text-sm">Get in touch with us</span>
          </div>

          <div className="relative mb-8">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Contact us<br />
              for festival
            </h2>
          </div>

          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Have questions about Festival 2K25? We're here to help<br />
            with registration, events, and general information
          </p>
        </div>

        {/* Contact Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-5xl mx-auto">
          
          {/* Email Card */}
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden flex items-center justify-center cursor-pointer transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 animate-fade-in-up group"
               style={{ animationDelay: '0.2s' }}>
            
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300/20 to-pink-600/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="text-white text-center relative z-10 group-hover:text-white transition-colors duration-300">
              <div className="w-20 h-20 mx-auto mb-3 border-2 border-white/30 rounded-xl flex items-center justify-center group-hover:border-white/50 group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl">📧</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Email Us</h3>
              <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">festival2k25@example.com</p>
            </div>
            
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </div>

          {/* Phone Card (taller) */}
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl w-full md:w-80 h-96 relative overflow-hidden flex items-center justify-center cursor-pointer transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 animate-fade-in-up group"
               style={{ animationDelay: '0.4s' }}>
            
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-cyan-600/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="text-white text-center relative z-10 group-hover:text-white transition-colors duration-300">
              <div className="w-20 h-20 mx-auto mb-3 border-2 border-white/30 rounded-xl flex items-center justify-center group-hover:border-white/50 group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Call Us</h3>
              <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">+1 (555) 123-4567</p>
              <p className="text-xs opacity-60 mt-2">Available 9 AM - 6 PM</p>
            </div>
            
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity duration-500"></div>
          </div>

          {/* Location Card */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden flex items-center justify-center cursor-pointer transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 animate-fade-in-up group"
               style={{ animationDelay: '0.6s' }}>
            
            <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-emerald-600/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="text-white text-center relative z-10 group-hover:text-white transition-colors duration-300">
              <div className="w-20 h-20 mx-auto mb-3 border-2 border-white/30 rounded-xl flex items-center justify-center group-hover:border-white/50 group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Visit Us</h3>
              <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">Festival Grounds<br />Main Campus</p>
            </div>
            
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </div>
          
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800 transition-colors text-lg">
              <span>Send Message</span>
              <span className="text-yellow-400">⚡</span>
            </button>
            <button className="text-gray-500 hover:text-gray-900 transition-colors text-lg">
              FAQ
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}