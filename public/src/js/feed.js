const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
const sharedMomentsArea = document.querySelector('#shared-moments');
const URL = 'https://employees-a405a-default-rtdb.firebaseio.com/posts.json';
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let picture;
let fetchedLocation = { lat: 0, lng: 0 };

/**
 * Initialize video player, if available else displays image picker
 * Initial few lines of code is creating polyfill for older browsers
 */
function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function (err) {
      imagePickerArea.style.display = 'flex';
    });
}

// click on capture button to get image captured by video
captureButton.addEventListener('click', function (event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  const context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', function (event) {
  picture = event.target.files[0];
});

// location related stuff
locationBtn.addEventListener('click', function (event) {
  let sawAlert = false;
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  if (!('geolocation' in navigator)) {
    return;
  }

  navigator.geolocation.getCurrentPosition(function (position) {
    locationLoader.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationInput.value = 'Ulhasnagar';
    fetchedLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    document.querySelector('#manual-location').classList.add('is-focused');
  }, function (err) {
    locationLoader.style.display = 'none';
    locationBtn.style.display = 'inline';
    if (!sawAlert) {
      alert('Could not fetch location, please enter manually!');
      sawAlert = true;
    }
    fetchedLocation = { lat: 0, lng: 0 };
  },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
});

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}

/**
 * display banner message for installing PWA
 */
function openCreatePostModal() {
  createPostArea.style.display = 'block';
  // createPostArea.style.transform = 'translateY(0)';
  initializeMedia();
  initializeLocation();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // unregisterServiceWorker();
}

// unregister service worker
function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(function (registrations) {
        for (var i = 0; i < registrations.length; i++) {
          registrations[i].unregister();
        }
      })
  }
}

// close the create post modal
function closeCreatePostModal() {
  createPostArea.style.display = 'none';
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  }
}

// user initiated cache storage
function onSaveButtonClicked(event) {
  if ('caches' in window) {
    caches.open('user-requested')
      .then((cache) => {
        cache.add('URL');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function removeCard() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function updateUI(data) {
  removeCard();
  for (let key in data) {
    const dataObj = data[key];
    if (dataObj) {
      createCard(dataObj);
    }
  }
}

function createCard(dataObj) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + dataObj.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = dataObj.title;
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = dataObj.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);

  /* var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'Save';
  cardSaveButton.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent';
  cardSupportingText.appendChild(cardSaveButton);
  cardSaveButton.addEventListener('click', onSaveButtonClicked); */

  // componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

let networkResponseReceived = false;

fetch(URL)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkResponseReceived = true;
    updateUI(data);
  });

/** CACHE THEN NETWORK - page interacts with cache directly
if ('caches' in window) {
  caches.match(URL)
    .then(function (response) {
      if (response) {
        return response.json();
      }
    })
    .then(function (data) {
      if (data && !networkResponseReceived) {
        updateUI(data);
      }
    });
} */

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function (data) {
      if (data && !networkResponseReceived) {
        updateUI(data);
      }
    });
}

/**
 * Used for background sync.
 * https://github.com/aakash14goplani/FullStack/wiki/PWA-Background-Sync
 */
form.addEventListener('submit', function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid values!');
    return;
  }

  closeCreatePostModal();

  if ('SyncManager' in window && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(function (sw) {
        const post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture,
          rawLocation: fetchedLocation
        };

        writeData('sync-posts', post)
          .then(function () {
            return sw.sync.register('sync-new-posts');
          })
          .then(function () {
            const snackbarContainer = document.querySelector('#confirmation-toast');
            const data = { message: 'Your Post was saved for syncing!' };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function (err) { });
      })
  } else {
    sendData();
  }
});

function sendData() {
  let postData = new FormData();
  const id = new Date().toISOString();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('file', picture, id + '.png');
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);

  fetch(URL, {
    method: 'POST',
    body: postData
  }).then(function (res) {
    updateUI(res);
  });
}
