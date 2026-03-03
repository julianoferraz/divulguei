import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { whatsappLink } from '../utils/format';
import { LoadingSpinner, ErrorMessage } from '../components/UI';

export default function EventDetail() {
  const { citySlug, id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!citySlug || !id) return;
    api.getEventById(citySlug, id)
      .then(r => setEvent(r.data))
      .catch(() => setError('Evento não encontrado.'))
      .finally(() => setLoading(false));
  }, [citySlug, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return null;

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to={`/${citySlug}/eventos`} className="text-sm text-primary-600 flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="card overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-56 md:h-72 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-7xl">🎉</div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <button onClick={() => {
              if (navigator.share) navigator.share({ title: event.title, url: window.location.href });
              else { navigator.clipboard.writeText(window.location.href); alert('Link copiado!'); }
            }} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0">
              <Share2 size={16} />
            </button>
          </div>

          {event.category_name && <span className="badge-blue text-xs mt-2 inline-block">{event.category_name}</span>}

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={10} /> {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {endDate && ` — ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            {event.venue_name && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.venue_name}</p>
                  {event.venue_address && <p className="text-xs text-gray-500">{event.venue_address}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-4">
            {event.is_free ? (
              <span className="badge-green">🎟 Gratuito</span>
            ) : event.price_info && (
              <span className="text-lg font-bold text-primary-600">🎟 {event.price_info}</span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Sobre o evento</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
            {event.organizer_contact && (
              <a href={whatsappLink(event.organizer_contact, `Olá! Quero saber mais sobre o evento "${event.title}" no Divulguei.Online`)}
                target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex items-center gap-2 text-sm">
                <MessageCircle size={16} /> Contato
              </a>
            )}
            {event.external_url && (
              <a href={event.external_url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 text-sm">
                <ExternalLink size={16} /> Site do evento
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
