import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, AppLayout } from './ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import BanList from '../pages/BanList'
import Settings from '../pages/Settings'
import Check from '../pages/Check'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/check', element: <Check /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/ban-list', element: <BanList /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute adminOnly />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/settings', element: <Settings /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
