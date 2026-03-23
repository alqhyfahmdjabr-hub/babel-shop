export const BACKGROUND_LOGO_URL = 'https://i.postimg.cc/25Knz1yL/babl3.png';

const createPatternDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

// Keep the startup/default pattern lightweight (single pattern only).
// Full pattern list is loaded lazily inside the Settings modal.
export const DEFAULT_BACKGROUND_PATTERN_URL = createPatternDataUrl(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'>
    <g stroke='#D4AF37' stroke-opacity='.24' stroke-width='1.2'>
      <circle cx='30' cy='30' r='18'/>
      <circle cx='90' cy='30' r='18'/>
      <circle cx='30' cy='90' r='18'/>
      <circle cx='90' cy='90' r='18'/>
      <path d='M30 12v36M12 30h36M90 12v36M72 30h36M30 72v36M12 90h36M90 72v36M72 90h36'/>
    </g>
    <circle cx='60' cy='60' r='4' fill='#FFF5D6' fill-opacity='.28'/>
  </svg>
`);

