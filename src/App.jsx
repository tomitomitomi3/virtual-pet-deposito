import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Board from './pages/Board'
import UsersPage from './pages/UsersPage'

const PrivateRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token || (user?.role !== 'admin' && user?.role !== 'deposito')) {
    return <Navigate to="/login" />
  }
  return children
}

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/" />
  }
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Board />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/usuarios" 
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
