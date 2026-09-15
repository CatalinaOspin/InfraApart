import React, { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { createReport } from '../services/reports';
import { getApiErrorMessage } from '../services/api';
import {
  DAMAGE_TYPES,
  DAMAGE_TYPE_LABELS,
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
} from '../services/labels';
import { DamageType, Report, SeverityLevel } from '../types';

/** Centro aproximado de Apartadó como respaldo si la geolocalización falla. */
const APARTADO = { latitude: 7.8839, longitude: -76.6252 };

/**
 * Formulario de reporte de daño vial (POST /api/reports).
 * Captura coordenadas con la Geolocation API del navegador (con entrada manual
 * como alternativa) y envía el reporte con el token JWT del usuario autenticado.
 */
const ReportDamage: React.FC = () => {
  const { user } = useAuth();
  const geo = useGeolocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [damageType, setDamageType] = useState<DamageType>('pothole');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [locationAddress, setLocationAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [coordinatesEdited, setCoordinatesEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  // Autocompletar coordenadas cuando la Geolocation API responde (una sola vez).
  useEffect(() => {
    if (geo.position && !coordinatesEdited) {
      setLatitude(geo.position.latitude.toFixed(6));
      setLongitude(geo.position.longitude.toFixed(6));
    }
  }, [geo.position, coordinatesEdited]);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/report' }} replace />;
  }

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización. Ingresa las coordenadas manualmente.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setCoordinatesEdited(true);
      },
      (geoErr) => {
        setError(`No se pudo obtener tu ubicación: ${geoErr.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDamageType('pothole');
    setSeverity('medium');
    setLocationAddress('');
    setImageUrl('');
    setError(null);
    setCreated(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Ingresa coordenadas válidas (latitud y longitud). Usa "Usar mi ubicación" si estás cerca del daño.');
      return;
    }

    setSubmitting(true);
    try {
      const report = await createReport({
        title: title.trim(),
        description: description.trim() || undefined,
        damage_type: damageType,
        severity_level: severity,
        latitude: lat,
        longitude: lng,
        location_address: locationAddress.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      });
      setCreated(report);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el reporte'));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="page-container auth-page">
        <div className="auth-card">
          <div className="alert alert-success">
            <strong>¡Reporte creado exitosamente!</strong>
            <p className="muted">Guarda tu código de referencia para seguimiento:</p>
            <p className="reference-code">{created.reference_code}</p>
            <p className="muted">
              Estado inicial: <strong>{created.status.label}</strong> · Categoría:{' '}
              {DAMAGE_TYPE_LABELS[created.category.name]} · Severidad:{' '}
              {SEVERITY_LABELS[created.severity_level]}
            </p>
          </div>
          <div className="form-actions">
            <Link to="/map" className="btn btn-primary">Ver en el mapa</Link>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Reportar otro daño
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reportar Daño Vial</h2>
        <Link to="/map" className="btn btn-secondary">← Volver al mapa</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form report-form">
        <div className="form-row">
          <div className="form-group form-group-wide">
            <label htmlFor="report-title">Título *</label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              placeholder="Ej: Hueco grande en la Cra 100 con Av. Primero de Mayo"
            />
          </div>
          <div className="form-group">
            <label htmlFor="report-damage-type">Tipo de daño *</label>
            <select
              id="report-damage-type"
              value={damageType}
              onChange={(e) => setDamageType(e.target.value as DamageType)}
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>{DAMAGE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="report-severity">Severidad *</label>
            <select
              id="report-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
            >
              {SEVERITY_LEVELS.map((level) => (
                <option key={level} value={level}>{SEVERITY_LABELS[level]}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-group-wide">
            <label htmlFor="report-address">Dirección / referencia del lugar</label>
            <input
              id="report-address"
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              maxLength={255}
              placeholder="Ej: Cra 100 # 50-20, barrio Obrero"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="report-description">Descripción</label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Describe el daño: tamaño aproximado, desde cuándo está así, riesgo para transeúntes…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="report-image-url">URL de foto (opcional)</label>
          <input
            id="report-image-url"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            maxLength={255}
            placeholder="https://ejemplo.com/foto.jpg"
          />
        </div>

        <fieldset className="form-fieldset">
          <legend>Ubicación del daño</legend>
          <p className="muted geo-status">
            {geo.loading && 'Obteniendo tu ubicación…'}
            {!geo.loading && geo.error && `Geolocalización automática no disponible (${geo.error}).`}
            {!geo.loading && !geo.error && geo.position && `Ubicación detectada: ${latitude}, ${longitude}`}
            {!geo.loading && !geo.error && !geo.position && 'Presiona "Usar mi ubicación" o ingresa las coordenadas manualmente.'}
          </p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report-lat">Latitud *</label>
              <input
                id="report-lat"
                type="number"
                step="any"
                inputMode="decimal"
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  setCoordinatesEdited(true);
                }}
                required
                placeholder="7.883900"
              />
            </div>
            <div className="form-group">
              <label htmlFor="report-lng">Longitud *</label>
              <input
                id="report-lng"
                type="number"
                step="any"
                inputMode="decimal"
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  setCoordinatesEdited(true);
                }}
                required
                placeholder="-76.625200"
              />
            </div>
            <div className="form-group form-actions-inline">
              <button type="button" className="btn btn-secondary" onClick={useMyLocation}>
                📍 Usar mi ubicación
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setLatitude(String(APARTADO.latitude));
                  setLongitude(String(APARTADO.longitude));
                  setCoordinatesEdited(true);
                }}
              >
                Centro de Apartadó (demo)
              </button>
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Enviando reporte…' : 'Enviar Reporte'}
        </button>
      </form>
    </div>
  );
};

export default ReportDamage;