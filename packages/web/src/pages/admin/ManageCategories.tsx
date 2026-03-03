import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Pencil, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageCategories() {
  const { citySlug } = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('business');

  const types = [
    { value: 'business', label: 'Empresas' },
    { value: 'classified', label: 'Classificados' },
    { value: 'professional', label: 'Profissionais' },
    { value: 'event', label: 'Eventos' },
    { value: 'job', label: 'Empregos' },
  ];

  const fetchData = () => {
    setLoading(true);
    api.getCategories({ type: activeType })
      .then(r => setCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [activeType]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {types.map(t => (
          <button key={t.value} onClick={() => setActiveType(t.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border ${activeType === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria" />
      ) : (
        <div className="space-y-3">
          {categories.map((cat: any) => (
            <div key={cat.id} className="card">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon || '📁'}</span>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400">Slug: {cat.slug}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{cat.children?.length || 0} sub</span>
              </div>
              {cat.children?.length > 0 && (
                <div className="border-t border-gray-50 px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {cat.children.map((sub: any) => (
                      <span key={sub.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {sub.icon || ''} {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
