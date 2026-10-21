import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon, { IconName } from '../components/ui/Icon';
import { getMyReports, getReports } from '../services/reports';
import {
  DAMAGE_TYPES,
  DAMAGE_TYPE_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_LEVELS,
  formatDate,
} from '../services/labels';
import { Report } from '../types';

/** Encuadre OpenStreetMap del casco urbano de Apartadó. */
const APARTADO_MAP =
  'https://www.openstreetmap.org/export/embed.html?bbox=-76.6552%2C7.8589%2C-76.5952%2C7.9089&layer=mapnik';

const TRACKER_STEPS: { label: string; text: string; icon: IconName }[] = [
  { label: 'Recibido', text: 'El reporte se registra con un código único de seguimiento.', icon: 'inbox' },
  { label: 'En revisión', text: 'El municipio valida la información y prioriza el caso.', icon: 'search' },
  { label: 'En proceso', text: 'Se programa y ejecuta la intervención en la vía.', icon: 'wrench' },
  { label: 'Resuelto', text: 'El daño queda reparado y el caso se cierra.', icon: 'check' },
];

const FAQS = [
  {
    question: '¿Necesito una cuenta para reportar un daño?',
    answer:
      'Sí. Para crear un reporte y consultar su estado debe registrarse con su nombre y correo electrónico. ' +
      'Así cada reporte queda asociado a un responsable y usted puede hacerle seguimiento.',
  },
  {
    question: '¿Qué tipos de daños puedo reportar?',
    answer:
      'Huecos o baches, grietas, inundaciones, andenes deteriorados, problemas de señalización, ' +
      'fallas en el alumbrado público, drenajes o alcantarillas y cualquier otro daño en la infraestructura vial.',
  },
  {
    question: '¿Cómo indico la ubicación exacta del daño?',
    answer:
      'Al crear el reporte, la plataforma solicita permiso para usar el GPS de su dispositivo y toma las ' +
      'coordenadas automáticamente. También puede ingresarlas manualmente y añadir una dirección o punto de referencia.',
  },
  {
    question: '¿Qué pasa después de enviar mi reporte?',
    answer:
      'El reporte queda en estado "Recibido" con un código de referencia único. Luego el equipo administrador ' +
      'lo revisa, lo prioriza según su severidad y actualiza su estado hasta que el daño quede resuelto.',
  },
  {
    question: '¿Cómo consulto el estado de mi reporte?',
    answer:
      'Ingrese con su cuenta y abra el mapa de reportes. Allí puede ver cada reporte con su estado actual, ' +
      'severidad y fecha. Guarde el código de referencia que recibe al crear el reporte.',
  },
  {
    question: '¿Puedo adjuntar una foto del daño?',
    answer:
      'Sí. En el formulario puede incluir el enlace (URL) de una fotografía del daño. Las imágenes ayudan ' +
      'a evaluar mejor la gravedad y a priorizar la reparación.',
  },
];

/**
 * Página de inicio: acceso rápido para reportar, mapa de Apartadó y
 * actividad reciente (cuando hay sesión).
 */
