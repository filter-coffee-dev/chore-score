# ChoreScore

A couple's chore tracking app with real-time scoring, streaks, gamification, and playful taunts. Who's pulling their weight? Now you'll know.

## Features

- Track household chores with points and frequency (daily / weekly / monthly)
- Live score leaderboard between two household members
- Streak tracking — both members must contribute every day to keep it alive
- Taunts that fire on every score refresh (gap > 30 pts = big taunt)
- Badge system for milestones
- Invite code to link two members to a household
- Push notifications via Amazon Pinpoint

## Tech Stack

### App (React Native)
- **Expo SDK 54** (React Native 0.81.5, React 19)
- **React Navigation v7** — stack + bottom tab navigator
- **Zustand** — global state management
- **React Native Web** — web browser support via Metro bundler
- **Cognito auth** — direct REST API (`USER_PASSWORD_AUTH`), no Amplify or `amazon-cognito-identity-js`
- **AsyncStorage** — token persistence

### Backend (AWS)
- **AWS CDK** (TypeScript) — all infrastructure as code
- **Amazon Cognito** — user pool, email/password auth, Post-Confirmation Lambda trigger
- **API Gateway + Lambda** — REST API, all routes require Cognito JWT
- **DynamoDB** — four tables: Users, Households, Chores, Completions
- **Amazon Pinpoint** — push notifications (FCM for Android, APNs for iOS)

### Testing
- **Playwright** — browser-based end-to-end tests running against the web export

## Project Structure

```
chore-score/
├── app/                    # Expo React Native app
│   ├── App.tsx             # Root: auth bootstrap, navigation
│   └── src/
│       ├── screens/        # All screens (auth/, HomeScreen, ChoresScreen, etc.)
│       ├── components/     # ScoreCard, ChoreItem, TauntBanner, StreakBadge
│       ├── services/       # auth.ts (Cognito REST), api.ts (fetch)
│       ├── store/          # Zustand store (useStore.ts)
│       ├── navigation/     # AuthStack + MainTabs
│       ├── theme/          # Design tokens (colors, spacing, radius, shadows)
│       └── utils/          # alert.ts (web-compat), suppressExpoGoWarnings.ts
├── backend/                # AWS CDK stack + Lambda functions
│   ├── bin/app.ts          # CDK entry point
│   ├── lib/chore-score-stack.ts  # All AWS resources
│   └── lambda/             # household/, chores/, scores/, history/, badges/, users/
└── tests/                  # Playwright e2e tests
    ├── specs/              # auth.spec.js, navigation.spec.js
    └── playwright.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with credentials (`aws configure`)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for device builds (`npm install -g eas-cli`)

### 1. Deploy the backend

```bash
cd backend
npm install
npm run deploy
```

Copy the CDK output values into `app/.env`:

```bash
cp app/.env.example app/.env
# Fill in: EXPO_PUBLIC_AWS_REGION, EXPO_PUBLIC_COGNITO_USER_POOL_ID,
#           EXPO_PUBLIC_COGNITO_CLIENT_ID, EXPO_PUBLIC_API_URL
```

### 2. Run the app

**Web (browser):**
```bash
cd app
npm install
npx expo export --platform web
npx serve dist --listen 3000
# Open http://localhost:3000
```

**iOS simulator** (requires macOS + Xcode):
```bash
cd app && npm run ios
```

**Android emulator:**
```bash
cd app && npm run android
```

**Physical device** — Expo Go does NOT work (SDK 53+ notifications require a dev build):
```bash
eas build --platform ios --profile development
# or
eas build --platform android --profile development
```

### 3. Run the tests

```bash
# Build web export first (see step 2), then:
cd tests
npm install
npx playwright install chromium
npx playwright test --config=playwright.config.js
```

To run authenticated tests (tab bar, household flows), set env vars:
```bash
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword npx playwright test --config=playwright.config.js
```

## Push Notification Setup (manual, post-deploy)

1. AWS Console → Pinpoint → ChoreScore → Settings → Push notifications
2. **FCM (Android):** add your Firebase Server Key
3. **APNs (iOS):** upload your Apple Push Certificate

## Design Tokens

All colors are defined in `app/src/theme/index.ts` — never hardcode:

| Token | Value | Use |
|---|---|---|
| `colors.primary` | `#53a687` | Teal — buttons, links |
| `colors.secondary` | `#c1d96c` | Lime — accents |
| `colors.accent` | `#f2b885` | Peach — celebrations |
| `colors.background` | `#e8faf4` | Mint — screen backgrounds |
