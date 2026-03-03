import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { formatPrice, timeAgo, typeLabel } from '../../utils/format';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageClassifieds() {
  const { citySlug } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!citySlug) return;
    setLoading(true);
    api.getClassifieds(citySlug, { limit: '50' })
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [citySlug]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este classificado?')) return;
    try {
      await api.deleteClassified(citySlug!, id);
      fetchData();
    } catch { alert('Erro ao excluir.'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Classificados</h1>
          <p className="text-sm text-gray-500">{items.length} anúncios</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhum classificado" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Preço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Criado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{typeLabel(item.type)}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium hidden md:table-cell">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {item.status === 'active' ? (
                      <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Ativo</span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1"><XCircle size={14} /> {item.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{timeAgo(item.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/${citySlug}/classificados/${item.id}`} className="p-1.5 text-gray-400 hover:text-primary-600">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600">
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
    </div>
  );
}
