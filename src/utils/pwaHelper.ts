/**
 * JESic Meet - PWA Utility Helpers
 * Rileva se l'applicazione è in esecuzione come Web App installata (PWA/Standalone)
 * su Android, iOS o Desktop, oppure se è aperta nel normale browser web.
 */

export const isInstalledPwa = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Standard CSS Media Query per modalità display standalone/fullscreen/minimal-ui
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    ) {
      return true;
    }

    // 2. Proprietà nativa standalone per Safari su iPhone e iPad
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // 3. Referrer da WebAPK o Trusted Web Activity su Android
    if (document.referrer && document.referrer.includes('android-app://')) {
      return true;
    }

    // 4. Parametro query start_url configurato nel manifest.json (es. /?source=pwa)
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('source') === 'pwa' ||
      urlParams.get('mode') === 'standalone' ||
      urlParams.get('pwa') === 'true'
    ) {
      return true;
    }
  } catch (err) {
    console.debug('Error detecting PWA standalone mode:', err);
  }

  return false;
};
