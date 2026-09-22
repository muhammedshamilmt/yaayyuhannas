import Link from "next/link";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const getPageIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'teams': return '👥';
      case 'candidates': return '🎓';
      case 'results': return '🏆';
      case 'rank & top': return '🥇';
      case 'rankings': return '🥇';
      case 'search': return '🔍';
      case 'gallery': return '📸';
      case 'basic': return '🎭';
      case 'print': return '🖨️';
      case 'settings': return '⚙️';
      default: return '📄';
    }
  };

  const getPageColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'teams': return 'from-green-500 to-emerald-600';
      case 'candidates': return 'from-blue-500 to-cyan-600';
      case 'results': return 'from-red-500 to-rose-600';
      case 'rank & top': return 'from-yellow-500 to-orange-600';
      case 'rankings': return 'from-yellow-500 to-orange-600';
      case 'search': return 'from-purple-500 to-pink-600';
      case 'gallery': return 'from-indigo-500 to-purple-600';
      case 'basic': return 'from-gray-500 to-gray-600';
      case 'print': return 'from-teal-500 to-cyan-600';
      case 'settings': return 'from-slate-500 to-gray-600';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${getPageColor(pageName)} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-xl">{getPageIcon(pageName)}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {pageName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Festival 2K25 Management</p>
        </div>
      </div>

      <nav className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link className="font-medium text-gray-600 hover:text-gray-900 transition-colors" href="/admin/dashboard">
              🏠 Dashboard
            </Link>
          </li>
          <li className="text-gray-400">→</li>
          <li className="font-bold text-gray-900">
            {pageName}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
