import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReports, updateReportStatus } from '../services/reports';
import { getApiErrorMessage } from '../services/api';
import {
  DAMAGE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  STATUS_NAMES,
  formatDate,
} from '../services/labels';
import { PaginationMeta, Report } from '../types';

/**
 * Panel administrativo: lista los reportes y permite cambiar su estado
 * (PATCH /api/reports/:id/status, requiere rol "admin").
 */
const Admin: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getReports({ page, limit: 50 })
      .then((response) => {
        setReports(response.data ?? []);
        setPagination(response.pagination);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'No se pudieron cargar los reportes')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          Acceso restringido: solo los administradores pueden gestionar reportes.
        </div>
        <Link to="/map" className="btn btn-secondary">Volver al mapa</Link>
      </div>
    );
  }

  const handleStatusChange = async (reportId: number) => {
    const status = statusDraft[reportId];
    if (!status) return;
    setSubmittingId(reportId);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateReportStatus(reportId, status, commentDraft[reportId]?.trim() || undefined);
      setMessage(`Reporte ${updated.reference_code}: estado actualizado a "${updated.status.label}".`);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el estado'));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Panel Administrativo</h2>
        <Link to="/map" className="btn btn-secondary">← Ver mapa</Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Cargando reportes…</p>}
      {!loading && reports.length === 0 && <p className="muted">No hay reportes registrados.</p>}

      {!loading && reports.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Estado</th>
                <th>Reportado por</th>
                <th>Fecha</th>
                <th>Cambiar estado</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="mono">{report.reference_code}</td>
                  <td>{report.title}</td>
                  <td>{DAMAGE_TYPE_LABELS[report.damage_type]}</td>
                  <td style={{ color: SEVERITY_COLORS[report.severity_level], fontWeight: 600 }}>
                    {SEVERITY_LABELS[report.severity_level]}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: report.status.color }}>
                      {report.status.label}
                    </span>
                  </td>
                  <td>{report.user.full_name}</td>
                  <td>{formatDate(report.created_at)}</td>
                  <td>
                    <div className="admin-actions">
                      <select
                        value={statusDraft[report.id] ?? report.status.name}
                        onChange={(e) => setStatusDraft({ ...statusDraft, [report.id]: e.target.value })}
                      >
                        {STATUS_NAMES.map((name) => (
                          <option key={name} value={name}>{name.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={commentDraft[report.id] ?? ''}
                        onChange={(e) => setCommentDraft({ ...commentDraft, [report.id]: e.target.value })}
                        placeholder="Comentario (opcional)"
                        maxLength={500}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={submittingId === report.id || !statusDraft[report.id]}
                        onClick={() => handleStatusChange(report.id)}
                      >
                        {submittingId === report.id ? 'Guardando…' : 'Actualizar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

export default Admin;