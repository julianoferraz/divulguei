import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { citySlug } = useParams();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && citySlug) {
      navigate(`/${citySlug}?search=${encodeURIComponent(searchQuery)}`);
    }
    setSearchOpen(false);
  };

  const navLinks = citySlug ? [
    { to: `/${citySlug}`, label: 'Início' },
    { to: `/${citySlug}/empresas`, label: 'Empresas' },
    { to: `/${citySlug}/classificados`, label: 'Classificados' },
    { to: `/${citySlug}/profissionais`, label: 'Profissionais' },
    { to: `/${citySlug}/empregos`, label: 'Empregos' },
    { to: `/${citySlug}/eventos`, label: 'Eventos' },
    { to: `/${citySlug}/noticias`, label: 'Notícias' },
    { to: `/${citySlug}/utilidade-publica`, label: 'Utilidade Pública' },
  ] : [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={citySlug ? `/${citySlug}` : '/'} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">Divulguei</span>
            <span className="text-xs text-gray-500">.online</span>
          </Link>

          {/* Desktop nav - hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-500 hover:text-primary-600 lg:hidden">
              <Search size={20} />
            </button>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:text-primary-600">
                  <User size={18} />
                  <span className="hidden sm:inline">{user.name || 'Perfil'}</span>
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to={`/${citySlug}/perfil`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <User size={16} /> Meu Perfil
                  </Link>
                  {isAdmin && (
                    <Link to={`/${citySlug}/admin`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings size={16} /> Painel Admin
                    </Link>
                  )}
                  <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50">
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link to={`/${citySlug || 'floresta'}/login`} className="btn-primary text-sm py-1.5 px-3">
                Entrar
              </Link>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-500 lg:hidden">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar - mobile */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="py-2 lg:hidden">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="O que você está procurando?"
              className="input" autoFocus />
          </form>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="py-2 border-t border-gray-100 lg:hidden">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
