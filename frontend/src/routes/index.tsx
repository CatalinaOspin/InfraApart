import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ReportDamage from '../pages/ReportDamage';
import MapView from '../pages/MapView';
import Admin from '../pages/Admin';
import { useAuth } from '../context/AuthContext';

interface ProtectedProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Ruta protegida por sesión JWT: redirige a /login (guardando el destino) y
 * exige rol "admin" cuando adminOnly=true (p. ej. el panel administrativo).
 */
const ProtectedRoute: React.FC<ProtectedProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="page-container muted">Cargando sesión…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/map" replace />;
  }
  return <>{children}</>;
};

/**
 * Configuración de rutas de la aplicación
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/report',
    element: (
      <ProtectedRoute>
        <ReportDamage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/map',
    element: (
      <ProtectedRoute>
        <MapView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute adminOnly>
        <Admin />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;