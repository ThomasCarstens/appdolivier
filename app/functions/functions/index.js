/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onValueCreated} = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const {getMessaging} = require("firebase-admin/messaging");
// const {initializeApp} = require("firebase-admin/app");
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();
// initializeApp();

const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const {onValueCreated} = require("firebase-functions/v2/database");
// const logger = require("firebase-functions/logger");
// const {https} = require('firebase-functions/v1');
const https = require('https');

exports.onNewFormation = onValueCreated({
    ref: "/formations/{formationId}",
    instance: "appdolivier-default-rtdb",
    region: "europe-west1"
  }, async (event) => {
    const formationData = event.data.val();
    const formationId = event.params.formationId;
  
    if (!formationData) {
      logger.warn("No data associated with the event");
      return;
    }
  
    const payload = {
      title: 'New Formation Created',
      body: `A new formation "${formationData.title}" has been created.`
      
    };
  
    try {
      const response = await fetch('https://sendnotification-akam5j3lyq-uc.a.run.app', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {'Content-Type': 'application/json'}
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.text();
      logger.info('Notification request sent successfully:', responseData);
    } catch (error) {
      logger.error('Error calling notification function:', error);
    }
  });
const {onRequest} = require("firebase-functions/v2/https");








// const logger = require("firebase-functions/logger");
// const {getMessaging} = require("firebase-admin/messaging");
// exports.sendNotification = onRequest(async (req, res) => {
//     const {title, body} = req.body;
    
//     if (!title || !body) {
//       logger.warn("Missing title or body in the request");
//       res.status(400).send("Please provide both title and body for the notification");
//       return;
//     }
  
//     const message = {
//       notification: {
//         title,
//         body
//       },
//       token: "ExponentPushToken[tW1uTVNX_-AmrJnKuY43k_]"
//     };
  
//     try {
//       const response = await getMessaging().send(message);
//       logger.info('Notification sent successfully:', response);
//       res.status(200).send("Notification sent successfully");
//     } catch (error) {
//       logger.error('Error sending notification:', error);
//       res.status(500).send("Error sending notification");
//     }
//   });




// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
// const {getMessaging} = require("firebase-admin/messaging");
// const {initializeApp} = require("firebase-admin/app");
const {Expo} = require('expo-server-sdk');

// initializeApp();


exports.sendNotification = onRequest(async (req, res) => {
  const {title, body} = req.body;
  let token = "ExponentPushToken[tW1uTVNX_-AmrJnKuY43k_]"
  if (!title || !body || !token) {
    logger.warn("Missing title, body, or token in the request");
    res.status(400).send("Please provide title, body, and token for the notification");
    return;
  }

  try {
    let response;
    const expo = new Expo();
    if (Expo.isExpoPushToken(token)) {
      // Send notification using Expo
      const message = {
        to: token,
        sound: 'default',
        title: title,
        body: body,
      };
      response = await expo.sendPushNotificationsAsync([message]);
      logger.info('Expo notification sent successfully:', response);
    } else {
      // Assume it's an FCM token and send using Firebase
      const message = {
        notification: {
          title,
          body
        },
        token: token
      };
      response = await getMessaging().send(message);
      logger.info('FCM notification sent successfully:', response);
    }
    res.status(200).send("Notification sent successfully");
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).send("Error sending notification");
  }
});