import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageEvents() {
  const { citySlug } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!citySlug) return;
    setLoading(true);
    api.getEvents(citySlug, { limit: '50' })
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [citySlug]);

  const handleApprove = async (id: string) => {
    try {
      await api.approveEvent(citySlug!, id);
      fetchData();
    } catch { alert('Erro ao aprovar.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este evento?')) return;
    try {
      await api.deleteEvent(citySlug!, id);
      fetchData();
    } catch { alert('Erro ao excluir.'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500">{items.length} eventos</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Nenhum evento" />
      ) : (
        <div className="space-y-3">
          {items.map((event: any) => (
            <div key={event.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{event.title}</h3>
                  {event.is_approved ? (
                    <span className="text-green-600 text-xs flex items-center gap-0.5"><CheckCircle size={12} /> Aprovado</span>
                  ) : (
                    <span className="text-yellow-600 text-xs flex items-center gap-0.5"><XCircle size={12} /> Pendente</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  📅 {new Date(event.starts_at).toLocaleDateString('pt-BR')} · {event.venue_name || ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!event.is_approved && (
                  <button onClick={() => handleApprove(event.id)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                    Aprovar
                  </button>
                )}
                <Link to={`/${citySlug}/eventos/${event.id}`} className="p-1.5 text-gray-400 hover:text-primary-600">
                  <Eye size={15} />
                </Link>
                <button onClick={() => handleDelete(event.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
