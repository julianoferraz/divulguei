import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppFab from './components/WhatsAppFab';

// Pages
import CitySelector from './pages/CitySelector';
import Home from './pages/Home';
import Businesses from './pages/Businesses';
import BusinessDetail from './pages/BusinessDetail';
import Classifieds from './pages/Classifieds';
import ClassifiedDetail from './pages/ClassifiedDetail';
import ClassifiedCreate from './pages/ClassifiedCreate';
import Professionals from './pages/Professionals';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import News from './pages/News';
import PublicServices from './pages/PublicServices';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminBusinesses from './pages/admin/ManageBusinesses';
import AdminClassifieds from './pages/admin/ManageClassifieds';
import AdminEvents from './pages/admin/ManageEvents';
import AdminCategories from './pages/admin/ManageCategories';
import AdminCities from './pages/admin/ManageCities';
import AdminGroups from './pages/admin/ManageGroups';
import AdminClaims from './pages/admin/ManageClaims';

function CityLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* City selector */}
        <Route path="/" element={<CitySelector />} />

        {/* City-scoped public routes */}
        <Route path="/:citySlug" element={<CityLayout />}>
          <Route index element={<Home />} />
          <Route path="empresas" element={<Businesses />} />
          <Route path="empresa/:slug" element={<BusinessDetail />} />
          <Route path="classificados" element={<Classifieds />} />
          <Route path="classificados/novo" element={<ClassifiedCreate />} />
          <Route path="classificados/:id" element={<ClassifiedDetail />} />
          <Route path="profissionais" element={<Professionals />} />
          <Route path="empregos" element={<Jobs />} />
          <Route path="eventos" element={<Events />} />
          <Route path="eventos/:id" element={<EventDetail />} />
          <Route path="noticias" element={<News />} />
          <Route path="utilidade-publica" element={<PublicServices />} />
          <Route path="login" element={<Login />} />
          <Route path="perfil" element={<Profile />} />
        </Route>

        {/* Admin routes */}
        <Route path="/:citySlug/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="empresas" element={<AdminBusinesses />} />
          <Route path="classificados" element={<AdminClassifieds />} />
          <Route path="eventos" element={<AdminEvents />} />
          <Route path="categorias" element={<AdminCategories />} />
          <Route path="cidades" element={<AdminCities />} />
          <Route path="grupos" element={<AdminGroups />} />
          <Route path="reivindicacoes" element={<AdminClaims />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
