var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => {
    console.log('service worker registered');
  });
}

this.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  return false;
});

// display enable notifications button if browser supports it
if ('Notification' in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission)
  }
}

function askForNotificationPermission() {
  Notification.requestPermission().then((result) => {
    if (result === 'granted') {
      console.log('Notifications granted');
      configurePushSubscription();
    } else {
      console.log('Notifications denied');
    }
  });
}

/**
 * Configure the push subscription
 */
function configurePushSubscription() {
  if ('serviceWorker' in navigator) {
    let reg;
    navigator.serviceWorker.ready
      .then((swreg) => {
        // when service worker is ready, get the registration
        reg = swreg;
        return swreg.pushManager.getSubscription();
      })
      .then((sub) => {
        if (sub === null) {
          // create a new subscription
          const PUBLIC_KEY = 'BFI3uXPXx6Kxd3eohKSo7wTuw3RxA4GePuE6Nc6wIrbxE5JN_VHUrbEzPnJaY_xE2wIPliwL3ZvR0YMDo2S-fq8';
          const PRIVATE_KEY = 'Up4wuLBryJQI092j9R8_5FFl8MAsSDTulVWdKKEGkr0';
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
          });
        }
      })
      .then((newSub) => {
        // send the subscription to the server
        return sendSubscriptionToServer(newSub);
      })
      .then((res) => {
        // display a confirmation notification
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch((err) => {
        console.log('Error during subscription', err);
      });
  }
}

function sendSubscriptionToServer(newSub) {
  return fetch('https://employees-a405a-default-rtdb.firebaseio.com/subscriptions.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(newSub)
  });
}

function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200, 400, 500],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
        { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
      ]
    };
    navigator.serviceWorker.ready.then((swreg) => {
      swreg.showNotification('Successfully subscribed from SW!', options);
    });
  }
  new Notification('You subscribed to notifications from Notf. API', {
    body: 'Thank you for subscribing to notifications'
  });
}
