# 🪞 Personal Gemini Journal

> **Your thoughts have patterns. AI Mirror helps you notice them.**

Personal Gemini Journal is a private, AI-assisted journaling application built around a simple idea: writing becomes more useful when you can step back and see what keeps appearing.

The application lets authenticated users write journal entries, receive grounded Gemini reflections, review their writing history, and use **AI Mirror** to identify recurring patterns, possible contradictions, emerging insights, and reflection prompts across their recent entries.

The project was designed as a production-oriented Google Cloud application, with authentication, per-user data isolation, server-side AI access, secret management, abuse controls, automated security tests, data export, and account deletion built into the application rather than treated as afterthoughts.

---

## ✦ Live Application

**Production:**  
https://personal-gemini-journal-597106941716.asia-south1.run.app/

---

## The idea

Most journaling applications help you **store** thoughts.

Personal Gemini Journal is designed to help you **reflect on them**.

The core experience has three stages:

**WRITE** → capture what is happening  
**REFLECT** → receive an AI-generated response grounded in the entry  
**NOTICE** → use AI Mirror to look across entries and surface recurring signals

AI Mirror is the application's original feature. Instead of simply generating another response to a single prompt, it treats the user's recent journal history as a collection of observations and asks:

- What keeps appearing?
- Where might goals, feelings, and actions conflict?
- What seems to be changing over time?
- What questions might be worth thinking about next?

The system deliberately distinguishes observations from interpretations and avoids presenting speculation as fact.

---

# Product

## Journal

Users can write a journal entry and receive a Gemini reflection.

Each entry is stored together with its generated reflection, allowing the user to return to previous writing later.

The journal experience is intentionally lightweight: the application is meant to feel like a personal reflection space rather than a conventional productivity dashboard.

## History

The History view provides access to previous journal entries and their reflections.

Entries are associated with the authenticated Firebase user and are stored under that user's own Firestore document hierarchy.

## AI Mirror

AI Mirror is the main differentiating feature.

It analyzes the user's recent journal entries and produces four sections:

### Recurring Patterns
Themes, behaviors, concerns, goals, or situations that appear repeatedly.

### Possible Contradictions
Places where stated goals, feelings, or actions may appear to conflict.

### Emerging Insights
Changes or developments that appear across the user's writing.

### Reflection Prompts
Two or three questions intended to encourage further self-reflection.

AI Mirror is intentionally **not** a diagnostic or therapeutic system. It does not claim to know the user's psychological state and is instructed to remain grounded in the supplied journal content.

---

# Privacy & Security

Journal entries can contain highly personal information, so security is part of the application's architecture.

## Authentication

The application uses **Firebase Authentication with Google Sign-In**.

The browser obtains a Firebase ID token after authentication.

Protected backend routes do not trust client-provided user IDs. Instead, the server verifies the Firebase ID token using the Firebase Admin SDK and obtains the authenticated user's UID from the verified token.

This pattern is used throughout the protected API surface.

## User-level data isolation

Journal data is stored using a UID-scoped Firestore structure:

````text
users/
  {uid}/
    entries/
      {entryId}
        content
        reflection
        createdAt

    patterns/
      {patternId}
````

Firestore rules use the authenticated Firebase UID as the authorization boundary.

The default rule is deny-all, with explicit access granted only to the authenticated owner of the corresponding `/users/{uid}` document and its supported subcollections.

This provides defense in depth:

**Client → Firebase Auth → verified server identity → UID-scoped Firestore access**

## Server-side Gemini access

Gemini requests are made exclusively from the server.

The Gemini API key is never placed in browser code or committed to the repository.

The production Cloud Run service reads the key from **Google Cloud Secret Manager**.

````text
Browser
   │
   │ authenticated request
   ▼
Cloud Run
   │
   ├── Firebase Admin SDK
   ├── Firestore
   ├── Secret Manager
   │
   └── Gemini API
````

## Prompt injection resistance

Journal text is treated as **untrusted data**.

A journal entry can contain arbitrary text, including text that attempts to:

* override system instructions
* reveal the Gemini API key
* reveal environment variables
* expose internal configuration
* change application behavior
* request the system prompt

The Gemini system instruction explicitly establishes that journal content is data rather than authority.

The application also avoids exposing credentials, internal implementation details, or security configuration through model responses.

Prompt-injection behavior is documented and manually verified in production, with an integration test available when a Gemini API key is supplied.

## Input validation

Protected AI endpoints validate incoming requests before processing them.

Journal prompts must:

* be strings
* contain actual content
* be trimmed
* remain within the configured 10,000-character limit

Requests without a valid authentication token are rejected before journal data or Gemini processing is accessed.

## Rate limiting

AI endpoints use a **Firestore-backed rate limiter** rather than an in-memory instance-local counter.

The current policy is:

````text
10 requests
per minute
per authenticated user
````

The limiter uses a Firestore transaction, making the counter persistent across Cloud Run instances rather than relying on a single container's memory.

The limiter is applied to:

````text
POST /api/chat
GET  /api/mirror
````

This provides a basic application-level defense against accidental or abusive Gemini usage.

