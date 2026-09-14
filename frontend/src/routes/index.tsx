import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import ReportDamage from '../pages/ReportDamage';
import MapView from '../pages/MapView';
import Admin from '../pages/Admin';

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
    path: '/report',
    element: <ReportDamage />,
  },
  {
    path: '/map',
    element: <MapView />,
  },
  {
    path: '/admin',
    element: <Admin />,
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