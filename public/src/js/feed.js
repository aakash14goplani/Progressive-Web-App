const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
const sharedMomentsArea = document.querySelector('#shared-moments');
const URL = 'https://employees-a405a-default-rtdb.firebaseio.com/posts.json';

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

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

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
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
    console.log('Data drom n/w: ', data);
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
