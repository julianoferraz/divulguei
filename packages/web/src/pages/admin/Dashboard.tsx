import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart3, Store, ShoppingBag, Users, Calendar, Search, Bell, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner } from '../../components/UI';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { citySlug } = useParams();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citySlug) return;
    api.getAdminDashboard(citySlug)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso restrito</h1>
        <p className="text-gray-500">Você precisa ter permissão de administrador.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Empresas', count: stats?.businesses || 0, icon: <Store size={20} />, to: `/${citySlug}/admin/empresas`, color: 'bg-blue-100 text-blue-600' },
    { label: 'Classificados', count: stats?.classifieds || 0, icon: <ShoppingBag size={20} />, to: `/${citySlug}/admin/classificados`, color: 'bg-green-100 text-green-600' },
    { label: 'Eventos', count: stats?.events || 0, icon: <Calendar size={20} />, to: `/${citySlug}/admin/eventos`, color: 'bg-pink-100 text-pink-600' },
    { label: 'Usuários', count: stats?.users || 0, icon: <Users size={20} />, to: '#', color: 'bg-purple-100 text-purple-600' },
  ];

  const adminLinks = [
    { label: 'Gerenciar Categorias', to: `/${citySlug}/admin/categorias`, icon: <Settings size={18} /> },
    { label: 'Gerenciar Cidades', to: `/${citySlug}/admin/cidades`, icon: <Settings size={18} /> },
    { label: 'Grupos WhatsApp', to: `/${citySlug}/admin/grupos`, icon: <Settings size={18} /> },
    { label: 'Reivindicações', to: `/${citySlug}/admin/reivindicacoes`, icon: <Bell size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={24} /> Painel Administrativo
        </h1>
        <p className="text-sm text-gray-500">Visão geral da plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.to} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.count}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Top searches */}
      {stats?.topSearches?.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Search size={18} /> Buscas mais realizadas
          </h2>
          <div className="space-y-2">
            {stats.topSearches.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.query}</span>
                <span className="text-gray-400">{item.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {adminLinks.map(link => (
          <Link key={link.label} to={link.to}
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2 bg-gray-100 rounded-lg">{link.icon}</div>
            <span className="font-medium text-gray-700 text-sm">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
