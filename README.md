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

The app does not communicate directly with myTischtennis from the frontend. Instead, it utilizes a custom backend as a defensive proxy layer. This is crucial because the myTischtennis interface used by the project is unofficial and should not be accessed directly, aggressively, or systematically from the mobile client.

The backend is responsible for:

- Providing stable API endpoints for the mobile app
- Forwarding selected requests to the underlying data source
- Adding short-lived caching
- Applying rate-limit protection
- Handling errors consistently
- Keeping authentication/session-related logic outside of the mobile app
- Avoiding systematic crawling or permanent mirroring of external data

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

Create a `.env` file in the root of the project when your backend is running on your computer (example):

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

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