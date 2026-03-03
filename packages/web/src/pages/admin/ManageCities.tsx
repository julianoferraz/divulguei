import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageCities() {
  const { citySlug } = useParams();
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCities()
      .then(r => setCities(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-gray-900">Cidades</h1>
      </div>

      {loading ? <LoadingSpinner /> : cities.length === 0 ? (
        <EmptyState title="Nenhuma cidade" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cities.map((city: any) => (
            <div key={city.id} className="card p-5">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-primary-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">{city.name}</h3>
                  <p className="text-xs text-gray-500">{city.state} · {city.population?.toLocaleString('pt-BR')} hab.</p>
                  <p className="text-xs text-gray-400 mt-1">Slug: {city.slug}</p>
                  <span className={`text-xs mt-1 inline-block ${city.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {city.is_active ? '● Ativa' : '○ Inativa'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
