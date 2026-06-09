import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import PrivateRoute from './components/PrivateRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Materiels from './pages/Materiels'
import NouveauMateriel from './pages/NouveauMateriel'
import DetailMateriel from './pages/DetailMateriel'
import Categories from './pages/Categories'
import Emprunts from './pages/Emprunts'
import Historique from './pages/Historique'
import Notifications from './pages/Notifications'
import Utilisateurs from './pages/Utilisateurs'
import Panier from './pages/Panier'

// Les autres pages seront ajoutées au fur et à mesure
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Pages publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Pages privées — enveloppées dans le layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="materiels" element={<Materiels />} />
            <Route path="materiels/nouveau" element={<NouveauMateriel />} />
            <Route path="materiels/:id/modifier" element={<NouveauMateriel />} />
            <Route path="materiels/:id" element={<DetailMateriel />} />
            <Route path="categories" element={<Categories />} />
            <Route path="emprunts" element={<Emprunts />} />
            <Route path="historique" element={<Historique />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="panier" element={<Panier />} />
          </Route>

          {/* Redirige tout le reste vers la racine */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