---

# Data controls

## Export

Authenticated users can export their journal data as JSON.

The export includes:

* Firebase UID
* account email associated with the verified token
* export timestamp
* journal entry IDs
* journal content
* generated reflections
* creation timestamps

The export endpoint is protected by Firebase authentication and only reads the requesting user's UID-scoped data.

## Account deletion

Users can permanently delete their account from **Settings**.

The deletion flow removes:

1. journal entries
2. stored pattern documents
3. user document
4. rate-limit records
5. Firebase Authentication account

The operation is authenticated using the user's Firebase ID token.

This gives users both **data portability** and **data deletion** rather than making their journal effectively permanent.

---

# Architecture

````text
                         ┌──────────────────────┐
                         │       Browser        │
                         │  Next.js application │
                         └──────────┬───────────┘
                                    │
                         Firebase Authentication
                                    │
                                    ▼
                    ┌────────────────────────────┐
                    │         Cloud Run          │
                    │                            │
                    │ Next.js frontend + API     │
                    │                            │
                    │ Firebase Admin SDK         │
                    │ Request validation         │
                    │ Rate limiting              │
                    │ Gemini orchestration       │
                    └──────┬──────────┬──────────┘
                           │          │
                 ┌─────────┘          └──────────────┐
                 ▼                                    ▼
        ┌──────────────────┐                ┌──────────────────┐
        │    Firestore     │                │ Secret Manager   │
        │                  │                │                  │
        │ User journals    │                │ GEMINI_API_KEY   │
        │ Reflections      │                │                  │
        │ Rate limits      │                └────────┬─────────┘
        └──────────────────┘                         │
                                                     ▼
                                           ┌──────────────────┐
                                           │    Gemini API    │
                                           │                  │
                                           │ Reflection       │
                                           │ AI Mirror        │
                                           └──────────────────┘
````

### Request flow

For a journal reflection:

````text
1. User signs in with Google
2. Firebase issues an ID token
3. Browser sends the token to Cloud Run
4. Cloud Run verifies the token server-side
5. The authenticated UID becomes the data boundary
6. Request validation and rate limiting run
7. Gemini processes the journal content server-side
8. The entry and reflection are stored under the verified UID
9. The response is returned to the browser
````

AI Mirror follows the same authentication and rate-limiting boundary, then reads a bounded set of the user's recent entries before sending the analysis request to Gemini.

---

# Technology

| Layer                 | Technology                                  |
| --------------------- | --------------------------------------------|
| Frontend              | Next.js + TypeScript                        |
| UI                    | Tailwind CSS + custom CSS                   |
| Authentication        | Firebase Authentication                     |
| Database              | Cloud Firestore                             |
| AI                    | Gemini API via `@google/genai`              |
| Backend               | Next.js Route Handlers                      |
| Server authentication | Firebase Admin SDK                          |
| Secrets               | Google Cloud Secret Manager                 |
| Hosting               | Google Cloud Run                            |
| Build/deployment      | Cloud Build via Cloud Run source deployment |
| Security testing      | Firebase Emulator + Vitest                  |
| CI                    | GitHub Actions                              |
| Source control        | GitHub                                      |

---

# Security architecture

The project follows a defense-in-depth model.

````text
                    ┌─────────────────────┐
                    │   Untrusted client   │
                    └──────────┬──────────┘
                               │
                         Firebase Auth
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Verified identity   │
                    │       + UID         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Request validation  │
                    │ + rate limiting     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
      ┌───────────────┐                 ┌───────────────┐
      │   Firestore   │                 │    Gemini     │
      │ UID isolation │                 │ server-side   │
      └───────────────┘                 └───────────────┘
````

The project also includes a dedicated threat model documenting the principal threats, trust boundaries, mitigations, and residual risks:

`docs/threat-model.md`

The security constitution used during development is documented in:

`docs/ai-studio-constitution.md`

---

# Security testing

Security behavior is tested separately from normal application functionality.

The Firestore rules test suite verifies:

* authenticated users can access their own journal data
* one authenticated user cannot read another user's journal data
* unauthenticated users cannot access journal data

The tests run against the Firebase Firestore emulator.

Run them with:

````bash
npm run test:security
````

The production API surface was also manually verified to reject unauthenticated requests.

Protected endpoints include:

````text
/api/auth/me
/api/entries
/api/entries/export
/api/mirror
/api/account/delete
````

Unauthenticated requests return:

````text
401 Unauthorized
````

The project also contains a prompt-injection integration test that can execute when `GEMINI_API_KEY` is available in the test environment.

---

# Engineering decisions

Several decisions were made specifically to keep the application suitable for a public Cloud Run deployment.

### Firebase Auth instead of application-managed passwords

Authentication is delegated to Firebase so the application does not need to store or manage passwords.

### UID-based Firestore isolation

The Firebase UID is the canonical ownership boundary. The server obtains it from the verified token rather than accepting a UID from the client.

### Server-side Gemini

The browser never receives the Gemini API key.

### Secret Manager

Production credentials are managed as infrastructure secrets instead of source-code configuration.

