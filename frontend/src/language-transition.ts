type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function runCardbotLanguageTransition(update: () => void) {
  const html=document.documentElement;
  if(reducedMotion.matches){update();return;}
  html.classList.add('language-transitioning');
  const transition=(document as ViewTransitionDocument).startViewTransition?.(update);
  if(transition){
    void transition.finished.finally(()=>html.classList.remove('language-transitioning'));
    return;
  }
  html.classList.add('language-transition-fallback');
  update();
  window.setTimeout(()=>html.classList.remove('language-transitioning','language-transition-fallback'),480);
}
