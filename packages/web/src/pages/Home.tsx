import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, Store, ShoppingBag, Wrench, Briefcase, Calendar, Newspaper, Phone, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { formatPrice, timeAgo } from '../utils/format';
import { LoadingSpinner } from '../components/UI';

export default function Home() {
  const { citySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [recentClassifieds, setRecentClassifieds] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citySlug) return;

    Promise.all([
      api.getBusinesses(citySlug, { is_featured: 'true', limit: '8' }).catch(() => ({ data: [] })),
      api.getClassifieds(citySlug, { limit: '8' }).catch(() => ({ data: [] })),
      api.getEvents(citySlug, { limit: '6' }).catch(() => ({ data: [] })),
      api.getJobs(citySlug, { limit: '5' }).catch(() => ({ data: [] })),
      api.getNews(citySlug, { limit: '4' }).catch(() => ({ data: [] })),
    ]).then(([biz, cls, evt, job, news]) => {
      setFeaturedBusinesses(biz.data || []);
      setRecentClassifieds(cls.data || []);
      setUpcomingEvents(evt.data || []);
      setRecentJobs(job.data || []);
      setRecentNews(news.data || []);
    }).finally(() => setLoading(false));
  }, [citySlug]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q && citySlug) {
      handleSearch(q);
    }
  }, [searchParams]);

  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    if (!q.trim() || !citySlug) return;

    setSearching(true);
    try {
      const res = await api.search(citySlug, q.trim());
      setSearchResults(res.data);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const quickLinks = [
    { to: `/${citySlug}/empresas`, icon: <Store size={24} />, label: 'Empresas', color: 'bg-blue-100 text-blue-600' },
    { to: `/${citySlug}/classificados`, icon: <ShoppingBag size={24} />, label: 'Classificados', color: 'bg-green-100 text-green-600' },
    { to: `/${citySlug}/profissionais`, icon: <Wrench size={24} />, label: 'Profissionais', color: 'bg-orange-100 text-orange-600' },
    { to: `/${citySlug}/empregos`, icon: <Briefcase size={24} />, label: 'Empregos', color: 'bg-purple-100 text-purple-600' },
    { to: `/${citySlug}/eventos`, icon: <Calendar size={24} />, label: 'Eventos', color: 'bg-pink-100 text-pink-600' },
    { to: `/${citySlug}/noticias`, icon: <Newspaper size={24} />, label: 'Notícias', color: 'bg-sky-100 text-sky-600' },
    { to: `/${citySlug}/utilidade-publica`, icon: <Phone size={24} />, label: 'Utilidade Pública', color: 'bg-red-100 text-red-600' },
  ];

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 md:p-10 text-center text-white mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">O que você está procurando?</h1>
        <p className="text-primary-100 text-sm mb-4">Ex: pizzaria aberta agora, casa pra alugar, eletricista...</p>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="max-w-xl mx-auto flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar empresas, serviços, classificados..."
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>
          <button type="submit" className="bg-white text-primary-600 font-medium px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Buscar
          </button>
        </form>
      </section>

      {/* Search Results */}
      {searching && <LoadingSpinner text="Buscando..." />}
      {searchResults && !searching && (
        <section className="mb-8">
          <h2 className="section-title">Resultados da busca</h2>
          {searchResults.sections?.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum resultado encontrado. Tente termos diferentes.</p>
          ) : (
            searchResults.sections?.map((section: any) => (
              <div key={section.type} className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">{section.label} ({section.items.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.items.slice(0, 6).map((item: any) => (
                    <div key={item.id} className="card p-4">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name || item.title}</h4>
                      {item.category_name && <span className="text-xs text-gray-500">{item.category_name}</span>}
                      {item.phone && <p className="text-xs text-gray-500 mt-1">📞 {item.phone}</p>}
                      {item.price && <p className="text-sm font-semibold text-primary-600 mt-1">{formatPrice(item.price)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          <button onClick={() => setSearchResults(null)} className="btn-secondary text-sm mt-2">Limpar busca</button>
        </section>
      )}

      {/* Quick links */}
      <section className="mb-8">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center">
              <div className={`p-3 rounded-xl ${link.color}`}>{link.icon}</div>
              <span className="text-xs font-medium text-gray-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Próximos Eventos</h2>
            <Link to={`/${citySlug}/eventos`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcomingEvents.map((event: any) => (
              <Link key={event.id} to={`/${citySlug}/eventos/${event.id}`}
                className="card min-w-[200px] flex-shrink-0">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-28 object-cover" loading="lazy" />
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {new Date(event.starts_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                  {event.venue_name && <p className="text-xs text-gray-500">📍 {event.venue_name}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Classifieds */}
      {recentClassifieds.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Últimos Classificados</h2>
            <Link to={`/${citySlug}/classificados`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentClassifieds.map((item: any) => (
              <Link key={item.id} to={`/${citySlug}/classificados/${item.id}`} className="card">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-32 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-3xl">📦</div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{item.title}</h3>
                  <p className="text-primary-600 font-bold text-sm mt-1">{formatPrice(item.price)}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Businesses */}
      {featuredBusinesses.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Empresas em Destaque</h2>
            <Link to={`/${citySlug}/empresas`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featuredBusinesses.map((biz: any) => (
              <Link key={biz.id} to={`/${citySlug}/empresa/${biz.slug}`}
                className="card min-w-[180px] flex-shrink-0 p-4 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-2">
                  {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" /> : '🏪'}
                </div>
                <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{biz.name}</h3>
                <p className="text-xs text-gray-500">{biz.category_name || ''}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent News */}
      {recentNews.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Últimas Notícias</h2>
            <Link to={`/${citySlug}/noticias`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentNews.map((article: any) => (
              <div key={article.id} className="card">
                {article.image_url && (
                  <img src={article.image_url} alt={article.title} className="w-full h-32 object-cover" loading="lazy" />
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{article.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{article.source_name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Vagas Recentes</h2>
            <Link to={`/${citySlug}/empregos`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentJobs.map((job: any) => (
              <Link key={job.id} to={`/${citySlug}/empregos/${job.id}`}
                className="card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm text-gray-900">{job.title}</h3>
                  <p className="text-xs text-gray-500">
                    {job.business_name && `${job.business_name} · `}{job.salary_info || ''}
                  </p>
                </div>
                <span className="badge-blue">{job.job_type?.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
