import { Navigate, Outlet } from 'react-router'
import Chatbot from '../components/Chatbot'
import { getToken } from './token'

export default function ProtectedRoute() {
  return getToken() ? (
    <>
      <Outlet />
      <Chatbot />
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}
