import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/UI';

export default function Events() {
  const { citySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    const params: any = { page, limit: '12' };
    if (search) params.search = search;

    api.getEvents(citySlug, params)
      .then(r => { setItems(r.data || []); setPagination(r.pagination || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [citySlug, search, page]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <p className="text-sm text-gray-500">O que está acontecendo na cidade</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar eventos..." defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') { const n = new URLSearchParams(searchParams); n.set('search', (e.target as HTMLInputElement).value); n.delete('page'); setSearchParams(n); }}}
            className="input pl-9 text-sm" />
        </div>
        {search && (
          <button onClick={() => setSearchParams({})} className="text-sm text-red-500 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhum evento encontrado" message="Fique de olho — novos eventos aparecem sempre!" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((event: any) => (
              <Link key={event.id} to={`/${citySlug}/eventos/${event.id}`}
                className="card hover:shadow-md transition-shadow overflow-hidden">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-5xl">🎉</div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-primary-500" /> {formatDate(event.starts_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-primary-500" /> {formatTime(event.starts_at)}
                    </span>
                    {event.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary-500" /> {event.venue_name}
                      </span>
                    )}
                  </div>
                  {event.is_free ? (
                    <span className="badge-green text-xs mt-2 inline-block">Gratuito</span>
                  ) : event.price_info && (
                    <span className="text-sm font-semibold text-primary-600 mt-2 inline-block">{event.price_info}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', String(p)); setSearchParams(n); }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
