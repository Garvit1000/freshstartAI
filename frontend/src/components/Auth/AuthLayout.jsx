import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const AuthLayout = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return children
}

export const UnauthLayout = ({ children }) => {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
