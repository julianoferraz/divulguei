import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Star, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageBusinesses() {
  const { citySlug } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = () => {
    if (!citySlug) return;
    setLoading(true);
    api.getBusinesses(citySlug, { page: String(page), limit: '20' })
      .then(r => { setItems(r.data || []); setTotal(r.pagination?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [citySlug, page]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await api.deleteBusiness(citySlug!, id);
      fetchData();
    } catch { alert('Erro ao excluir.'); }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.updateBusiness(citySlug!, id, { is_featured: !current });
      fetchData();
    } catch { alert('Erro ao atualizar.'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Empresas</h1>
            <p className="text-sm text-gray-500">{total} cadastradas</p>
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhuma empresa" message="Cadastre a primeira empresa." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Bairro</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Views</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Destaque</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((biz: any) => (
                <tr key={biz.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{biz.name}</div>
                    <div className="text-xs text-gray-400">{biz.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{biz.category_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{biz.neighborhood || '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{biz.views || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleFeatured(biz.id, biz.is_featured)}
                      className={`p-1 rounded ${biz.is_featured ? 'text-yellow-500' : 'text-gray-300'} hover:opacity-70`}>
                      <Star size={16} fill={biz.is_featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/${citySlug}/empresa/${biz.slug}`} className="p-1.5 text-gray-400 hover:text-primary-600">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => handleDelete(biz.id, biz.name)} className="p-1.5 text-gray-400 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">Anterior</button>
          <span className="text-sm text-gray-500 py-2">Página {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={items.length < 20} className="btn-secondary text-sm">Próxima</button>
        </div>
      )}
    </div>
  );
}
