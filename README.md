# appdolivier

Management layer for medical training seminars. Practitioners and students browse, filter and enrol in continuing-education seminars; the organisations running them publish and administer their programmes from the same app.

![Seminar listings](docs/posts/87.png)

Built for French osteopathy and medical-training bodies — A.M.O.P.Y. and the SOMOC (Semaine Ostéopathie Médicale Occitane) seminar week among them. The backend is in **[appdolivier-server](https://github.com/ThomasCarstens/appdolivier-server)**.

## What it does

Each seminar carries the information a practitioner actually decides on: dates, location, level, price, category, keywords, the competencies it confers, prerequisites, and where to meet on the day. The listing splits into **available**, **past**, and **enrolled**, with search filters over the catalogue.

The administration side is what made it worth building. Seminar organisers were managing signups by email and spreadsheet; this replaces that with a published catalogue, structured enrolment, and push notifications when something changes.

## Stack

React Native via **Expo (SDK 51)** with **expo-router**, TypeScript, and React Navigation. Firebase supplies authentication, data, and crash reporting through `@react-native-firebase`. Built and shipped with **EAS** to both stores.

## Working on it

```bash
npm install

npm start          # expo start
npm run android
npm run ios
npm run web

npm run lint
npm test
```

| Path | Contents |
| --- | --- |
| `app/` | Screens and routes (expo-router file-based routing) |
| `components/`, `hooks/`, `constants/` | Shared UI and logic |
| `firebase.js` | Firebase client initialisation |
| `eas.json`, `app.json` | Build profiles and app configuration |
| `docs/build-notes.md` | Working notes on EAS builds, Play Store signing and store submission |

## Context

This is one of a series of platforms connecting tutors to students — see also [Kipp_online](https://github.com/ThomasCarstens/Kipp_online) and [UniversityCourseApp](https://github.com/ThomasCarstens/UniversityCourseApp). Building them made something clear that the [educate-me](https://github.com/ThomasCarstens/educate-me) project was a reaction to: these apps help the *teaching* process, not the *learning* process.

---

More project write-ups: [thomascarstens.github.io](https://thomascarstens.github.io) · Questions: thomaxarstens@gmail.com
