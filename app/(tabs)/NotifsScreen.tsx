import { useState, useEffect, useRef } from 'react';
import { auth, firebase, storage, database } from '../../firebase'
import { ref as ref_d, set, get, onValue } from 'firebase/database'

import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// If you need to show notifications when your app is in the foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true
//   }),
// });


async function sendPushNotification(expoPushToken: string) {
  // send push notification and add entry in database


  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  set(ref_d(database, `solo_notifications/${expoPushToken.split('[')[1].split(']')[0]}/date`), {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  })    

}







function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      set(ref_d(database, `userdata/${auth.currentUser.uid}/notifications/`), {
        token: pushTokenString
      })    
      
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else { 
    handleRegistrationError('Must use physical device for push notifications');  
  }
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [pushTokenList, setPushTokenList] = useState([]);
  const [UidPushTokenList, setUidPushTokenList] = useState({});
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log(notification)
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
        
      // set(ref_d(database, `notification-panel/${response.notification.request.content.title}/${auth.currentUser.uid}`), (true));

    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function getListTargetUsers(isValidated: boolean, isFormateur: boolean, isAdmin: boolean) {

    const userDataRef = ref_d(database, "/userdata/" );

    onValue(userDataRef, (snapshot) => {
          const data = snapshot.val();
          if (data){
              console.log('Checking users. --------------------')
              // console.log(data["UKpwHEnNP6enoIhI4lhBpIdoEfR2"])              
              // setGameFile(data)
              try {
              for (let uid of Object.keys(data)) { 
              console.log(uid)
              let role = data[uid]["role"]
              
                  console.log('user role AVF: ', Boolean(role["isAdmin"]), Boolean(role["isValidated"]), Boolean(role["isFormateur"]))
                  // go through each data.uid.role and get a,v,f
                  if ((Boolean(role["isAdmin"]) != isAdmin)||(Boolean(role["isValidated"]) != isValidated)||(Boolean(role["isFormateur"]) != isFormateur)) {//, isValidated, isFormateur
                    console.log(isAdmin, isValidated, isFormateur)
                    console.log('failed: ', data[uid]["notifications"]["token"])
                    continue
                  }
           
                  // if a,v,f === isA,isV,isF then get data.uid.notifications.token
                  console.log('passed: ', data[uid]["notifications"]["token"])
                  let userToken = data[uid]["notifications"]["token"]
                  // add it to list
                  setPushTokenList(previous => {
                    let pushTokens = [...previous]
                    pushTokens.push(userToken)
                    return pushTokens
                  })
                  setUidPushTokenList(previous => {
                    let UidAndTokens = {...previous}
                    UidAndTokens[userToken]=uid
                    return UidAndTokens
                  })


          }

        } catch (error) {
          console.log('ROLE PARSING ERROR: ', error);
      }
          
        }})
      }
  async function sendGroupPushNotification(isValidated: boolean, isFormateur: boolean, isAdmin: boolean) {

    for (let pushToken of await pushTokenList) { 
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'Original Title',
        body: 'And here is the body!',
        data: { someData: 'goes here' },
      };
  
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      set(ref_d(database, `notification-panel/${UidPushTokenList[pushToken]}/date`), { //by uid and date
        sound: message.sound,
        title: message.title,
        body: message.body,
        data: { someData: message.data.someData},
      })   
    }

 
    
    
  }
  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Your Expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Press to Send Self Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />

      <Button
        title="Press to Collect Tokens"
        onPress={async () => {
          await getListTargetUsers(false, false, false)
        }}
      />

      <Button
        title="Press to Send Group Notifications"
        onPress={async () => {
          await sendGroupPushNotification(pushTokenList)
        }}
      />
    </View>
  );
}