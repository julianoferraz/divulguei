import { useState, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { citySlug } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) { setError('Informe um telefone válido.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.requestWhatsAppCode(cleanPhone);
      setStep('code');
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('O código deve ter 6 dígitos.'); return; }

    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await api.verifyWhatsAppCode(cleanPhone, code);
      if (res.data?.token) {
        login(res.data.token, res.data.user);
        navigate(`/${citySlug || 'floresta'}`, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <Link to={`/${citySlug || ''}`} className="text-sm text-primary-600 flex items-center gap-1 mb-6 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle size={28} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
        <p className="text-sm text-gray-500 mt-1">Use seu WhatsApp para acessar</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="(81) 99999-0000" className="input text-sm" autoFocus required />
          </div>
          <button type="submit" disabled={loading} className="btn-whatsapp w-full flex items-center justify-center gap-2 py-3">
            <MessageCircle size={18} />
            {loading ? 'Enviando...' : 'Receber código por WhatsApp'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Enviaremos um código de 6 dígitos para o seu WhatsApp.
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Enviamos um código de 6 dígitos para <strong>{phone}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de verificação</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" className="input text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus maxLength={6} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            className="text-sm text-primary-600 mx-auto block hover:underline">
            Alterar número
          </button>
        </form>
      )}
    </div>
  );
}
