import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Plus } from 'lucide-react';
import { api } from '../services/api';
import { formatPrice, timeAgo, typeLabel, typeBadgeColor } from '../utils/format';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

const TYPES = [
  { value: '', label: 'Todos' },
  { value: 'sell', label: 'Venda' },
  { value: 'buy', label: 'Procura-se' },
  { value: 'rent_offer', label: 'Alugar' },
  { value: 'rent_search', label: 'Procuro Aluguel' },
  { value: 'service', label: 'Serviço' },
];

export default function Classifieds() {
  const { citySlug } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  const type = searchParams.get('type') || '';
  const categoryId = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    api.getCategories({ type: 'classified' }).then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    const params: any = { page, limit: '12' };
    if (type) params.type = type;
    if (categoryId) params.category_id = categoryId;
    if (search) params.search = search;

    api.getClassifieds(citySlug, params)
      .then(res => { setItems(res.data || []); setPagination(res.pagination || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [citySlug, type, categoryId, search, page]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classificados</h1>
          <p className="text-sm text-gray-500">Compre, venda e troque na sua cidade</p>
        </div>
        {user && (
          <Link to={`/${citySlug}/classificados/novo`} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Anunciar
          </Link>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setFilter('type', t.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${type === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar classificados..." defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setFilter('search', (e.target as HTMLInputElement).value); }}
            className="input pl-9 text-sm" />
        </div>
        <select value={categoryId} onChange={e => setFilter('category', e.target.value)} className="input w-auto text-sm">
          <option value="">Todas as categorias</option>
          {categories.map((cat: any) => (
            <optgroup key={cat.id} label={cat.name}>
              {cat.children?.map((sub: any) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {(type || categoryId || search) && (
          <button onClick={() => setSearchParams({})} className="text-sm text-red-500 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhum classificado encontrado" message="Seja o primeiro a anunciar!" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item: any) => (
              <Link key={item.id} to={`/${citySlug}/classificados/${item.id}`}
                className="card hover:shadow-md transition-shadow">
                <div className="relative">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-36 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-3xl">📦</div>
                  )}
                  <span className={`absolute top-2 left-2 ${typeBadgeColor(item.type)} text-xs px-2 py-0.5 rounded-full font-medium`}>
                    {typeLabel(item.type)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{item.title}</h3>
                  <p className="text-primary-600 font-bold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    {item.neighborhood && <span className="text-xs text-gray-400">{item.neighborhood}</span>}
                    <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(p)); setSearchParams(next); }}
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
