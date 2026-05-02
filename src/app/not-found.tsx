import Link from 'next/link'
import { SearchX, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-amber-200 rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-amber-400 flex items-center justify-center shadow-lg">
            <SearchX className="w-16 h-16 text-slate-900" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-slate-900 mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Page nahi mila</h2>
        <p className="text-slate-500 mb-1">
          Aap jo page dhoond rahe hain woh maujood nahi ya remove ho gaya hai.
        </p>
        <p className="text-xs text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="btn-premium h-11 px-6 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="h-11 px-6 rounded-xl font-semibold border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
