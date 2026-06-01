import React from 'react';

/**
 * LoadingFallback — Premium skeleton loading screen
 * Used as Suspense fallback when lazy-loaded page chunks are being fetched.
 * Mimics the dashboard layout (sidebar + content) for perceived performance.
 */
export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col p-6 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-200 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-2.5 w-16 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
        {/* Menu items */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3.5 rounded-lg bg-gray-100 animate-pulse flex-1" style={{ animationDelay: `${i * 100}ms`, width: `${60 + Math.random() * 30}%` }} />
          </div>
        ))}
        {/* User card at bottom */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-3.5 w-72 bg-gray-100 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }} />
          </div>
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" style={{ animationDelay: `${i * 150 + 50}ms` }} />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" style={{ animationDelay: `${i * 150 + 100}ms` }} />
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-emerald-100 rounded-xl animate-pulse" />
          </div>
          {/* Table-like rows */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded-md animate-pulse" style={{ animationDelay: `${i * 80}ms`, width: `${30 + Math.random() * 40}%` }} />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse" style={{ animationDelay: `${i * 80 + 50}ms`, width: `${20 + Math.random() * 30}%` }} />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Minimal loading spinner for lightweight pages (Login, TasmiSession)
 */
export const MiniLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-400 animate-pulse">Memuat...</p>
      </div>
    </div>
  );
};

/**
 * HeaderOnlyFallback — Skeleton for Parent/Student dashboards without sidebar
 */
export const HeaderOnlyFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16 flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block space-y-1.5 text-right">
            <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse ml-auto" />
            <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 mt-6 space-y-6">
        {/* Banner/Tabs Area */}
        <div className="h-12 w-full bg-emerald-50/50 rounded-xl border border-emerald-100/50 animate-pulse" />

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-48 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-3xl animate-pulse" />
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 h-24 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
             ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="h-96 bg-white rounded-3xl border border-gray-100 p-6 animate-pulse" />
      </div>
    </div>
  );
};
