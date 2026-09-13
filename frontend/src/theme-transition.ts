export type CardbotTheme = 'light' | 'dark';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function toggleCardbotTheme(origin?: HTMLElement, afterChange?: (theme: CardbotTheme) => void) {
  const html = document.documentElement;
  const next: CardbotTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  const rect = origin?.getBoundingClientRect();
  html.style.setProperty('--theme-origin-x', `${rect ? rect.left + rect.width / 2 : innerWidth - 90}px`);
  html.style.setProperty('--theme-origin-y', `${rect ? rect.top + rect.height / 2 : 40}px`);

  const apply = () => {
    html.dataset.theme = next;
    localStorage.setItem('cardbot_theme', next);
    afterChange?.(next);
  };

  if (reducedMotion.matches) {
    apply();
    return;
  }

  html.classList.add('theme-transitioning');
  const transition = (document as ViewTransitionDocument).startViewTransition?.(apply);
  if (transition) {
    void transition.finished.finally(() => html.classList.remove('theme-transitioning'));
    return;
  }

  html.classList.add('theme-transition-fallback');
  apply();
  window.setTimeout(() => {
    html.classList.remove('theme-transitioning', 'theme-transition-fallback');
  }, 620);
}
