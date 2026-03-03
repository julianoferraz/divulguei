import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/UI';

const TYPES = [
  { value: 'sale', label: 'Venda' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'exchange', label: 'Troca' },
  { value: 'donation', label: 'Doação' },
  { value: 'wanted', label: 'Procura-se' },
];

export default function ClassifiedCreate() {
  const { citySlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [improvingDesc, setImprovingDesc] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'sale',
    category_id: '',
    price: '',
    neighborhood: '',
    contact_phone: user?.phone || '',
    contact_name: user?.name || '',
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    api.getCategories({ type: 'classified' }).then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length >= 5) break;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.uploadFile(formData);
        if (res.data?.url) setImages(prev => [...prev, res.data.url]);
      } catch {
        alert('Erro ao enviar imagem');
      }
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const improveDescription = async () => {
    if (!form.description.trim()) return;
    setImprovingDesc(true);
    try {
      const res = await api.improveClassifiedDescription(citySlug!, form.description);
      if (res.data?.description) updateField('description', res.data.description);
    } catch {
      // ignore preview failures
    } finally {
      setImprovingDesc(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type) {
      alert('Preencha título e tipo.');
      return;
    }
    setLoading(true);
    try {
      await api.createClassified(citySlug!, {
        ...form,
        price: form.price ? Number(form.price) : undefined,
        images,
      });
      alert('Classificado criado com sucesso!');
      navigate(`/${citySlug}/classificados`);
    } catch {
      alert('Erro ao criar classificado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft size={14} /> Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Anúncio</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)}
            placeholder="Ex: iPhone 13 128GB seminovo" className="input text-sm" required />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => updateField('type', t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select value={form.category_id} onChange={e => updateField('category_id', e.target.value)} className="input text-sm">
            <option value="">Selecione...</option>
            {categories.map((cat: any) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children?.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Price */}
        {form.type !== 'donation' && form.type !== 'wanted' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input type="number" step="0.01" min="0" value={form.price}
              onChange={e => updateField('price', e.target.value)}
              placeholder="0,00" className="input text-sm" />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
            placeholder="Descreva seu item com detalhes..."
            className="input text-sm h-28 resize-none" />
          <button type="button" onClick={improveDescription} disabled={improvingDesc || !form.description.trim()}
            className="text-xs text-primary-600 flex items-center gap-1 mt-1 hover:underline disabled:opacity-50">
            <Sparkles size={12} /> {improvingDesc ? 'Melhorando...' : 'Melhorar com IA'}
          </button>
        </div>

        {/* Neighborhood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
          <input type="text" value={form.neighborhood} onChange={e => updateField('neighborhood', e.target.value)}
            placeholder="Ex: Centro" className="input text-sm" />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos (máx. 5)</label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-300">
                <Upload size={20} className="text-gray-400" />
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
            <input type="text" value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)}
              className="input text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu telefone</label>
            <input type="tel" value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)}
              placeholder="(00) 00000-0000" className="input text-sm" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-3">
          {loading ? 'Publicando...' : 'Publicar Anúncio'}
        </button>
      </form>
    </div>
  );
}
