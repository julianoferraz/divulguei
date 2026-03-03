import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Trash2, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';

export default function ManageGroups() {
  const { citySlug } = useParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!citySlug) return;
    setLoading(true);
    api.getAdminGroups(citySlug)
      .then(r => setGroups(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [citySlug]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este grupo?')) return;
    try {
      await api.deleteAdminGroup(citySlug!, id);
      fetchData();
    } catch { alert('Erro ao remover.'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-gray-900">Grupos WhatsApp</h1>
      </div>

      {loading ? <LoadingSpinner /> : groups.length === 0 ? (
        <EmptyState title="Nenhum grupo cadastrado" message="Os grupos são adicionados automaticamente quando o bot entra." />
      ) : (
        <div className="space-y-3">
          {groups.map((group: any) => (
            <div key={group.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle size={18} className="text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{group.name}</h3>
                  <p className="text-xs text-gray-500">
                    JID: {group.jid?.slice(0, 20)}... · {group.is_active ? '🟢 Ativo' : '🔴 Inativo'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Msgs hoje: {group.daily_message_count || 0} / {group.daily_limit || 50}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(group.id)} className="p-2 text-gray-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
