import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { citySlug } = useParams();
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [newAlert, setNewAlert] = useState('');

  useEffect(() => {
    api.getMyAlerts().then(r => setAlerts(r.data || [])).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({ name });
      if (res.data) {
        const token = localStorage.getItem('divulguei_token') || '';
        login(token, res.data);
        alert('Perfil atualizado!');
      }
    } catch {
      alert('Erro ao atualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.trim() || !citySlug) return;
    try {
      await api.createAlert(citySlug, { alert_type: 'classified', keywords: newAlert.trim() });
      setNewAlert('');
      const r = await api.getMyAlerts();
      setAlerts(r.data || []);
    } catch {
      alert('Erro ao criar alerta.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await api.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Erro ao remover.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/${citySlug || ''}`);
  };

  if (!user) {
    return <Navigate to={`/${citySlug}/login`} replace />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link to={`/${citySlug}`} className="text-sm text-primary-600 flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      {/* Profile info */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.name || 'Sem nome'}</p>
            <p className="text-sm text-gray-500">{user.phone}</p>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{user.role}</span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input text-sm" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      {/* Alerts */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Bell size={18} /> Meus Alertas
        </h2>
        <p className="text-xs text-gray-500 mb-3">Receba notificações quando algo novo aparecer com essas palavras.</p>

        <div className="flex gap-2 mb-4">
          <input type="text" value={newAlert} onChange={e => setNewAlert(e.target.value)}
            placeholder="Ex: casa aluguel, emprego..." className="input text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAlert(); }}} />
          <button onClick={handleCreateAlert} className="btn-primary text-sm">Adicionar</button>
        </div>

        {alerts.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum alerta configurado.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{alert.keywords || alert.alert_type}</span>
                <button onClick={() => handleDeleteAlert(alert.id)} className="text-xs text-red-500 hover:underline">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl py-3 text-sm font-medium transition-colors">
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