const Home: React.FC = () => {
  const { user } = useAuth();
  const [recent, setRecent] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState<number | null>(null);
  const [myReports, setMyReports] = useState<number | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingRecent(true);
    Promise.all([getReports({ page: 1, limit: 5 }), getMyReports({ page: 1, limit: 1 })])
      .then(([all, mine]) => {
        setRecent(all.data ?? []);
        setTotalReports(all.pagination.total);
        setMyReports(mine.pagination.total);
      })
      .catch(() => setRecent([]))
      .finally(() => setLoadingRecent(false));
  }, [user]);

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Plataforma ciudadana de infraestructura vial</span>
            <h1>Reporte de daños viales en Apartadó</h1>
            <p className="hero-lead">
              Informe huecos, grietas, inundaciones y otras fallas en las vías del municipio.
              Cada reporte se georreferencia y recibe seguimiento hasta su solución.
            </p>

            <h2 className="quick-title">Seleccione el tipo de daño</h2>
            <div className="quick-report">
              {DAMAGE_TYPES.map((type) => (
                <Link key={type} to={`/report?tipo=${type}`} className="quick-tile">
                  <Icon name={type} size={22} className="quick-icon" />
                  <span>{DAMAGE_TYPE_LABELS[type]}</span>
                </Link>
              ))}
            </div>

            <div className="hero-links">
              <Link to="/report" className="btn btn-primary btn-large">
                Crear reporte <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/map" className="btn btn-outline btn-large">Consultar mapa</Link>
            </div>
          </div>

          <aside className="map-card">
            <div className="map-card-header">
              <span className="map-card-title">
                <Icon name="pin" size={18} /> Apartadó, Antioquia
              </span>
              <Link to="/map" className="map-card-link">Ver mapa completo</Link>
            </div>
            <iframe title="Mapa de Apartadó" src={APARTADO_MAP} loading="lazy" />
            <div className="map-legend">
              <span className="legend-title">Severidad</span>
              {SEVERITY_LEVELS.map((level) => (
                <span key={level} className="legend-item">
                  <span className="legend-dot" style={{ background: SEVERITY_COLORS[level] }} />
                  {SEVERITY_LABELS[level]}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {user ? (
        <section className="page-container home-section">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Reportes registrados</span>
              <span className="stat-value">{totalReports ?? '—'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Mis reportes</span>
              <span className="stat-value">{myReports ?? '—'}</span>
            </div>
            <Link to="/report" className="stat-card stat-card-action">
              <span className="stat-label">Nuevo reporte</span>
              <span className="stat-cta">
                <Icon name="plus" size={20} /> Reportar un daño
              </span>
            </Link>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Actividad reciente</h2>
              <Link to="/map" className="panel-link">
                Ver todos <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            {loadingRecent && <p className="muted panel-empty">Cargando reportes…</p>}
            {!loadingRecent && recent.length === 0 && (
              <p className="muted panel-empty">Aún no hay reportes registrados.</p>
            )}
            <ul className="activity-list">
              {recent.map((report) => (
                <li key={report.id} className="activity-item">
                  <span className="activity-icon">
                    <Icon name={report.damage_type} size={20} />
                  </span>
                  <div className="activity-body">
                    <strong>{report.title}</strong>
                    <span className="muted">
                      {report.reference_code} · {report.location_address ?? DAMAGE_TYPE_LABELS[report.damage_type]} ·{' '}
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  <span className="severity-tag">
                    <span className="legend-dot" style={{ background: SEVERITY_COLORS[report.severity_level] }} />
                    {SEVERITY_LABELS[report.severity_level]}
                  </span>
                  <span className="badge" style={{ backgroundColor: report.status.color }}>
                    {report.status.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="page-container home-section">
          <div className="section-intro">
            <span className="eyebrow">Proceso</span>
            <h2>Seguimiento de cada reporte</h2>
            <p className="muted">Consulte en cualquier momento el estado de su reporte con el código asignado.</p>
          </div>
          <ol className="tracker">
            {TRACKER_STEPS.map((step, index) => (
              <li key={step.label} className="tracker-step">
                <div className="tracker-head">
                  <span className="tracker-icon">
                    <Icon name={step.icon} size={20} />
                  </span>
                  <span className="tracker-index">0{index + 1}</span>
                </div>
                <strong>{step.label}</strong>
                <span className="muted">{step.text}</span>
              </li>
            ))}
          </ol>
          <div className="signup-band">
            <span>Para reportar y consultar el estado de sus casos, ingrese con su cuenta.</span>
            <div className="signup-actions">
              <Link to="/login" className="btn btn-outline">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary">Crear cuenta</Link>
            </div>
          </div>
        </section>
      )}

      <section id="preguntas" className="page-container home-section faq-section">
        <div className="faq-intro">
          <span className="eyebrow">Ayuda</span>
          <h2>Preguntas frecuentes</h2>
          <p className="muted">
            Resolvemos las dudas más comunes sobre el uso de la plataforma.
          </p>
          <p className="faq-emergency">
            <strong>¿Emergencia en la vía?</strong> Si hay riesgo inmediato para personas,
            comuníquese primero con la línea de emergencias <strong>123</strong>.
          </p>
        </div>
        <div className="faq-list">
          {FAQS.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>
                {faq.question}
                <Icon name="plus" size={18} className="faq-toggle" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
