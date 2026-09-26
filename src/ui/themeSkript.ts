// Inline-Skript vor dem ersten Paint: Theme ohne Aufblitzen setzen (FR-28), Altschlüssel löschen (FR-14).
export const THEME_SCHLUESSEL = 'iot-haus.theme';
export const ALT_SCHLUESSEL = 'smart-home-state';

export type ThemeWahl = 'system' | 'hell' | 'dunkel';
export type Theme = 'hell' | 'dunkel';

export const THEME_FARBE: Record<Theme, string> = { hell: '#FFFFFF', dunkel: '#131C2E' };

export const THEME_SKRIPT = `(function(){var w='system';try{w=localStorage.getItem('${THEME_SCHLUESSEL}')||'system';localStorage.removeItem('${ALT_SCHLUESSEL}');}catch(e){}var d=w==='dunkel'||(w!=='hell'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var t=d?'dunkel':'hell';document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${THEME_FARBE.dunkel}':'${THEME_FARBE.hell}');})();`;
