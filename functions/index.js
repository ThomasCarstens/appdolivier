/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// import * as Notifications from 'expo-notifications';
// const {onValueCreated} = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const {getMessaging} = require("firebase-admin/messaging");
// const {initializeApp} = require("firebase-admin/app");
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();
// initializeApp();
const {Expo} = require('expo-server-sdk');
const expo = new Expo();

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
    //https://sendbulknotifications-akam5j3lyq-uc.a.run.app/
    //https://sendnotification-akam5j3lyq-uc.a.run.app
    try {
      const response = await fetch('https://sendbulknotifications-akam5j3lyq-uc.a.run.app/', {
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

// TO BE TESTED: SCHEDULER
// async function scheduleAndCancel(message) {
//   const identifier = await Notifications.scheduleNotificationAsync({
//     content: {
//       title: message.title,
//       body: message.body,
//     },
//     trigger: { hour: 9, minute: 20 },
//   });
//   await Notifications.cancelScheduledNotificationAsync(identifier);
// }

const sendNotification = async (expoPushToken, data, id, uid) => {
  const expo = new Expo({ accessToken: process.env.ACCESS_TOKEN });
  const chunks = expo.chunkPushNotifications([{ to: expoPushToken, ...data }]);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  let response = "";
  for (const ticket of tickets) {
    if (ticket.status === "error") {
      if (ticket.details && ticket.details.error === "DeviceNotRegistered") {
        response = "DeviceNotRegistered";
        // should delete this when live
      }
    }
    if (ticket.status === "ok") {
      response = ticket.id;
    }
  }

  await admin.database().ref(`notification-panel/${id}/received/${uid}`).set(response);
  return response;
};


exports.sendBulkNotifications = onRequest(async (req, res) => {
    const {title, body} = req.body;
  
    if (!title || !body) {
      console.warn("Missing title or body in the request");
      res.status(400).send("Please provide both title and body for the notifications");
      return;
    }
  
    try {
      // Get all user data
      const usersSnapshot = await admin.database().ref('userdata').once('value');
      const users = usersSnapshot.val();
  
      const notificationPromises = [];
      const timestamp = Date.now();
      admin.database().ref(`notification-panel/${timestamp}`).set({
        title,
        body,
        timestamp
      });

    
      for (const [uid, userData] of Object.entries(users)) {
        const token = userData?.notifications?.token;

        // admin.database().ref(`notification-panel/${timestamp}/${uid}`).set(false);

        if (token && Expo.isExpoPushToken(token)) {
          const message = {
            to: token,
            sound: 'default',
            title: title,
            body: body,
          };

          await sendNotification (token, message, timestamp, uid);

        } else {
          console.log('User without a token', error);
          // should count the users who are not notified when live but nothing can be done if they don't authorise it.
        }
      }
    
      res.status(200).send("Bulk notifications processed");
    } catch (error) {
      console.error('Error processing bulk notifications:', error);
      res.status(500).send("Error processing bulk notifications");
    }
  });




