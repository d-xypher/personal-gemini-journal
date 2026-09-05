# ADR-0001: Application Architecture and Security Boundaries

- **Status:** Accepted
- **Date:** 2026-09-06
- **Decision type:** Architecture and security

## Context

Personal Gemini Journal is a private, authenticated journaling application that uses Gemini to generate reflections and identify patterns across a user's recent journal entries.

The application needs to:

- provide a simple web interface
- authenticate users securely
- keep journal data isolated between users
- call Gemini without exposing API credentials to the browser
- run as a publicly accessible Cloud Run application
- protect AI endpoints from unauthenticated and excessive requests
- provide user-controlled data export and account deletion
- remain simple enough to operate at the expected scale of the project

Because journal entries may contain sensitive personal information, the authentication, data-access, secret-management, and AI-processing boundaries are treated as first-class architectural concerns.

## Decisions

### 1. Use Next.js for the application

The application uses Next.js with TypeScript for both the web interface and backend route handlers.

This keeps the frontend and authenticated server-side API in one deployable application while allowing sensitive operations to remain on the server.

### 2. Deploy the application to Google Cloud Run

The application is deployed as a public Cloud Run service.

Cloud Run provides the managed container runtime required for the project while allowing the application itself to enforce authentication on protected API routes.

Public Cloud Run ingress is therefore not treated as authorization.

The browser can access the application, but protected operations independently verify Firebase authentication.

### 3. Use Firebase Authentication for identity

Google Sign-In through Firebase Authentication is used instead of implementing application-managed passwords.

The browser obtains a Firebase ID token after authentication.

Protected server routes verify that token using the Firebase Admin SDK.

The server derives the user's UID from the verified token rather than trusting a UID supplied by the client.

### 4. Use Firebase UID as the data ownership boundary

Journal data is stored under:

```text
users/{uid}/entries/{entryId}
```

and related user-owned collections.

Firestore security rules use the authenticated Firebase UID to enforce ownership.

The rules use a default-deny model and explicitly permit access only when the authenticated UID matches the requested user document.

This creates a consistent ownership boundary across the browser, backend, and database.

### 5. Use Firestore for journal data and application rate limits

Cloud Firestore is used for persistent journal data because it integrates naturally with Firebase Authentication and provides a managed document database.

Firestore is also used for the application's rate limiter.

The rate limiter initially used in-memory counters, but that approach was replaced because Cloud Run can run multiple instances and instance-local memory cannot provide a shared request limit.

The final implementation uses Firestore transactions to maintain a per-user request window.

The current policy is 10 requests per minute for the protected AI operations.

### 6. Keep Gemini access server-side

The browser never calls Gemini directly.

Gemini requests are made from the Cloud Run backend after authentication and request validation.

This prevents the Gemini API credential from becoming part of the browser's runtime environment.

### 7. Store the Gemini credential in Secret Manager

The Gemini API key is stored in Google Cloud Secret Manager.

The Cloud Run service uses a dedicated service account with access to the required secret.

The key is therefore separated from application source code and is not committed to the repository.

### 8. Treat journal content as untrusted input

Journal text is user-controlled data and must not be treated as system-level instructions.

The Gemini system instruction explicitly establishes this boundary and instructs the model to ignore journal content that attempts to:

* override system instructions
* reveal credentials or secrets
* expose internal configuration
* change application behavior
* reveal system instructions

The application also instructs Gemini to remain grounded in the supplied journal content and distinguish observations from interpretations.

### 9. Provide export and account deletion

Users can export their journal entries and generated reflections as JSON.

Users can also permanently delete their account from Settings.

Account deletion removes the application's known user-owned data, rate-limit records, and Firebase Authentication account.

These capabilities make user data portability and deletion explicit product features rather than administrative operations.

## Consequences

### Positive

* Authentication is delegated to a mature identity platform.
* Client-provided UIDs are not trusted for authorization.
* Firestore rules provide an independent database-level authorization boundary.
* Gemini credentials remain server-side.
* Production secrets are managed outside source control.
* Rate limiting is shared across Cloud Run instances.
* AI endpoints are protected by authentication and request limits.
* Users can export and delete their data.
* The architecture remains small enough to understand and operate for the project's expected scale.

### Trade-offs

* The application depends on Firebase and Google Cloud services.
* Firestore-backed rate limiting introduces database reads/writes for protected AI requests.
* A public Cloud Run service still requires application-level authorization for sensitive routes.
* The account deletion flow covers the application's known data model; future user-owned collections would need to be included explicitly.
* The current rate limiter is appropriate for the expected scale but is not a replacement for dedicated edge protection or WAF infrastructure at internet scale.

## Alternatives considered

### Client-side Gemini API calls

Rejected because exposing the Gemini credential to the browser would make the key accessible to clients.

### Application-managed authentication

Rejected because it would introduce unnecessary password storage and authentication lifecycle responsibilities.

### In-memory rate limiting

Rejected because limits would be isolated to individual Cloud Run instances.

### Dedicated Redis rate limiting

Not selected because the application's expected scale does not justify the additional infrastructure and operational complexity.

### Cloud Armor / dedicated WAF

Not selected as a required application component because the project is operating at small expected traffic volumes. The application still performs its own authentication, validation, and rate limiting.

## Related documentation

* `docs/threat-model.md`
* `docs/ai-studio-constitution.md`
* `firestore.rules`
* `tests/firestore.rules.test.ts`
* `tests/prompt-injection.test.ts`
