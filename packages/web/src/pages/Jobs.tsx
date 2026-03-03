import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, Briefcase, MapPin, X } from 'lucide-react';
import { api } from '../services/api';
import { timeAgo } from '../utils/format';
import { LoadingSpinner, EmptyState } from '../components/UI';

const JOB_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'full-time', label: 'CLT' },
  { value: 'part-time', label: 'Meio-período' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'temporary', label: 'Temporário' },
  { value: 'internship', label: 'Estágio' },
];

export default function Jobs() {
  const { citySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  const jobType = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);
    const params: any = { page, limit: '15' };
    if (jobType) params.job_type = jobType;
    if (search) params.search = search;

    api.getJobs(citySlug, params)
      .then(r => { setItems(r.data || []); setPagination(r.pagination || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [citySlug, jobType, search, page]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vagas de Emprego</h1>
        <p className="text-sm text-gray-500">Oportunidades na sua região</p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {JOB_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilter('type', t.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border ${jobType === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Cargo, empresa..." defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setFilter('search', (e.target as HTMLInputElement).value); }}
            className="input pl-9 text-sm" />
        </div>
        {(jobType || search) && (
          <button onClick={() => setSearchParams({})} className="text-sm text-red-500 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhuma vaga encontrada" message="Volte em breve para novas oportunidades." />
      ) : (
        <div className="space-y-3">
          {items.map((job: any) => (
            <div key={job.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {job.business_name && <span className="text-sm text-gray-600">{job.business_name}</span>}
                    {job.neighborhood && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin size={10} />{job.neighborhood}
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge-blue whitespace-nowrap">{job.job_type?.replace('-', ' ').toUpperCase()}</span>
              </div>
              {job.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.description}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {job.salary_info && <span className="text-sm font-medium text-green-600">{job.salary_info}</span>}
                  <span>{timeAgo(job.created_at)}</span>
                </div>
                {job.contact_phone && (
                  <a href={`https://wa.me/55${job.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a vaga de ${job.title} no Divulguei.Online`)}`}
                    target="_blank" rel="noopener noreferrer" className="btn-whatsapp text-xs flex items-center gap-1">
                    Candidatar-se
                  </a>
                )}
              </div>
            </div>
          ))}

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
        </div>
      )}
    </div>
  );
}
