# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChoreScore — a couple's chore tracking app with real-time scoring, gamification, and playful taunts. Cross-platform (iOS + Android) with an AWS backend.

## Repository Structure

```
chore-score/
├── backend/          # AWS CDK infrastructure + Lambda functions (Node.js/TypeScript)
│   ├── bin/app.ts           # CDK entry point
│   ├── lib/chore-score-stack.ts  # All AWS resources (Cognito, DynamoDB, Lambda, API Gateway)
│   └── lambda/
│       ├── shared/          # types.ts, db.ts, taunts.ts, badges.ts
│       ├── household/       # create, join, get
│       ├── chores/          # list, create, update, delete, complete
│       ├── scores/          # get (includes taunt + streak calculation)
│       ├── history/         # get
│       ├── badges/          # get
│       └── users/           # postConfirmation (Cognito trigger), update
└── app/              # Expo React Native app (TypeScript)
    ├── App.tsx              # Root: auth check, bootstrap, push token registration
    └── src/
        ├── theme/           # Design tokens (colors, spacing, radius, shadows)
        ├── navigation/      # React Navigation: AuthStack + MainTabs
        ├── services/        # auth.ts (amazon-cognito-identity-js), api.ts (fetch)
        ├── store/           # Zustand store (useStore.ts)
        ├── screens/         # All screens
        └── components/      # ScoreCard, ChoreItem, TauntBanner, StreakBadge
```

## Backend Commands

```bash
cd backend
npm install
npm run deploy          # Deploy to AWS (requires AWS credentials configured)
npm run synth           # Preview CloudFormation template
npm run destroy         # Tear down all AWS resources
```

## App Commands

```bash
cd app
npm install
npm start               # Start Expo dev server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run build:ios       # EAS build for iOS
npm run build:android   # EAS build for Android
```

## First-Time Setup

1. `cd backend && npm install && npm run deploy`
2. Copy CDK output values into `app/.env` (see `app/.env.example`)
3. `cd app && npm install && npm start`
4. Expo Go does NOT work — use a dev build via `eas build` or `npx expo run:ios`

## AWS Architecture

- **Auth**: Cognito User Pool (email + password, SRP auth). User record auto-created in DynamoDB via Post-Confirmation Lambda trigger.
- **API**: REST API Gateway + Lambda (all routes require Cognito JWT in Authorization header)
- **Database**: DynamoDB — four tables: Users, Households, Chores, Completions
- **Push notifications**: Amazon Pinpoint (FCM for Android, APNs for iOS) — requires manual setup of FCM key and APNs certificate in Pinpoint console after deploy
- **CDK outputs**: UserPoolId, UserPoolClientId, ApiUrl, PinpointAppId — copy to `app/.env`

## Key Design Decisions

- Scores never reset (lifetime total). Streak resets if both members don't contribute on a calendar day.
- Chores have frequency (daily/weekly/monthly). "Completed this period" is checked client-side by Lambda based on most recent completion timestamp vs period start.
- Taunts fire on every score refresh. Gap > 30 pts = big taunt, else small taunt.
- No real-time; user taps 🔄 to refresh scores. Simplifies backend (no WebSockets/AppSync needed).
- Auth uses direct Cognito REST API (`USER_PASSWORD_AUTH` flow via fetch to `https://cognito-idp.${REGION}.amazonaws.com/`) — NOT `amazon-cognito-identity-js` or Amplify. Tokens stored in AsyncStorage. See `app/src/services/auth.ts`.

## Design Tokens

From `app/src/theme/index.ts` — always use these, never hardcode colors:
- `colors.primary` = `#53a687` (teal)
- `colors.secondary` = `#c1d96c` (lime)
- `colors.accent` = `#f2b885` (peach — celebrations)
- `colors.background` = `#e8faf4` (mint)

## Adding a New Lambda

1. Create `backend/lambda/<group>/<name>.ts` exporting `handler: APIGatewayProxyHandler`
2. Add `NodejsFunction` to `chore-score-stack.ts` and wire it to an API Gateway route
3. Grant DynamoDB permissions on the function

## Adding a New Screen

1. Create screen in `app/src/screens/`
2. Add to `AuthStackParams` or `MainTabParams` in `app/src/navigation/index.tsx`
3. Register in the appropriate navigator

## Testing & Verification Loop

Playwright tests live in `tests/specs/`. **After every app change, run the full verification loop.**

### Verification loop (run after every change)

```bash
# 1. Rebuild the web export
cd app && npx expo export --platform web --clear

# 2. Serve it (kill any existing server first)
pkill -f "serve dist" 2>/dev/null
npx serve dist --listen 3000 &
sleep 2

# 3. Run the test suite
cd ../tests && npx playwright test --config=playwright.config.js
```

All tests must pass (skipped is acceptable for tests gated on `TEST_EMAIL`/`TEST_PASSWORD`).

### Alert handling rules

- **Never use `Alert.alert` directly** in screens — import `showAlert` from `src/utils/alert` instead. `Alert.alert` is a no-op stub in React Native Web.
- Multi-button dialogs (Cancel/Confirm patterns) must keep `Alert.alert` since `showAlert` only handles title+message. Those flows are not testable on web.

### Playwright patterns

- For alerts triggered by **async** handlers (e.g. API calls): use sequential `waitForEvent` → click → `await dialogPromise`
- For alerts triggered **synchronously** on click (e.g. empty-field validation): register `page.once('dialog', handler)` BEFORE clicking — synchronous `window.alert()` blocks the CDP click response, so pre-registration is required
- React Navigation keeps prior stack screens mounted but hidden on web — use `.first()` or `.last()` selectors deliberately, or scope to a visible container

### Adding / updating tests

- Tests go in `tests/specs/<feature>.spec.js`
- Name test files by feature: `auth.spec.js`, `navigation.spec.js`, `chores.spec.js`, etc.
- Cover the golden path for any new screen or user flow
- If a new flow uses `Alert.alert` for validation, add a test for it using the synchronous dialog pattern above

## Pinpoint Push Notification Setup (manual, after deploy)

1. AWS Console → Pinpoint → ChoreScore app → Settings → Push notifications
2. FCM: add your Firebase Server Key
3. APNs: upload your Apple Push Certificate
