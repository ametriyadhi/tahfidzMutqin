import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './lib/api';
import { BrandingProvider } from './context/BrandingContext';
import { LoadingFallback, MiniLoadingFallback } from './components/LoadingFallback';

// ═══════════════════════════════════════════════════════════════
// Code Splitting — React.lazy() untuk setiap halaman
// Setiap halaman menjadi chunk JS terpisah yang hanya di-download
// ketika user mengakses route tersebut.
//
// Contoh: Login sebagai admin → hanya AdminDashboard chunk yang dimuat.
//         Santri tidak akan pernah download AdminDashboard code.
// ═══════════════════════════════════════════════════════════════

const Login = lazy(() =>
  import('./pages/Login').then(m => ({ default: m.Login }))
);

const SessionInit = lazy(() =>
  import('./pages/SessionInit').then(m => ({ default: m.SessionInit }))
);

const StudentDashboard = lazy(() =>
  import('./pages/StudentDashboard').then(m => ({ default: m.StudentDashboard }))
);

const ParentDashboard = lazy(() =>
  import('./pages/ParentDashboard').then(m => ({ default: m.ParentDashboard }))
);

const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

const TasmiSession = lazy(() =>
  import('./pages/TasmiSession').then(m => ({ default: m.TasmiSession }))
);

const CoordinatorDashboard = lazy(() =>
  import('./pages/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard }))
);

// Route guards
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const token = api.getToken();
  const user = api.getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on role
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'parent') return <Navigate to="/parent/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'koordinator') return <Navigate to="/coordinator/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrandingProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<MiniLoadingFallback />}>
                <Login />
              </Suspense>
            } />
            
            {/* Ustadz Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['ustadz']}>
                  <SessionInit />
                </ProtectedRoute>
              } 
            />

            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasmi" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Suspense fallback={<MiniLoadingFallback />}>
                    <TasmiSession />
                  </Suspense>
                </ProtectedRoute>
              } 
            />

            {/* Parent Routes */}
            <Route 
              path="/parent/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Coordinator Routes */}
            <Route 
              path="/coordinator/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['koordinator']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </BrandingProvider>
  );
}

export default App;
