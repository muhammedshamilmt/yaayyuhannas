import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-8">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/images/festival-logo.png"
                alt="Festival 2K25"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-bold text-xl text-white">Festival 2K25</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Join Festival 2K25 Arts & Sports Festival with 135 talented students competing across 200+ programs in three dynamic teams: Sumud, Aqsa, and Inthifada.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-gray-700"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-gray-700"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-rose-400 rounded-full border-2 border-gray-700"></div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Festival</a></li>
              <li><a href="#lineup" className="text-gray-400 hover:text-white transition-colors">Teams</a></li>
              <li><a href="#schedule" className="text-gray-400 hover:text-white transition-colors">Schedule</a></li>
              <li><a href="/programmes" className="text-gray-400 hover:text-white transition-colors">Programmes</a></li>
              <li><a href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">Leaderboard</a></li>
              <li><a href="/results" className="text-gray-400 hover:text-white transition-colors">Results</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">📧 festival2k25@example.com</li>
              <li className="text-gray-400">📱 +1 (555) 123-4567</li>
              <li className="text-gray-400">📍 Festival Grounds, Main Campus</li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Festival 2K25. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Support</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}