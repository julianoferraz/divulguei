import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, MapPin, Clock, Globe, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { formatPhone } from '../utils/format';
import { LoadingSpinner, EmptyState } from '../components/UI';

export default function PublicServices() {
  const { citySlug } = useParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citySlug) return;
    api.getPublicServices(citySlug)
      .then(r => setGroups(r.data || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilidade Pública</h1>
        <p className="text-sm text-gray-500">Telefones e serviços úteis da cidade</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="Nenhum serviço cadastrado" message="Em breve listaremos os serviços públicos da cidade." />
      ) : (
        <div className="space-y-6">
          {groups.map((group: any) => (
            <div key={group.category}>
              <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                {group.category === 'emergency' && '🚨'}
                {group.category === 'health' && '🏥'}
                {group.category === 'education' && '🎓'}
                {group.category === 'government' && '🏛️'}
                {group.category === 'utilities' && '⚡'}
                {group.category === 'transport' && '🚌'}
                {group.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items?.map((svc: any) => (
                  <div key={svc.id} className="card p-4">
                    <h3 className="font-semibold text-sm text-gray-900">{svc.name}</h3>
                    {svc.description && <p className="text-xs text-gray-500 mt-1">{svc.description}</p>}
                    <div className="flex flex-col gap-1 mt-3">
                      {svc.phone && (
                        <a href={`tel:${svc.phone}`} className="text-sm text-primary-600 flex items-center gap-1.5 hover:underline">
                          <Phone size={13} /> {formatPhone(svc.phone)}
                        </a>
                      )}
                      {svc.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <MapPin size={13} /> {svc.address}
                        </p>
                      )}
                      {svc.opening_hours && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Clock size={13} /> {svc.opening_hours}
                        </p>
                      )}
                      {svc.website && (
                        <a href={svc.website} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-600 flex items-center gap-1.5 hover:underline">
                          <Globe size={13} /> Site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
