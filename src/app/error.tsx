'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-rose-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-rose-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Oops, kuch ghalat ho gaya
        </h1>
        <p className="text-slate-600 mb-1">
          Hum is page ko load nahi kar paye. Aap dobara koshish karein ya home par wapas jaayein.
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Something went wrong loading this page. Please try again or go home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-premium-teal h-11 px-6 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="h-11 px-6 rounded-xl font-semibold border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
