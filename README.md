# 📊 TTR Tracker

## Table of Contents
- [What the App Does](#what-the-app-does)
- [Backend Repository](#backend-repository)
- [Why a Backend Is Required](#why-a-backend-is-required)
- [Requirements](#requirements)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Running the App](#running-the-app)

---
### ⚠️ Disclaimer ⚠️

This repository was developed quickly and is still a work in progress. It is not finished and may contain errors, bugs, incomplete features, or unstable behavior.

Use it at your own risk. Contributions, feedback, and improvements are welcome.

## What the App Does

TTR Tracker provides a mobile-friendly interface for accessing table tennis data in Germany, including:

- 🔍 Player search
- 🏓 Club search
- 👥 Club teams
- 📊 League and region browsing
- 📈 League tables
- 📅 Match schedules
- 📋 Match and encounter details
- ⭐ Favorites for players
- ⭐ Favorites for clubs
- ⭐ Favorites for leagues

## Backend Repository

This repository contains the mobile app frontend. The app requires a separate backend service to function correctly. The backend is available here:

[**TTR Tracker Backend**](https://github.com/kiranfin/tt-tracker-backend)

The backend serves as the counterpart to this mobile app, providing the API that the app communicates with.

### Important ⚠️

Before running or building the app, ensure that the backend is configured, deployed, and reachable from your device or build environment.

## Why a Backend Is Required

Public data (search, clubs, leagues, tables, schedules, match reports) never comes straight from myTischtennis. The app asks the backend, which acts as a defensive proxy: it caches, spreads requests over time and keeps to a fixed request budget. The myTischtennis interface used by the project is unofficial and must not be hit directly, aggressively or systematically from many phones.

Personal data that needs a myTischtennis login (your own TTR and history) is different. It is fetched by the phone itself with the login stored on the device, and the login never goes to the backend. If you share your rating with another app user, the phone uploads the last data it got (a snapshot, at most once an hour, with your consent) and the backend hands it to the people you shared it with.

The backend is responsible for:

- Providing stable API endpoints for the mobile app
- Caching public data and refreshing it by match schedule, in the background
- Staying within a fixed budget of requests to myTischtennis
- Handling errors consistently, so the app can show the last known data with its age
- Storing shared snapshots for the people you shared them with
- Avoiding systematic crawling or permanent mirroring of external data

The app also keeps its own copy of every answer. It shows the stored data at once ("As of 5 minutes ago") and refreshes it in the background.

## Requirements

Before running or building the app, install the following:

- Node.js
- npm
- An Expo account
- EAS CLI
- A running instance of the backend

### Install EAS CLI globally

```bash
npm install -g eas-cli
```

### Log in to your Expo account:

```bash
eas login
```

### Install the project dependencies:

```bash
npm install
```

## Environment Variables

The mobile app needs to know where the backend API is located. This is configured through the following environment variable:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

## Local Development Setup

Create a `.env` file in the root of the project that points to your deployed backend:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

In a development build (JS served by Metro) the settings screen (System tab) shows a switch between **Server** and **Local (PC)**. Local uses the IP of the machine running Metro and port `4001`, so the phone reaches the backend on your PC over Wi-Fi. Preview and production builds never show the switch and always use `EXPO_PUBLIC_API_BASE_URL`.

Optional overrides for the local backend:

```env
# Port of the local backend (default 4001)
EXPO_PUBLIC_LOCAL_API_PORT=4001
# Full URL, e.g. when using a tunnel or an emulator setup that cannot be detected
EXPO_PUBLIC_LOCAL_API_BASE_URL=http://192.168.178.20:4001
```

The local backend must listen on all interfaces (`HOST=0.0.0.0` in the backend `.env`). Login tokens are stored per backend, because the local backend has its own users.

## Running the App

### Running Locally

To start the app locally, use:

```bash
npx expo start
```

### EAS Build

The app is built using EAS Build. A typical setup uses at least two build profiles:

- **Preview** for internal testing
- **Production** for release builds

The preview profile is useful for creating installable builds that can be tested on real devices. The production profile is intended for release builds, such as app store builds or final distribution builds.

#### Setting Environment Variables for EAS Builds

Local `.env` files are useful during development, but cloud builds should use EAS environment variables.

Create the backend URL for the preview environment:

```bash
eas env:create \
--name EXPO_PUBLIC_API_BASE_URL \
--value https://your-backend-domain.com \
--environment preview \
--visibility plaintext
```

Create the backend URL for the production environment:

```bash
eas env:create \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value https://your-backend-domain.com \
  --environment production \
  --visibility plaintext
```

#### Building the App with EAS

1. Install dependencies:
   ```bash
   npm install
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Build an Android APK:

   **Preview:**
   ```bash
   eas build --platform android --profile preview
   ```

   **Production:**
   ```bash
   eas build --platform android --profile production
   ```