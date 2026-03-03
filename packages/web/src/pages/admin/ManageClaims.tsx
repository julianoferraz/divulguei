import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';
import { timeAgo } from '../../utils/format';

export default function ManageClaims() {
  const { citySlug } = useParams();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.getAdminClaims()
      .then(r => setClaims(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (claimId: string, action: 'approved' | 'rejected') => {
    try {
      await api.updateAdminClaim(claimId, action);
      fetchData();
    } catch { alert('Erro ao processar.'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${citySlug}/admin`} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-gray-900">Reivindicações de Empresas</h1>
      </div>

      {loading ? <LoadingSpinner /> : claims.length === 0 ? (
        <EmptyState title="Nenhuma reivindicação" message="Quando alguém reivindicar uma empresa, aparecerá aqui." />
      ) : (
        <div className="space-y-3">
          {claims.map((claim: any) => (
            <div key={claim.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{claim.business_name || 'Empresa'}</h3>
                  <p className="text-sm text-gray-500 mt-1">Solicitante: {claim.user_name || claim.user_phone}</p>
                  {claim.message && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">"{claim.message}"</p>}
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={12} /> {timeAgo(claim.created_at)}
                  </p>
                </div>
                <div>
                  {claim.status === 'pending' ? (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pendente</span>
                  ) : claim.status === 'approved' ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Aprovado</span>
                  ) : (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">Rejeitado</span>
                  )}
                </div>
              </div>
              {claim.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => handleAction(claim.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                    <CheckCircle size={16} /> Aprovar
                  </button>
                  <button onClick={() => handleAction(claim.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                    <XCircle size={16} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
