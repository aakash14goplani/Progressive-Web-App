/* eslint-disable object-curly-spacing */
/* eslint-disable max-len */
/* eslint-disable space-before-function-paren */
/* eslint-disable indent */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");

const serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://employees-a405a-default-rtdb.firebaseio.com/",
});

/**
 * Authenticates the valid request and sends the public key to the client.
 */
exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin.database().ref("posts").push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image,
    })
      .then(function () {
        webpush.setVapidDetails(
          "mailto:business@academind.com",
          "BFI3uXPXx6Kxd3eohKSo7wTuw3RxA4GePuE6Nc6wIrbxE5JN_VHUrbEzPnJaY_xE2wIPliwL3ZvR0YMDo2S-fq8",
          "Up4wuLBryJQI092j9R8_5FFl8MAsSDTulVWdKKEGkr0"
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then(function (subscriptions) {
        // fetch subscription details from database
        subscriptions.forEach(function (sub) {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          // once details are handy, push notification
          webpush.sendNotification(pushConfig, JSON.stringify({
            title: "New Post",
            content: "New Post added!",
            openUrl: "/help",
          }))
            .catch(function (err) {
              console.log("Error from cloud function: ", err);
            });
        });
        response.status(201).json({
          message: "Data stored",
          id: request.body.id,
        });
      })
      .catch(function (err) {
        response.status(500).json({ error: "Error from server: " + err });
      });
  });
});
