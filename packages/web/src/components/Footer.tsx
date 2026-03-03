import { MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function Footer() {
  const { citySlug } = useParams();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Divulguei.Online</h3>
            <p className="text-sm text-gray-400">
              O guia comercial e classificados da sua cidade.
              Encontre empresas, serviços, profissionais e muito mais.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Links</h4>
            <ul className="space-y-1 text-sm">
              {citySlug && (
                <>
                  <li><a href={`/${citySlug}/empresas`} className="hover:text-white transition-colors">Empresas</a></li>
                  <li><a href={`/${citySlug}/classificados`} className="hover:text-white transition-colors">Classificados</a></li>
                  <li><a href={`/${citySlug}/profissionais`} className="hover:text-white transition-colors">Profissionais</a></li>
                  <li><a href={`/${citySlug}/empregos`} className="hover:text-white transition-colors">Empregos</a></li>
                  <li><a href={`/${citySlug}/eventos`} className="hover:text-white transition-colors">Eventos</a></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Fale conosco</h4>
            <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5587999999999'}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm">
              <MessageCircle size={16} /> WhatsApp do Bot
            </a>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Divulguei.Online. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
