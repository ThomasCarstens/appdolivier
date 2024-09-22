const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();
const {Expo} = require('expo-server-sdk');
const expo = new Expo();

const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const {onValueCreated, onValueUpdated} = require("firebase-functions/v2/database");
const {onRequest} = require("firebase-functions/v2/https");

// Helper function to send notification
const sendNotification = async (expoPushToken, data, id, uid) => {
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
      }
    }
    if (ticket.status === "ok") {
      response = ticket.id;
    }
  }

  await admin.database().ref(`notification-panel/${id}/received/${uid}`).set(response);
  return response;
};

// Helper function to send email
const sendEmail = async (emailPayload) => {
  try {
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
};

exports.onInscriptionValidation = onValueUpdated({
  ref: "/demandes/{userUid}/{formationUid}/admin",
  instance: "appdolivier-default-rtdb",
  region: "europe-west1"
}, async (event) => {
  const adminStatus = event.data.val();
  const userUid = event.params.userUid;
  const formationUid = event.params.formationUid;

  if (!adminStatus) {
    logger.warn("No data associated with the event");
    return;
  }

  // Fetch user data
  const userSnapshot = await admin.database().ref(`userdata/${userUid}`).once('value');
  const userData = userSnapshot.val();

  // Fetch formation data
  const formationSnapshot = await admin.database().ref(`formations/${formationUid}`).once('value');
  const formationData = formationSnapshot.val();

  let title, body, emailSubject, emailContent;
  if (adminStatus === "validé") {
    title = `Inscription acceptée : ${formationData.title}`;
    body = `Votre inscription à "${formationData.title}" a été acceptée.`;
    emailSubject = title;
    emailContent = `<p style="font-size: 16px;">Votre inscription à la formation "${formationData.title}" a été acceptée.</p>`;
  } else if (adminStatus === "rejeté") {
    title = `Inscription rejetée : ${formationData.title}`;
    body = `Votre inscription à "${formationData.title}" a été rejetée. Veuillez contacter contact.esculappl@gmail.com.`;
    emailSubject = title;
    emailContent = `<p style="font-size: 16px;">Votre inscription à la formation "${formationData.title}" a été rejetée. Veuillez contacter contact.esculappl@gmail.com pour plus d'informations.</p>`;
  } else {
    logger.warn("Invalid admin status");
    return;
  }

  const timestamp = Date.now();
  await admin.database().ref(`notification-panel/${timestamp}`).set({
    title,
    body,
    timestamp,
    formationId: formationUid
  });

  const token = userData?.notifications?.token;
  if (token && Expo.isExpoPushToken(token)) {
    const message = {
      to: token,
      sound: 'default',
      title: title,
      body: body,
    };

    await sendNotification(token, message, timestamp, userUid);
  }

  const emailPayload = {
    from: 'Administrateur Dumay <contact.esculappl@gmail.com>',
    to: userData.email,
    subject: emailSubject,
    html: `${emailContent}
      <p style="font-size: 16px;">Date: ${new Date().toLocaleString()}</p>
    <br />`,
  };

  await sendEmail(emailPayload);
});

exports.onFormationValidation = onValueUpdated({
  ref: "/formations/{formationId}/admin",
  instance: "appdolivier-default-rtdb",
  region: "europe-west1"
}, async (event) => {
  const adminStatus = event.data.val();
  const formationId = event.params.formationId;

  if (adminStatus !== "Validée") {
    logger.warn("Formation not validated");
    return;
  }

  const formationSnapshot = await admin.database().ref(`formations/${formationId}`).once('value');
  const formationData = formationSnapshot.val();

  const title = "Nouvelle formation";
  const body = `"${formationData.title}" le ${formationData.date}`;

  const timestamp = Date.now();
  await admin.database().ref(`notification-panel/${timestamp}`).set({
    title,
    body,
    timestamp,
    formationId
  });

  // Fetch all users
  const usersSnapshot = await admin.database().ref('userdata').once('value');
  const users = usersSnapshot.val();

  for (const [uid, userData] of Object.entries(users)) {
    const token = userData?.notifications?.token;

    if (token && Expo.isExpoPushToken(token)) {
      const message = {
        to: token,
        sound: 'default',
        title: title,
        body: body,
      };

      await sendNotification(token, message, timestamp, uid);
    }
  }

  // Send email to admin
  const emailPayload = {
    from: 'Administrateur Esculappl <contact.esculappl@gmail.com>', 
    to: 'contact.esculappl@gmail.com', // Change this to the actual admin email
    subject: `Formation Validée: ${formationData.title}`,
    html: `<p style="font-size: 16px;">
      Votre formation a été validée :<br/>
      Formation: ${formationData.title} <br/>
      Date: ${formationData.date} <br/>
      </p>
      <p style="font-size: 16px;">Date de validation: ${new Date().toLocaleString()}</p>
    <br />`,
  };

  await sendEmail(emailPayload);
});


exports.sendAdminNotification = onRequest(async (req, res) => {
  const {title, body} = req.body;
  let token = "ExponentPushToken[tW1uTVNX_-AmrJnKuY43k_]" //admin when ready
  if (!title || !body || !token) {
    logger.warn("Missing title, body, or token in the request");
    res.status(400).send("Please provide title, body, and token for the notification");
    return;
  }

  try {
    let response;
    
    const timestamp = Date.now();
    admin.database().ref(`admin-panel/${timestamp}`).set({
      title,
      body,
      timestamp,
    });

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
    title: `[Admin] Nouvelle Formation le ${formationData.date}`,
    body: `"${formationData.title}"`
    
  };
  //https://sendbulknotifications-akam5j3lyq-uc.a.run.app/
  //https://sendnotification-akam5j3lyq-uc.a.run.app
  //https://sendadminnotification-akam5j3lyq-uc.a.run.app
  try {
    const response = await fetch('https://sendadminnotification-akam5j3lyq-uc.a.run.app/', {
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

// Prepare email payload
const emailPayload = {
  from: 'Administrateur Dumay <contact.esculappl@gmail.com>', 
  to: 'contact.esculappl@gmail.com', // Change this to the actual admin email
  subject: `Validation nécessaire: Formation ${formationData.title}`,
  html: `<p style="font-size: 16px;"> Pour y répondre, munissez vous de votre code d'accès Esculappl.<br/>
    Formation: ${formationData.title} <br/>      
    Plus d'informations dans l'espace de Validation d'Inscriptions sur Esculappl.
    </p>
    <p style="font-size: 16px;">Date: ${new Date().toLocaleString()}</p>
  <br />`, // email content in HTML
  // body: `test body `
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
  title: '[Admin] Nouvelle demande d\'inscription',
  body: `${userData.prenom} ${userData.nom} `,
  data: formationUid //for the admin's validation panel
  
};
//https://sendbulknotifications-akam5j3lyq-uc.a.run.app/
//https://sendnotification-akam5j3lyq-uc.a.run.app
try {
  const response = await fetch('https://sendadminnotification-akam5j3lyq-uc.a.run.app/', {
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
  from: 'Administrateur Dumay <contact.esculappl@gmail.com>', 
  to: 'contact.esculappl@gmail.com', 
  subject: `Validation nécessaire: Inscription ${userData.nom} [${formationUid}]`,
  html: `<p style="font-size: 16px;"> Pour y répondre, munissez vous de votre code d'accès Esculappl.<br/>
    Utilisateur: ${userData.prenom} ${userData.nom} <br/>
    Formation: ${userData.formationTitle} <br/>      
    Plus d'informations dans l'espace de Validation d'Inscriptions sur Esculappl.
    </p>
    <p style="font-size: 16px;">Date: ${new Date().toLocaleString()}</p>
  <br />`, // email content in HTML
  // body: `test body `
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
              // user: 'thomaxarstens@gmail.com',
              // pass: 'pzic filh fyyy ymkk',
              user: 'contact.esculappl@gmail.com',
              pass: 'zucw dnfo tcml eaaa'

               
          }
        });
                
exports.sendMail = onRequest((req, res) => {
    cors(req, res, () => {
        console.log(req.body)
        // getting dest email by query string
        // const dest = req.query.dest;
        const mailPayload = req.body;
        
        // returning result
        return transporter.sendMail(mailPayload, (erro, info) => {
            if(erro){
                return res.send(erro.toString());
            }
            return res.send('Sended');
        });
    });    
});


