import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============ Context ============
const AuthContext = React.createContext(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============ API Helpers ============
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============ Components ============

// Public Header
const PublicHeader = ({ menuItems }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="public-header" data-testid="public-header">
      <div className="header-container">
        <Link to="/" className="logo" data-testid="logo-link">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Paris Greeters</span>
        </Link>
        
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
        
        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`} data-testid="main-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.id} 
              to={item.href} 
              className="nav-link"
              data-testid={`nav-link-${item.id}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/admin" className="nav-link admin-link" data-testid="admin-link">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};

// Public Footer
const PublicFooter = () => (
  <footer className="public-footer" data-testid="public-footer">
    <div className="footer-container">
      <div className="footer-brand">
        <span className="footer-logo">🌿</span>
        <span className="footer-name">Paris Greeters</span>
        <p className="footer-tagline">Balades gratuites avec un local</p>
      </div>
      <div className="footer-links">
        <Link to="/contact">Contact</Link>
        <Link to="/mentions-legales">Mentions légales</Link>
        <Link to="/presse">Presse</Link>
      </div>
      <p className="footer-copyright">© 2024 Paris Greeters. Tous droits réservés.</p>
    </div>
  </footer>
);

// Section Renderer
const SectionRenderer = ({ section }) => {
  const bgClass = `section-bg-${section.background}`;
  const layoutClass = `section-layout-${section.layout}`;

  return (
    <section 
      className={`page-section ${bgClass} ${layoutClass}`}
      style={section.backgroundImage ? { backgroundImage: `url(${section.backgroundImage})` } : {}}
      data-testid={`section-${section.id}`}
    >
      <div className="section-content">
        {section.blocks?.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
};

// Block Renderer
const BlockRenderer = ({ block }) => {
  switch (block.type) {
    case 'heading':
      const HeadingTag = block.content?.level || 'h2';
      return (
        <HeadingTag className="block-heading" data-testid={`block-${block.id}`}>
          {block.content?.text}
        </HeadingTag>
      );
    
    case 'text':
      return (
        <div className="block-text" data-testid={`block-${block.id}`}>
          {block.content?.text?.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      );
    
    case 'image':
      return (
        <figure className="block-image" data-testid={`block-${block.id}`}>
          <img src={block.content?.src} alt={block.content?.alt || ''} loading="lazy" />
          {block.content?.caption && <figcaption>{block.content.caption}</figcaption>}
        </figure>
      );
    
    case 'button':
      return (
        <Link 
          to={block.content?.href || '/'} 
          className={`block-button btn-${block.content?.style || 'primary'}`}
          data-testid={`block-${block.id}`}
        >
          {block.content?.text}
        </Link>
      );
    
    default:
      return null;
  }
};

// Public Page
const PublicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const pageSlug = slug || '/';
        const res = await axios.get(`${API_URL}/api/pages/slug/${pageSlug}?locale=fr`);
        setPage(res.data);
        setError(null);
      } catch (err) {
        setError('Page non trouvée');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return <div className="loading-spinner" data-testid="loading">Chargement...</div>;
  if (error) return <div className="error-message" data-testid="error">{error}</div>;
  if (!page) return null;

  return (
    <main className="public-page" data-testid="public-page">
      {page.sections?.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
};

// Home Page
const HomePage = ({ menuItems }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/pages/slug/?locale=fr`)
      .then(res => setPage(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" data-testid="loading">Chargement...</div>;

  if (!page) {
    return (
      <main className="home-page" data-testid="home-page">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Bienvenue chez Paris Greeters</h1>
            <p>Découvrez Paris autrement avec des balades gratuites accompagnées par des locaux passionnés.</p>
            <Link to="/contact" className="btn-primary">Réserver une balade</Link>
          </div>
        </section>
        
        <section className="features-section">
          <h2>Nos balades</h2>
          <div className="features-grid">
            {menuItems.slice(0, 6).map((item) => (
              <Link key={item.id} to={item.href} className="feature-card">
                <h3>{item.label}</h3>
                <span className="arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="public-page home-page" data-testid="home-page">
      {page.sections?.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
};

// Login Page
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" data-testid="login-page">
      <div className="login-container">
        <h1>Connexion Admin</h1>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-alert" data-testid="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="email-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" data-testid="login-submit">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <Link to="/" className="back-link">← Retour au site</Link>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, pagesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() }),
          axios.get(`${API_URL}/api/pages?locale=fr`, { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setPages(pagesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <header className="admin-header">
        <h1>🌿 Greeters CMS</h1>
        <div className="admin-user">
          <span>Bonjour, {user?.name}</span>
          <button onClick={handleLogout} className="btn-secondary" data-testid="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>
      
      <nav className="admin-nav">
        <Link to="/admin" className="nav-item active">Dashboard</Link>
        <Link to="/admin/pages" className="nav-item">Pages</Link>
        <Link to="/admin/ai-pages" className="nav-item">Générer avec IA</Link>
        <Link to="/" className="nav-item">Voir le site</Link>
      </nav>
      
      <main className="admin-main">
        <div className="stats-grid">
          <div className="stat-card" data-testid="stat-pages">
            <h3>Pages</h3>
            <div className="stat-value">{stats?.pages?.total || 0}</div>
            <div className="stat-detail">
              {stats?.pages?.published || 0} publiées • {stats?.pages?.draft || 0} brouillons
            </div>
          </div>
          <div className="stat-card" data-testid="stat-users">
            <h3>Utilisateurs</h3>
            <div className="stat-value">{stats?.users || 0}</div>
          </div>
          <div className="stat-card" data-testid="stat-ai">
            <h3>Sessions IA</h3>
            <div className="stat-value">{stats?.ai_sessions || 0}</div>
          </div>
        </div>
        
        <section className="recent-pages">
          <h2>Pages récentes</h2>
          <div className="pages-list">
            {pages.slice(0, 10).map((page) => (
              <div key={page.id} className="page-item" data-testid={`page-item-${page.id}`}>
                <div className="page-info">
                  <h4>{page.title}</h4>
                  <span className="page-slug">/{page.slug}</span>
                </div>
                <div className="page-meta">
                  <span className={`status-badge status-${page.status}`}>{page.status}</span>
                  <Link to={`/admin/pages/${page.id}`} className="btn-small">Éditer</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

// Pages List
const AdminPagesList = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/pages?locale=fr`, { headers: getAuthHeaders() })
      .then(res => setPages(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (pageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;
    try {
      await axios.delete(`${API_URL}/api/pages/${pageId}`, { headers: getAuthHeaders() });
      setPages(pages.filter(p => p.id !== pageId));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handlePublish = async (pageId) => {
    try {
      const res = await axios.post(`${API_URL}/api/pages/${pageId}/publish`, {}, { headers: getAuthHeaders() });
      setPages(pages.map(p => p.id === pageId ? res.data : p));
    } catch (err) {
      alert('Erreur lors de la publication');
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div className="admin-pages-list" data-testid="admin-pages-list">
      <header className="admin-header">
        <h1>🌿 Greeters CMS - Pages</h1>
        <Link to="/admin" className="btn-secondary">← Dashboard</Link>
      </header>
      
      <main className="admin-main">
        <div className="page-header">
          <h2>Gestion des pages ({pages.length})</h2>
          <Link to="/admin/ai-pages" className="btn-primary">+ Générer avec IA</Link>
        </div>
        
        <div className="pages-table">
          <div className="table-header">
            <span>Titre</span>
            <span>Slug</span>
            <span>Statut</span>
            <span>Actions</span>
          </div>
          {pages.map((page) => (
            <div key={page.id} className="table-row" data-testid={`page-row-${page.id}`}>
              <span className="cell-title">{page.title}</span>
              <span className="cell-slug">/{page.slug}</span>
              <span className={`cell-status status-${page.status}`}>{page.status}</span>
              <div className="cell-actions">
                <Link to={`/${page.slug}`} target="_blank" className="btn-small">Voir</Link>
                <Link to={`/admin/pages/${page.id}`} className="btn-small">Éditer</Link>
                {page.status !== 'published' && (
                  <button onClick={() => handlePublish(page.id)} className="btn-small btn-success">
                    Publier
                  </button>
                )}
                <button onClick={() => handleDelete(page.id)} className="btn-small btn-danger">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// AI Page Generator
const AiPageGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/generate`,
        { prompt, locale: 'fr', sessionId: session?.sessionId },
        { headers: getAuthHeaders() }
      );
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePage = async () => {
    if (!session?.sessionId) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/sessions/${session.sessionId}/create-page`,
        {},
        { headers: getAuthHeaders() }
      );
      alert('Page créée avec succès !');
      navigate(`/admin/pages/${res.data.id}`);
    } catch (err) {
      alert('Erreur lors de la création de la page');
    }
  };

  return (
    <div className="ai-page-generator" data-testid="ai-page-generator">
      <header className="admin-header">
        <h1>🌿 Générateur de pages IA</h1>
        <Link to="/admin" className="btn-secondary">← Dashboard</Link>
      </header>
      
      <main className="admin-main">
        <div className="ai-generator-container">
          <div className="prompt-section">
            <h2>Décrivez votre page</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Crée une page touristique sur une balade insolite dans le Marais avec conseils pratiques, ambiance conviviale et appel à la réservation."
              rows={4}
              data-testid="ai-prompt-input"
            />
            <button 
              onClick={handleGenerate} 
              disabled={generating || !prompt.trim()}
              className="btn-primary"
              data-testid="ai-generate-btn"
            >
              {generating ? '🔄 Génération en cours...' : '✨ Générer la page'}
            </button>
            {error && <div className="error-alert">{error}</div>}
          </div>
          
          {session?.generatedPage && (
            <div className="preview-section">
              <div className="preview-header">
                <h2>Aperçu de la page générée</h2>
                <button onClick={handleCreatePage} className="btn-success" data-testid="create-page-btn">
                  ✓ Créer cette page
                </button>
              </div>
              
              <div className="page-preview">
                <h3>{session.generatedPage.title}</h3>
                <p className="preview-meta">
                  <strong>Slug:</strong> /{session.generatedPage.slug}
                </p>
                <p className="preview-description">{session.generatedPage.metaDescription}</p>
                
                <div className="sections-preview">
                  {session.generatedPage.sections?.map((section, idx) => (
                    <div key={section.id || idx} className="section-preview-item">
                      <h4>{section.name}</h4>
                      <span className="section-layout">{section.layout}</span>
                      <div className="section-blocks">
                        {section.blocks?.map((block, bidx) => (
                          <span key={block.id || bidx} className="block-tag">{block.type}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="messages-section">
                <h3>Conversation</h3>
                {session.messages?.map((msg) => (
                  <div key={msg.id} className={`message message-${msg.role}`}>
                    <strong>{msg.role === 'user' ? 'Vous' : 'IA'}:</strong>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Page Editor
const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/pages/${id}`, { headers: getAuthHeaders() })
      .then(res => setPage(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/pages/${id}`, page, { headers: getAuthHeaders() });
      alert('Page sauvegardée !');
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/pages/${id}/publish`, {}, { headers: getAuthHeaders() });
      setPage(res.data);
      alert('Page publiée !');
    } catch (err) {
      alert('Erreur lors de la publication');
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (!page) return <div className="error-message">Page non trouvée</div>;

  return (
    <div className="page-editor" data-testid="page-editor">
      <header className="admin-header">
        <h1>Édition: {page.title}</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/pages')} className="btn-secondary">← Retour</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {page.status !== 'published' && (
            <button onClick={handlePublish} className="btn-success">Publier</button>
          )}
        </div>
      </header>
      
      <main className="editor-main">
        <div className="editor-form">
          <div className="form-group">
            <label>Titre</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              data-testid="page-title-input"
            />
          </div>
          
          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              data-testid="page-slug-input"
            />
          </div>
          
          <div className="form-group">
            <label>Meta Description</label>
            <textarea
              value={page.metaDescription || ''}
              onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
              rows={3}
              data-testid="page-meta-input"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={page.isInMenu}
                  onChange={(e) => setPage({ ...page, isInMenu: e.target.checked })}
                />
                Afficher dans le menu
              </label>
            </div>
            <div className="form-group">
              <label>Ordre dans le menu</label>
              <input
                type="number"
                value={page.menuOrder}
                onChange={(e) => setPage({ ...page, menuOrder: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Label du menu</label>
            <input
              type="text"
              value={page.menuLabel || ''}
              onChange={(e) => setPage({ ...page, menuLabel: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Statut</label>
            <select
              value={page.status}
              onChange={(e) => setPage({ ...page, status: e.target.value })}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>
        
        <div className="sections-editor">
          <h3>Sections ({page.sections?.length || 0})</h3>
          {page.sections?.map((section, idx) => (
            <div key={section.id || idx} className="section-editor-item">
              <h4>{section.name}</h4>
              <span className="section-layout-badge">{section.layout}</span>
              <p>{section.blocks?.length || 0} blocs</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  
  return children;
};

// Public Layout
const PublicLayout = ({ children, menuItems }) => (
  <>
    <PublicHeader menuItems={menuItems} />
    {children}
    <PublicFooter />
  </>
);

// Main App
function App() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/menu?locale=fr`)
      .then(res => setMenuItems(res.data.items || []))
      .catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app" data-testid="app-root">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/pages" element={
              <ProtectedRoute>
                <AdminPagesList />
              </ProtectedRoute>
            } />
            <Route path="/admin/pages/:id" element={
              <ProtectedRoute>
                <PageEditor />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-pages" element={
              <ProtectedRoute>
                <AiPageGenerator />
              </ProtectedRoute>
            } />
            
            {/* Public Routes */}
            <Route path="/" element={
              <PublicLayout menuItems={menuItems}>
                <HomePage menuItems={menuItems} />
              </PublicLayout>
            } />
            <Route path="/:slug" element={
              <PublicLayout menuItems={menuItems}>
                <PublicPage />
              </PublicLayout>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
