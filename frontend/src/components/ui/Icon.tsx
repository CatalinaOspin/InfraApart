import React from 'react';
import { DamageType } from '../../types';

/**
 * Íconos de línea (SVG inline, estilo 24x24 con trazo) para una apariencia
 * consistente en lugar de emojis.
 */
const PATHS = {
  pothole: (
    <>
      <ellipse cx="12" cy="14" rx="8" ry="4" />
      <path d="M7 13.5c1.5 1 3 1.4 5 1.4s3.5-.4 5-1.4" />
      <path d="M3 8h4M17 8h4M10 5h4" />
    </>
  ),
  crack: <path d="M4 4l5 5-2 3 5 4-1 4M14 4l-1 4 3 2-1 3 5 3" />,
  flooding: (
    <>
      <path d="M2 15c2 0 2-1.5 4-1.5S8 15 10 15s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M2 19.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M12 3s-3 3.6-3 5.5a3 3 0 006 0C15 6.6 12 3 12 3z" />
    </>
  ),
  sidewalk: (
    <>
      <path d="M3 20h18M5 16h14" />
      <path d="M8 16l-2 4M16 16l2 4M12 16v4" />
      <circle cx="12" cy="5" r="1.6" />
      <path d="M12 7v4l-2 2.5M12 11l2 2.5M10 9h4" />
    </>
  ),
  signage: (
    <>
      <path d="M12 3l9 15H3z" />
      <path d="M12 9.5v4M12 16v.5" />
      <path d="M12 18v3" />
    </>
  ),
  lighting: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
    </>
  ),
  drainage: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 4v16M12 4v16M16 4v16" />
    </>
  ),
  other: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16v.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  inbox: (
    <>
      <path d="M3 13l3-8h12l3 8v6H3z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  wrench: (
    <path d="M14.5 6.5a4 4 0 015 5L12 19a2.1 2.1 0 01-3-3l7.5-7.5a4 4 0 01-2-2zM14.5 6.5L17 4" />
  ),
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName | DamageType;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);

export default Icon;
