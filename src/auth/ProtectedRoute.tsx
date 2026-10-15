import { Navigate, Outlet } from 'react-router'
import { getToken } from './token'

export default function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />
}
