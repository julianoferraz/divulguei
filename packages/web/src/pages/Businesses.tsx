import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/UI';

export default function Businesses() {
  const { citySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);

  const categoryId = searchParams.get('category') || '';
  const neighborhood = searchParams.get('bairro') || '';
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    if (!citySlug) return;
    api.getCategories({ type: 'business' }).then(res => setCategories(res.data || [])).catch(() => {});
  }, [citySlug]);

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    const params: any = { page, limit: '12' };
    if (categoryId) params.category_id = categoryId;
    if (neighborhood) params.neighborhood = neighborhood;
    if (search) params.search = search;

    api.getBusinesses(citySlug, params)
      .then(res => {
        setBusinesses(res.data || []);
        setPagination(res.pagination || null);
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, [citySlug, categoryId, neighborhood, search, page]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = categoryId || neighborhood || search;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas & Comércios</h1>
          <p className="text-sm text-gray-500">Encontre o que você precisa na sua cidade</p>
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className="btn-secondary flex items-center gap-2 text-sm md:hidden">
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* Filters */}
      <div className={`mb-6 space-y-3 ${showFilter ? '' : 'hidden md:block'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Buscar por nome..." defaultValue={search}
              onKeyDown={e => { if (e.key === 'Enter') setFilter('search', (e.target as HTMLInputElement).value); }}
              className="input pl-9 text-sm" />
          </div>
          <select value={categoryId} onChange={e => setFilter('category', e.target.value)}
            className="input w-auto text-sm">
            <option value="">Todas as categorias</option>
            {categories.map((cat: any) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children?.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <input type="text" placeholder="Bairro" value={neighborhood}
            onChange={e => setFilter('bairro', e.target.value)} className="input w-auto text-sm" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-red-500 flex items-center gap-1">
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Category Quick Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {categories.slice(0, 10).map((cat: any) => (
          <button key={cat.id} onClick={() => setFilter('category', cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoryId === cat.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : businesses.length === 0 ? (
        <EmptyState title="Nenhuma empresa encontrada" message="Tente ajustar seus filtros ou buscar por outro termo." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businesses.map((biz: any) => (
              <Link key={biz.id} to={`/${citySlug}/empresa/${biz.slug}`}
                className="card hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {biz.logo_url ? (
                    <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-4xl">🏪</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{biz.name}</h3>
                    {biz.is_featured && <Star size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" />}
                  </div>
                  {biz.category_name && <p className="text-xs text-primary-600 mt-0.5">{biz.category_name}</p>}
                  {biz.short_description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{biz.short_description}</p>}
                  {biz.neighborhood && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                      <MapPin size={12} />{biz.neighborhood}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(p)); setSearchParams(next); }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'}`}>
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