### Firestore-backed rate limiting

The first implementation used in-memory counters. That approach was replaced because Cloud Run is horizontally scalable and individual container memory should not be treated as a global security boundary.

The final implementation uses Firestore transactions so the request window is shared across instances.

### Default-deny Firestore rules

Firestore access is denied by default, with only the explicitly supported owner paths allowed.

---

# Project structure

````text
personal-gemini-journal/
│
├── app/
│   ├── journal/
│   ├── history/
│   ├── mirror/
│   ├── api/
│   │   ├── auth/me/
│   │   ├── chat/
│   │   ├── entries/
│   │   │   └── export/
│   │   ├── mirror/
│   │   └── account/delete/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   └── AppHeader.tsx
│
├── lib/
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── firestore.ts
│   ├── gemini.ts
│   └── rate-limit.ts
│
├── tests/
│   ├── firestore.rules.test.ts
│   └── prompt-injection.test.ts
│
├── docs/
│   ├── threat-model.md
│   └── ai-studio-constitution.md
│
├── firestore.rules
├── vitest.config.ts
├── next.config.ts
└── package.json
````

---

# Design system

The interface deliberately follows the feeling of a personal notebook rather than a conventional SaaS dashboard.

The design uses:

* warm paper background
* subtle dot texture
* hand-written typography
* imperfect borders and rotations
* black ink-like outlines
* restrained red and blue accents
* hard, physical button shadows
* white paper cards
* responsive layouts
* touch-friendly controls

The visual language supports the product concept: **a personal reflection OS built around writing and noticing**.

The UI is intentionally human and slightly imperfect while the underlying infrastructure remains structured and security-conscious.

---

# Local development

## Requirements

* Node.js 20+
* npm
* Firebase project
* Gemini API key for AI functionality
* Google Cloud CLI for deployment

## Install

````bash
npm install
````

Create a local `.env.local` containing the Firebase client configuration:

````text
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
````

The Gemini API key should **not** be committed to `.env.local` or source control.

For production, the application reads:

````text
GEMINI_API_KEY
````

from Google Cloud Secret Manager.

## Run locally

````bash
npm run dev
````

## Validate

````bash
npm run lint
````

````bash
npm run build
````

````bash
npm run test:security
````

---

# Deployment

The production application runs on Google Cloud Run in:

````text
asia-south1
````

The Cloud Run service is:

````text
personal-gemini-journal
````

The service runs using a dedicated service account rather than broad default credentials.

The production configuration includes:

* Firebase client configuration as build-time public configuration
* `GEMINI_API_KEY` from Secret Manager
* Firebase Admin authentication
* Firestore access
* unauthenticated Cloud Run ingress with application-level authentication on protected APIs

This distinction is intentional:

**Cloud Run serves the public web application, while sensitive API operations enforce authentication inside the application.**

---

# Continuous integration

GitHub Actions is configured to validate changes pushed to `main` and pull requests targeting `main`.

The CI pipeline runs:

````text
npm ci
   ↓
npm run lint
   ↓
npm run build
   ↓
npm run test:security
````

This provides a basic automated quality gate for source changes before they become production deployments.

---

# Production verification

The deployed application has been verified for the core user and security flows:

* Google authentication
* authenticated journal creation
* Gemini reflection generation
* journal history
* AI Mirror generation
* JSON export
* Settings menu
* sign out
* account deletion
* protected API rejection without authentication
* Firestore security rules
* prompt-injection resistance
* production build
* Cloud Run deployment

---

# Scope and limitations

This is a focused personal journaling application rather than a general-purpose mental-health platform.

AI Mirror:

* does not diagnose mental-health conditions
* does not claim clinical knowledge about the user
* does not invent journal events
* does not treat speculation as fact
* is not a replacement for professional care
* only has access to the journal data supplied to its request

The current rate limiter is an application-level control implemented with Firestore. It is not intended to replace a dedicated edge/WAF solution for large-scale public traffic.

The application is designed for the project's expected scale and challenge requirements rather than internet-scale multi-tenant traffic.

---

# Repository documentation

Additional engineering documentation is available in the repository:

| Document                         | Purpose                                                               |
| --------------------------------- | ----------------------------------------------------------------------- |
| `docs/threat-model.md`           | Threats, trust boundaries, mitigations, and residual risks            |
| `docs/ai-studio-constitution.md` | Security and behavioral constitution used to guide Gemini integration |
| `firestore.rules`                | Production Firestore authorization policy                             |
| `tests/firestore.rules.test.ts`  | Automated user-isolation tests                                        |
| `tests/prompt-injection.test.ts` | Prompt-injection integration test                                     |

---

# Why this project

The interesting part of a journal is not only what was written today.

It is what becomes visible **after enough days have been written down**.

Personal Gemini Journal explores that space between journaling and self-reflection: using Gemini not as an authority, but as a mirror that helps the user notice signals already present in their own words.

**Write. Reflect. Notice.**

---

## Built with

**Next.js · Firebase · Firestore · Gemini · Secret Manager · Cloud Run · TypeScript**

**#AccelerateAIwithCloudRun**
