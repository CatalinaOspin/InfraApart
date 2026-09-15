import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Página de inicio: landing con navegación principal según sesión.
 */
const Home: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="navbar">
        <div className="navbar-brand">🛣️ InfraApart</div>
        <nav className="navbar-links">
          <Link to="/map">Mapa</Link>
          <Link to="/report">Reportar</Link>
          {user?.role === 'admin' && <Link to="/admin">Panel Admin</Link>}
          {user ? (
            <>
              <span className="muted">Hola, {user.full_name.split(' ')[0]}</span>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary">Registrarse</Link>
            </>
          )}
        </nav>
      </header>

      <main className="page-container home-hero">
        <h1>Reporta y gestiona daños viales en Apartadó</h1>
        <p className="muted">
          Reporta huecos, grietas, inundaciones y más. Los administradores del municipio
          pueden dar seguimiento a cada reporte hasta su resolución.
        </p>
        <div className="home-actions">
          <Link to="/report" className="btn btn-primary btn-large">Reportar un daño</Link>
          <Link to="/map" className="btn btn-secondary btn-large">Ver mapa de reportes</Link>
        </div>
      </main>
    </div>
  );
};

export default Home;