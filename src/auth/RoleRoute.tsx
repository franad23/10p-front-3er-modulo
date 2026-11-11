import { Navigate, Outlet } from 'react-router'
import { getTokenPayload } from './token'

type Props = {
  roles: Array<'ADMIN' | 'CLIENT'>
}

export default function RoleRoute({ roles }: Props) {
  const user = getTokenPayload()

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/store'} replace />
  }

  return <Outlet />
}
