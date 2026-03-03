import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Phone, MessageCircle, Star, X } from 'lucide-react';
import { api } from '../services/api';
import { formatPhone, whatsappLink } from '../utils/format';
import { LoadingSpinner, EmptyState } from '../components/UI';

export default function Professionals() {
  const { citySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  const categoryId = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    api.getCategories({ type: 'professional' }).then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    const params: any = { page, limit: '12' };
    if (categoryId) params.category_id = categoryId;
    if (search) params.search = search;

    api.getProfessionals(citySlug, params)
      .then(r => { setItems(r.data || []); setPagination(r.pagination || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [citySlug, categoryId, search, page]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profissionais & Serviços</h1>
        <p className="text-sm text-gray-500">Encontre o profissional ideal para o que você precisa</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <button onClick={() => setFilter('category', '')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border ${!categoryId ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
          Todos
        </button>
        {categories.map((c: any) => (
          <button key={c.id} onClick={() => setFilter('category', c.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border ${categoryId === c.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar profissional..." defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setFilter('search', (e.target as HTMLInputElement).value); }}
            className="input pl-9 text-sm" />
        </div>
        {(categoryId || search) && (
          <button onClick={() => setSearchParams({})} className="text-sm text-red-500 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhum profissional encontrado" message="Tente ajustar os filtros." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((prof: any) => (
              <div key={prof.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                    {prof.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{prof.name}</h3>
                    {prof.category_name && <p className="text-xs text-primary-600">{prof.category_name}</p>}
                    {prof.specialty && <p className="text-xs text-gray-500 mt-0.5">{prof.specialty}</p>}
                  </div>
                </div>
                {prof.description && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2">{prof.description}</p>
                )}
                {prof.neighborhood && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                    <MapPin size={12} />{prof.neighborhood}
                  </p>
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  {prof.whatsapp && (
                    <a href={whatsappLink(prof.whatsapp, `Olá ${prof.name}! Vi seu perfil no Divulguei.Online`)}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-whatsapp text-xs flex items-center gap-1 flex-1 justify-center">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  {prof.phone && (
                    <a href={`tel:${prof.phone}`} className="btn-secondary text-xs flex items-center gap-1 flex-1 justify-center">
                      <Phone size={14} /> Ligar
                    </a>
                  )}
                </div>
              </div>
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
