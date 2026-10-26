import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Festival Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">AYYUHANNAAS</h3>
                <p className="text-gray-400 text-sm">Arts & Sports Festival</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Join AYYUHANNAAS 2K26 Arts & Sports Festival with 135 talented students competing across 200+ programs 
              in three dynamic teams: Sumud, Aqsa, and Inthifada.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Sumud Team</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-300">Aqsa Team</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Inthifada Team</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/schedule" className="text-gray-300 hover:text-white transition-colors">
                  📅 Festival Schedule
                </Link>
              </li>
              <li>
                <Link href="/programmes" className="text-gray-300 hover:text-white transition-colors">
                  🏆 All Programmes
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-gray-300 hover:text-white transition-colors">
                  👥 Teams & Participants
                </Link>
              </li>
              <li>
                <Link href="/results" className="text-gray-300 hover:text-white transition-colors">
                  🏅 Results & Rankings
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Administration</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                  🔐 Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                  ⚙️ Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/team-admin" className="text-gray-300 hover:text-white transition-colors">
                  👨‍💼 Team Admin
                </Link>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
                  📞 Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2026 Ayyuhannas Arts & Sports Festival. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-400">Powered by</span>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">K</span>
              </div>
              <span className="text-white font-medium">Kiro Festival Management</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}