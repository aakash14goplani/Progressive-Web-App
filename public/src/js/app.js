if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => {
    console.log('service worker registered');
  });
}

var deferredPrompt;

this.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt', e);
  e.preventDefault();
  deferredPrompt = e;
  return false;
});
