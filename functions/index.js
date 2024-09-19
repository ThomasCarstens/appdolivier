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
      title: `Nouvelle Formation le ${formationData.date}`,
      body: `"${formationData.title}"`
      
    };
    //https://sendbulknotifications-akam5j3lyq-uc.a.run.app/
    //https://sendnotification-akam5j3lyq-uc.a.run.app
    try {
      const response = await fetch('https://sendbulknotifications-akam5j3lyq-uc.a.run.app/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {'Content-Type': 'application/json'},
        data: formationId //for the admin's validation panel
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



exports.onNewInscription = onValueCreated({
  ref: "/demandes/{userUid}/{formationUid}",
  instance: "appdolivier-default-rtdb",
  region: "europe-west1"
}, async (event) => {
  const userData = event.data.val();
  const userUid = event.params.userUid;
  const formationUid = event.params.formationUid;
  const adminEmail = "thomas.carstens@outlook.com" //docteurdumay@gmail.com in production
  console.log(userData)
  if (!userData) {
    logger.warn("No data associated with the event");
    return;
  }

  const payload = {
    title: 'Nouvelle demande d\'inscription',
    body: `${userData.prenom} ${userData.nom} `,
    data: formationUid //for the admin's validation panel
    
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

  // Prepare email payload
  const emailPayload = {
    from: 'Administrateur Dumay sur Esculappl <admin-dumay@gmail.com>', 
    to: userData.email, // to change to user
    subject: "Demande d'inscription sur Esculapp",
    html: `<p style="font-size: 16px;">L'inscription est en attente. Munissez vous de votre code d'acces pour repondre a la demande d'inscription.<br/>
      Utilisateur: ${userData.prenom} ${userData.nom} <br/>
      Formation: ${userData.formationTitle} <br/>      
      </p>
      <p style="font-size: 16px;">Date: ${new Date().toLocaleString()}</p>
    <br />`, // email content in HTML
    body: `test body `
  };

  try {
    // Send email notification
    const emailResponse = await fetch('https://sendmail-akam5j3lyq-uc.a.run.app/', {
      method: 'POST',
      body: JSON.stringify(emailPayload),
      headers: {'Content-Type': 'application/json'}
    });

    if (!emailResponse.ok) {
      throw new Error(`HTTP error! status: ${emailResponse.status}`);
    }

    logger.info('Email request sent successfully:', await emailResponse.text());
  } catch (error) {
    logger.error('Error calling email function:', error);
  }
});
const {onRequest} = require("firebase-functions/v2/https");


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
    const {title, body, data} = req.body;
    const id = data
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
        timestamp,
        id
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


const cors = require('cors')({origin: true});
/**
* Here we're using Gmail to send 
*/

const nodemailer= require("nodemailer");
const transporter = nodemailer.createTransport({
          service: 'gmail',
          // port: 587,
          // secure: false, // true for port 465, false for other ports
          auth: {
              user: 'thomaxarstens@gmail.com',
              pass: 'pzic filh fyyy ymkk'
          }
        });
                
exports.sendMail = onRequest((req, res) => {
    cors(req, res, () => {
        console.log(req.body)
        // getting dest email by query string
        // const dest = req.query.dest;
        const mailPayload = req.body;
        
        


        // const mailOptions = {
        //     from: 'Administrateur Dumay sur Esculappl <admin-dumay@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
        //     to: dest,
        //     subject: 'test', // email subject
        //     html: `<p style="font-size: 16px;">test it!!</p>
        //         <br />
        //     ` // email content in HTML
        // };

        // returning result
        return transporter.sendMail(mailPayload, (erro, info) => {
            if(erro){
                return res.send(erro.toString());
            }
            return res.send('Sended');
        });
    });    
});



