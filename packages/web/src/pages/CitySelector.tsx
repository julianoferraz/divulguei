import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/UI';

export default function CitySelector() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getCities()
      .then(r => {
        const data = r.data || [];
        setCities(data);
        // Auto-redirect if single city
        if (data.length === 1) {
          navigate(`/${data[0].slug}`, { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Carregando cidades..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Divulguei.Online</h1>
          <p className="text-primary-200 text-sm">O guia digital da sua cidade</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary-500" /> Selecione sua cidade
          </h2>

          {cities.length > 5 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cidade..." className="input pl-9 text-sm" />
            </div>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.map(city => (
              <Link key={city.id} to={`/${city.slug}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-colors group">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary-600">{city.name}</p>
                  <p className="text-xs text-gray-500">{city.state} · {city.population?.toLocaleString('pt-BR')} hab.</p>
                </div>
                <MapPin size={16} className="text-gray-300 group-hover:text-primary-500" />
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma cidade encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
