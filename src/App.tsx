import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import ProtectedRoute from './auth/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import RoleRoute from './auth/RoleRoute'
import Store from './pages/Store'
import Orders from './pages/Orders'
import PaymentResult from './pages/PaymentResult'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route element={<RoleRoute roles={['CLIENT', 'ADMIN']} />}>
            <Route path="/store" element={<Store />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
        </Route>
        <Route path="/payment/success" element={<PaymentResult status="success" />} />
        <Route path="/payment/pending" element={<PaymentResult status="pending" />} />
        <Route path="/payment/failure" element={<PaymentResult status="failure" />} />
        <Route path="*" element={<Navigate to="/store" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
