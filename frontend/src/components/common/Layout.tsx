import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';

/**
 * Layout común: barra de navegación (con menú móvil) + contenido + pie de página.
 */
const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cierra el menú móvil al cambiar de página y desplaza hacia el ancla (#preguntas)
  // o al inicio de la página.
  useEffect(() => {
    setMenuOpen(false);
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-logo">
              <Icon name="pin" size={18} />
            </span>
            <span className="brand-text">
              InfraApart
              <small>Apartadó · Antioquia</small>
            </span>
          </Link>

          <button
            type="button"
            className="navbar-toggle"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
            <NavLink to="/map" className={navClass}>Mapa</NavLink>
            <NavLink to="/report" className={navClass}>Reportar</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin" className={navClass}>Panel Admin</NavLink>}
            <div className="navbar-actions">
              {user ? (
                <>
                  <span className="user-chip">
                    <span className="user-avatar" aria-hidden="true">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                    {user.full_name.split(' ')[0]}
                  </span>
                  <button type="button" className="btn btn-ghost" onClick={logout}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
                  <Link to="/register" className="btn btn-primary">Registrarse</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="navbar-brand">
              <span className="brand-logo">
                <Icon name="pin" size={18} />
              </span>
              <span className="brand-text">
                InfraApart
                <small>Apartadó · Antioquia</small>
              </span>
            </Link>
            <p>
              Plataforma ciudadana para reportar y dar seguimiento a los daños en la
              infraestructura vial del municipio de Apartadó.
            </p>
          </div>

          <nav className="footer-col" aria-label="Plataforma">
            <h3>Plataforma</h3>
            <Link to="/report">Reportar un daño</Link>
            <Link to="/map">Mapa de reportes</Link>
            {!user && <Link to="/register">Crear cuenta</Link>}
            {!user && <Link to="/login">Iniciar sesión</Link>}
          </nav>

          <nav className="footer-col" aria-label="Ayuda">
            <h3>Ayuda</h3>
            <Link to="/#preguntas">Preguntas frecuentes</Link>
            <Link to="/report">Cómo crear un reporte</Link>
            <Link to="/map">Consultar el estado</Link>
          </nav>

          <div className="footer-col">
            <h3>Emergencias</h3>
            <p>
              Si el daño representa un riesgo inmediato, comuníquese con la línea
              nacional de emergencias.
            </p>
            <span className="footer-emergency">Línea 123</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span>© {new Date().getFullYear()} InfraApart. Todos los derechos reservados.</span>
            <span>Apartadó, Antioquia · Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
