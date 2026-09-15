import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReports } from '../services/reports';
import { getApiErrorMessage } from '../services/api';
import {
  DAMAGE_TYPES,
  DAMAGE_TYPE_LABELS,
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  formatDate,
} from '../services/labels';
import { DamageType, PaginationMeta, Report, ReportStatusName, SeverityLevel } from '../types';

const APARTADO = { latitude: 7.8839, longitude: -76.6252 };

interface Filters {
  category: DamageType | 'all';
  severity: SeverityLevel | 'all';
  status: ReportStatusName | 'all';
}

/**
 * Mapa de Reportes: consulta la lista de reportes del backend (con filtros) y
 * muestra una visualización básica: tarjetas detalladas + encuadre OpenStreetMap.
 */
const MapView: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>({ category: 'all', severity: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getReports({
      category: filters.category === 'all' ? undefined : filters.category,
      severity: filters.severity === 'all' ? undefined : filters.severity,
      status: filters.status === 'all' ? undefined : filters.status,
      page,
      limit: 20,
    })
      .then((response) => {
        setReports(response.data ?? []);
        setPagination(response.pagination);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'No se pudieron cargar los reportes')))
      .finally(() => setLoading(false));
  }, [user, filters, page]);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/map' }} replace />;
  }

  const selected = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;

  // Encuadre del mapa alrededor del reporte seleccionado (o de Apartadó).
  const center = selected ?? APARTADO;
  const spanLat = selected ? 0.01 : 0.03;
  const spanLng = selected ? 0.01 : 0.04;
  const bbox = [
    center.longitude - spanLng,
    center.latitude - spanLat,
    center.longitude + spanLng,
    center.latitude + spanLat,
  ]
    .map((coord) => coord.toFixed(6))
    .join('%2C');
  const marker = `${center.latitude.toFixed(6)}%2C${center.longitude.toFixed(6)}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Mapa de Reportes</h2>
        <Link to="/report" className="btn btn-primary">+ Reportar daño</Link>
      </div>

      <div className="filters">
        <div className="form-group">
          <label htmlFor="filter-category">Categoría</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, category: e.target.value as Filters['category'] });
            }}
          >
            <option value="all">Todas</option>
            {DAMAGE_TYPES.map((type) => (
              <option key={type} value={type}>{DAMAGE_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="filter-severity">Severidad</label>
          <select
            id="filter-severity"
            value={filters.severity}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, severity: e.target.value as Filters['severity'] });
            }}
          >
            <option value="all">Todas</option>
            {SEVERITY_LEVELS.map((level) => (
              <option key={level} value={level}>{SEVERITY_LABELS[level]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="filter-status">Estado</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, status: e.target.value as Filters['status'] });
            }}
          >
            <option value="all">Todos</option>
            <option value="pending">Recibido</option>
            <option value="in_review">En revisión</option>
            <option value="in_progress">En proceso</option>
            <option value="resolved">Resuelto</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      {loading && <p className="muted">Cargando reportes…</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && reports.length === 0 && (
        <p className="muted">No hay reportes que coincidan con los filtros.</p>
      )}

      <div className="map-layout">
        <div className="report-list">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedId(report.id)}
              className={`card report-card ${report.id === selected?.id ? 'card-selected' : ''}`}
            >
              <div className="card-header">
                <strong>{report.title}</strong>
                <span className="badge" style={{ backgroundColor: report.status.color }}>
                  {report.status.label}
                </span>
              </div>
              <p className="muted card-address">{report.location_address ?? 'Sin dirección registrada'}</p>
              <div className="card-meta">
                <span className="badge badge-outline">{DAMAGE_TYPE_LABELS[report.damage_type]}</span>
                <span className="badge badge-outline" style={{ color: SEVERITY_COLORS[report.severity_level] }}>
                  {SEVERITY_LABELS[report.severity_level]}
                </span>
                <span className="mono">{report.reference_code}</span>
              </div>
              <div className="card-footer">
                <span>{report.user.full_name}</span>
                <span>{formatDate(report.created_at)}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="map-embed">
          <iframe title="Mapa de reportes viales" src={embedUrl} loading="lazy" />
          {selected && (
            <p className="muted map-coords">
              {selected.reference_code}: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Anterior
          </button>
          <span className="muted">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;