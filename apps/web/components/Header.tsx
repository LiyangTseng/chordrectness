export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-bold text-gray-900">ChordRectness</h1>
          </div>

          <nav className="flex items-center space-x-6">
            <a
              href="http://localhost:3001/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              API Docs
            </a>
            <a
              href="http://localhost:3001/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Health Check
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}