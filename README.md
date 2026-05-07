# LoveyBites

A shared recipe book and meal planner web app. Add, import, and organise recipes, then plan your meals on a weekly calendar. Built as a Progressive Web App (PWA) so it can be installed on any device.

## Tech stack

- **React 18** + TypeScript, built with **Vite**
- **Firebase** — Auth, Firestore, Cloud Storage, Hosting, Cloud Functions
- **Tailwind CSS** + Framer Motion
- **AI recipe import** — Claude (default) or OpenAI

---

## Screens

| Route | Screen | Description |
|---|---|---|
| `/login` | Login | Sign in with email/password or Google |
| `/` | Recipes | Browse, search, and filter all your recipes |
| `/recipe/:id` | Recipe Detail | View a recipe, scale portions, use cook mode, rate it, and add it to the calendar |
| `/new` | New Recipe | Import a recipe via URL, pasted text, photo, or enter it manually |
| `/calendar` | Meal Planner | Weekly calendar for planning meals |

---

## Local setup

**Prerequisites:** Node.js 20+, [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

```bash
# 1. Install dependencies
npm ci

# 2. Create your local env file
cp .env.example .env.local
# Fill in the values — see "Environment variables" below

# 3. Start the dev server
npm run dev
```

---

## Firebase setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Register a **Web app** inside the project to get your config values.

### 2. Enable services

| Service | Notes |
|---|---|
| **Authentication** | Enable *Email/Password* and *Google* sign-in providers |
| **Firestore** | Create a database (choose a region, e.g. `europe-west1`) |
| **Cloud Storage** | Default bucket is fine |
| **Hosting** | Required for deployment |
| **Functions** | Required for the URL-import proxy |

### 3. Configure environment variables

Copy the config values from your Firebase web app into `.env.local` (see the [Environment variables](#environment-variables) section).

### 4. Deploy Firestore rules, indexes, and Storage rules

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore,storage
```

### 5. Deploy Cloud Functions

```bash
cd functions && npm ci && npm run build && cd ..
firebase deploy --only functions
```

### 6. Deploy hosting manually (optional)

CI/CD via GitHub Actions handles production deploys automatically (see below). To deploy manually:

```bash
npm run build
firebase deploy --only hosting
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in each value.

| Variable | Type | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Secret | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Secret | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Secret | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Secret | e.g. `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Secret | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Secret | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Secret | Firebase Analytics measurement ID |
| `VITE_ALLOWED_EMAILS` | Secret | Comma-separated list of emails allowed to access the app, e.g. `alice@gmail.com,bob@gmail.com` |
| `VITE_ANTHROPIC_API_KEY` | Secret | Your [Anthropic API key](https://console.anthropic.com/) (used when `VITE_AI_PROVIDER=anthropic`) |
| `VITE_OPENAI_API_KEY` | Secret | Your [OpenAI API key](https://platform.openai.com/api-keys) (used when `VITE_AI_PROVIDER=openai`) |
| `VITE_ENABLE_GOOGLE_LOGIN` | Variable | `true` to show the Google sign-in button, `false` to hide it |
| `VITE_AI_PROVIDER` | Variable | `anthropic` (default) or `openai` |

---

## GitHub deployment (CI/CD)

Two GitHub Actions workflows are included:

| Workflow | Trigger | Result |
|---|---|---|
| `firebase-hosting-merge.yml` | Push to `main` | Builds and deploys to the **live** Firebase Hosting channel |
| `firebase-hosting-pull-request.yml` | Pull request opened/updated | Builds and deploys a **preview** channel; posts the URL as a PR comment |

### Setting up secrets and variables

Go to your repository on GitHub: **Settings → Secrets and variables → Actions**

#### Secrets (`secrets.*`)

Add the following under the **Secrets** tab:

| Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |
| `VITE_ALLOWED_EMAILS` | Comma-separated allowed email addresses |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key |
| `VITE_OPENAI_API_KEY` | OpenAI API key |
| `FIREBASE_SERVICE_ACCOUNT_LOVEYBITES_2E816` | Firebase service account JSON — generated automatically when you connect GitHub Actions via `firebase init hosting:github` or the Firebase Console |

> **How to get the service account key:** Run `firebase init hosting:github` in your project root and follow the prompts. The CLI will create the GitHub secret automatically. Alternatively, generate a service account key in the Firebase Console under **Project settings → Service accounts** and paste the JSON as the secret value.

#### Variables (`vars.*`)

Add the following under the **Variables** tab (these are not sensitive):

| Name | Example value |
|---|---|
| `VITE_ENABLE_GOOGLE_LOGIN` | `true` |
| `VITE_AI_PROVIDER` | `anthropic` |

---

## AI provider for recipe import

The app can extract structured recipe data from a URL, pasted text, or a photo using either **Anthropic Claude** or **OpenAI**.

| Provider | Model | Set `VITE_AI_PROVIDER` to |
|---|---|---|
| Anthropic Claude (default) | `claude-haiku-4-5` | `anthropic` |
| OpenAI | `gpt-4o-mini` | `openai` |

Set `VITE_AI_PROVIDER` and supply the corresponding API key (`VITE_ANTHROPIC_API_KEY` or `VITE_OPENAI_API_KEY`). You only need the key for the provider you intend to use.
