import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, MessageCircle, Share2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { formatPrice, formatPhone, whatsappLink, typeLabel, typeBadgeColor, timeAgo } from '../utils/format';
import { LoadingSpinner, ErrorMessage } from '../components/UI';

export default function ClassifiedDetail() {
  const { citySlug, id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!citySlug || !id) return;
    api.getClassifiedById(citySlug, id)
      .then(res => setItem(res.data))
      .catch(() => setError('Classificado não encontrado.'))
      .finally(() => setLoading(false));
  }, [citySlug, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!item) return null;

  const images: string[] = item.images || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to={`/${citySlug}/classificados`} className="text-sm text-primary-600 flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="card overflow-hidden">
        {/* Image gallery */}
        {images.length > 0 ? (
          <div className="relative">
            <img src={images[currentImage]} alt={item.title} className="w-full h-64 md:h-80 object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full">
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
            <span className={`absolute top-3 left-3 ${typeBadgeColor(item.type)} text-xs px-3 py-1 rounded-full font-medium`}>
              {typeLabel(item.type)}
            </span>
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-5xl">📦</div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
              {item.category_name && <span className="text-xs text-gray-500">{item.category_name}</span>}
            </div>
            <button onClick={() => {
              if (navigator.share) navigator.share({ title: item.title, url: window.location.href });
              else { navigator.clipboard.writeText(window.location.href); alert('Link copiado!'); }
            }} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Share2 size={16} />
            </button>
          </div>

          <p className="text-2xl font-bold text-primary-600 mt-3">{formatPrice(item.price)}</p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
            {item.neighborhood && (
              <span className="flex items-center gap-1"><MapPin size={12} />{item.neighborhood}</span>
            )}
            <span className="flex items-center gap-1"><Calendar size={12} />{timeAgo(item.created_at)}</span>
            {item.expires_at && (
              <span>Expira em {new Date(item.expires_at).toLocaleDateString('pt-BR')}</span>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Descrição</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{item.description}</p>
          </div>

          {/* Contact section */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Contato</h3>
            <p className="text-sm text-gray-700 mb-3">{item.contact_name || 'Anunciante'}</p>
            <div className="flex flex-wrap gap-3">
              {item.contact_phone && (
                <a href={whatsappLink(item.contact_phone, `Olá! Vi seu anúncio "${item.title}" no Divulguei.Online`)}
                  target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex items-center gap-2 text-sm">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
              {item.contact_phone && (
                <a href={`tel:${item.contact_phone}`} className="btn-secondary flex items-center gap-2 text-sm">
                  <Phone size={16} /> {formatPhone(item.contact_phone)}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
