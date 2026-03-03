import { MessageCircle } from 'lucide-react';

export default function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5587999999999'}?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20Divulguei.Online`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:scale-105 transition-all"
      aria-label="Chat no WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
