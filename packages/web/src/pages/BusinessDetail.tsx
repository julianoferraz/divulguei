import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Globe, Clock, Star, Share2, MessageCircle, ArrowLeft, Flag } from 'lucide-react';
import { api } from '../services/api';
import { formatPhone, whatsappLink } from '../utils/format';
import { LoadingSpinner, ErrorMessage } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

export default function BusinessDetail() {
  const { citySlug, slug } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!citySlug || !slug) return;
    api.getBusinessBySlug(citySlug, slug)
      .then(res => setBusiness(res.data))
      .catch(() => setError('Empresa não encontrada.'))
      .finally(() => setLoading(false));
  }, [citySlug, slug]);

  const handleClaim = async () => {
    if (!business) return;
    setClaiming(true);
    try {
      await api.claimBusiness(citySlug!, business.id, claimMessage);
      alert('Solicitação enviada! Um administrador irá revisar.');
      setShowClaimModal(false);
    } catch {
      alert('Erro ao solicitar. Tente novamente.');
    } finally {
      setClaiming(false);
    }
  };

  const shareBusiness = () => {
    if (navigator.share) {
      navigator.share({ title: business.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!business) return null;

  const openingHours = business.opening_hours;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to={`/${citySlug}/empresas`} className="text-sm text-primary-600 flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </Link>

      {/* Header image */}
      <div className="card overflow-hidden mb-6">
        {business.photos?.[0] ? (
          <img src={business.photos[0]} alt={business.name} className="w-full h-48 md:h-64 object-cover" />
        ) : (
          <div className="w-full h-48 md:h-64 bg-gradient-to-r from-primary-100 to-primary-50 flex items-center justify-center">
            <span className="text-7xl">🏪</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {business.logo_url && (
                  <img src={business.logo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">{business.name}</h1>
                  {business.category_name && <span className="badge-blue text-xs">{business.category_name}</span>}
                </div>
              </div>
              {business.is_featured && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                  <Star size={12} fill="currentColor" /> Destaque
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={shareBusiness} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" title="Compartilhar">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <p className="text-gray-600 mt-4 text-sm leading-relaxed">{business.description}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {business.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">{business.address}</p>
                  <p className="text-gray-500 text-xs">{business.neighborhood}</p>
                </div>
              </div>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
                <Phone size={16} className="text-primary-500" />
                {formatPhone(business.phone)}
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
                <Globe size={16} className="text-primary-500" />
                {business.website.replace(/https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Opening Hours */}
          {openingHours && typeof openingHours === 'object' && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1 mb-2">
                <Clock size={14} /> Horário de Funcionamento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-xs py-1 border-b border-gray-50">
                    <span className="font-medium text-gray-700 capitalize">{day}</span>
                    <span className="text-gray-500">{hours as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos gallery */}
          {business.photos?.length > 1 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {business.photos.slice(1).map((photo: string, i: number) => (
                  <img key={i} src={photo} alt={`${business.name} ${i + 2}`}
                    className="w-full h-28 object-cover rounded-lg" loading="lazy" />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
            {business.whatsapp && (
              <a href={whatsappLink(business.whatsapp, `Olá! Encontrei a ${business.name} no Divulguei.Online`)}
                target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex items-center gap-2 text-sm">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="btn-primary flex items-center gap-2 text-sm">
                <Phone size={16} /> Ligar
              </a>
            )}
            {user && !business.claimed_by && (
              <button onClick={() => setShowClaimModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <Flag size={16} /> É minha empresa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Views counter */}
      <p className="text-xs text-gray-400 text-center">👁 {business.views || 0} visualizações</p>

      {/* Claim modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClaimModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Reivindicar Empresa</h3>
            <p className="text-sm text-gray-500 mb-4">
              Informe por que esta empresa é sua. Um administrador irá analisar a solicitação.
            </p>
            <textarea value={claimMessage} onChange={e => setClaimMessage(e.target.value)}
              placeholder="Ex: Sou o proprietário, meu CNPJ é..."
              className="input w-full h-24 resize-none text-sm" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowClaimModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleClaim} disabled={claiming || !claimMessage.trim()} className="btn-primary flex-1 text-sm">
                {claiming ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
