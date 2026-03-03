import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Newspaper, ExternalLink, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { timeAgo } from '../utils/format';
import { LoadingSpinner, EmptyState } from '../components/UI';

export default function News() {
  const { citySlug } = useParams();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citySlug) return;
    api.getNews(citySlug, { limit: '30' })
      .then(r => setArticles(r.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notícias</h1>
        <p className="text-sm text-gray-500">Fique por dentro do que acontece na região</p>
      </div>

      {articles.length === 0 ? (
        <EmptyState title="Sem notícias no momento" message="Volte em breve para as últimas novidades." />
      ) : (
        <div className="space-y-4">
          {articles.map((article: any) => (
            <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
              className="card p-4 flex gap-4 hover:shadow-md transition-shadow group">
              {article.image_url ? (
                <img src={article.image_url} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0" loading="lazy" />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                  <Newspaper className="text-gray-300" size={32} />
                </div>
              )}
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">{article.title}</h3>
                {article.summary && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {article.source_name && <span>{article.source_name}</span>}
                  <span className="flex items-center gap-1"><Calendar size={10} />{timeAgo(article.published_at || article.created_at)}</span>
                  <ExternalLink size={10} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
