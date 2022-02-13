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

/* setTimeout(() => {
  console.log('within set timeout');
});
console.log('outside set timeout');

const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    // resolve('within promise');
    reject('promise rejected');
  });
});

promise.then((value) => {
  console.log('promise value', value);
}).catch((error) => {
  console.log('promise error', error);
}).finally(() => { }).then(() => {
  console.log('promise finally');
}); */

fetch('http://httpbin.org/bytes/5').then((response) => {
  console.log('API RESPONSE: ', response);
  return response.text();
}).then((data) => {
  console.log('API TEXT DATA: ', data);
}).catch((error) => {
  console.log('API ERROR: ', error);
});
