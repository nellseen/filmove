# PROMPT.md — Project Rules & Build Instructions

> **Project:** Telegram Link Catalog  
> **Stack:** React + TypeScript, Node.js + TypeScript, Firebase  
> **Purpose:** Admin pastes a public Telegram post URL. The app extracts available post metadata, shows an editable preview, and publishes a clean content card. The **Watch Now** action opens the original Telegram post. The app does not download, re-host, or stream video files.

---

## 1. Non-negotiable project rules

Treat every rule in this document as mandatory. Do not silently skip, weaken, reinterpret, or replace a requirement. If a requirement cannot be met, explain the blocker and propose the smallest compliant alternative before proceeding.

1. **Do not build video hosting.** Never download Telegram media, proxy media bytes, upload video files, or introduce video storage/CDN functionality. No Firebase Storage is required for this product.
2. **Preserve the original destination.** “Watch Now” must open the exact validated Telegram post URL supplied for that item. Do not redirect through unrelated pages, change the channel/post ID, or silently substitute another URL.
3. **Metadata is best-effort, never fabricated.** Show only information actually obtained from a supported source or entered/confirmed by an admin. If title, caption, thumbnail, channel name, or date is unavailable, show a graceful fallback or let the admin provide it. Never invent a thumbnail or claim metadata was fetched when it was not.
4. **Public post scope only.** Support public Telegram post links in the form `https://t.me/<public_channel>/<message_id>`. Reject private invite links, `tg://` links, usernames without a post ID, unrelated domains, malformed IDs, and unsupported URL forms with a useful error.
5. **Respect access and rights.** Do not bypass Telegram access controls, authentication, rate limits, anti-bot protections, or content restrictions. Do not scrape private content. Only publish posts the administrator is authorized to feature. The app stores post metadata and the original URL, not the video itself.
6. **No fragile assumptions about Telegram HTML.** Telegram preview markup and metadata may change. Encapsulate metadata extraction behind a provider interface, add timeouts, validation, rate limiting, caching, and clear failure states. Do not make the UI depend on undocumented HTML selectors.
7. **Use Firebase as the database/platform.** Use Firebase Authentication for admin identity and Cloud Firestore for application data. Use Firebase Admin SDK only on the Node.js server. Never expose service-account credentials or Admin SDK secrets to the browser.
8. **All UI must use custom reusable components.** Do not use raw browser `alert`, `confirm`, or `prompt`; do not scatter one-off styling; do not use unstyled native controls. Build a small design system and use it consistently.
9. **Minimalist, clean design only.** Prioritize whitespace, clear hierarchy, restrained color, readable typography, subtle borders, and responsive layouts. Avoid gradients, glassmorphism, excessive shadows, noisy decoration, oversized marketing copy, and unnecessary animation.
10. **TypeScript throughout.** Enable strict TypeScript for frontend and backend. Avoid `any`; use `unknown` and narrow types where necessary.
11. **Validate at every boundary.** Validate URLs, request bodies, Firestore documents, environment variables, and external metadata with schemas (prefer Zod or an equivalent).
12. **Security is not optional.** Apply least privilege, secure headers, safe external links, output escaping, rate limits, input size limits, and restrictive Firestore Security Rules. Never trust client-supplied admin roles.
13. **Tests are required.** Follow the complete quality pipeline in Section 9. Do not mark a stage as passed unless it was actually run and passed. If a tool is unavailable, record it as blocked—not passed.
14. **No fake completion.** Do not leave non-functional buttons, placeholder API success responses, mocked production behavior, TODOs in critical paths, or hard-coded sample data in production flows.
15. **Keep scope focused.** Do not add accounts for public visitors, comments, likes, playlists, recommendations, analytics dashboards, subscriptions, or video playback unless explicitly requested.

## 2. Product requirements

### Public visitor experience
- Responsive homepage with a clean grid/list of published Telegram post cards.
- Each card shows:
  - Thumbnail when available; otherwise a designed neutral placeholder.
  - Admin-confirmed title, or a sensible caption excerpt if no title exists.
  - Channel name when available.
  - Short caption/description when available.
  - Optional published date when reliably available.
  - A prominent **Tonton Sekarang** / **Watch Now** action.
- Clicking Watch Now opens the exact original Telegram post in a new tab using `target="_blank"` and `rel="noopener noreferrer"`.
- Card content must remain readable and useful when the thumbnail or metadata is missing.
- Provide loading, empty, error, and pagination states.
- Public visitors can read published records only. They cannot create, edit, delete, or publish records.

### Admin experience
- Admin signs in using Firebase Authentication.
- Admin-only dashboard supports:
  - Paste a Telegram public post URL.
  - Fetch metadata and display an editable preview.
  - Edit title, caption/description, channel label, and thumbnail URL when needed.
  - Save as draft.
  - Publish, unpublish, edit, and delete records.
  - Search/filter records by status or title.
- The preview must clearly distinguish fetched values from admin-edited values.
- Before publishing, require a valid Telegram URL and a non-empty title. Thumbnail is optional.
- Show clear extraction failures and allow manual metadata entry without pretending extraction succeeded.
- Destructive actions require a custom confirmation dialog.

## 3. Technology and architecture

### Frontend
- React + TypeScript.
- Vite is the default build tool unless the existing repository already uses another supported React setup.
- React Router for routing.
- Tailwind CSS for styling.
- Custom component library built in-project. shadcn/ui may be used as a primitive/reference source, but all visible product components must be wrapped, themed, and composed as project-owned custom components.
- TanStack Query (or a clearly documented equivalent) for server state.
- React Hook Form + Zod (or equivalent) for forms and validation.

### Backend
- Node.js + TypeScript.
- Express (or Fastify if already established in the repository).
- REST API under `/api/v1`.
- Zod schemas shared where practical between frontend and backend.
- Firebase Admin SDK for server-side Firestore access and token verification.
- Structured logs; never log secrets, ID tokens, or full sensitive headers.

### Firebase
- Firebase Authentication: admin sign-in.
- Cloud Firestore: post records and admin roles.
- Firebase App Check: enable where supported and appropriate.
- Firestore Security Rules: deny client writes by default; public clients may read only published, public-safe fields if direct client reads are used. Prefer serving public data through a controlled API if that simplifies security.
- Admin writes must go through the Node.js API after Firebase ID-token verification and server-side role authorization.
- Admin roles must be provisioned through a trusted server/admin process, never self-assigned by the client.
- No Firebase Storage in the initial scope.

### Suggested data model

`posts/{postId}`:
```ts
type PostStatus = "draft" | "published" | "archived";

interface TelegramPost {
  id: string;
  sourceUrl: string;              // canonical validated https://t.me/<channel>/<messageId>
  channelUsername: string;
  messageId: number;
  title: string;                  // required before publish
  description: string | null;
  thumbnailUrl: string | null;    // external URL only; no media upload
  publishedAtSource: string | null;
  metadataSource: "telegram-preview" | "manual" | "mixed";
  status: PostStatus;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;
  updatedBy: string;
}
```

Store timestamps as Firestore Timestamp values. Validate and normalize all external URLs. Consider storing a metadata-fetch timestamp and extraction status in a separate internal field if operationally useful; do not expose internal diagnostics publicly.

`admins/{uid}`:
```ts
interface AdminProfile {
  role: "admin";
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

Never accept `createdBy`, `updatedBy`, `role`, or status transitions as trusted values from the browser without server-side authorization and assignment.

## 4. Telegram URL validation and metadata extraction

### Accepted URL
- HTTPS only.
- Host must be exactly `t.me` (optionally support `www.t.me` only if explicitly tested and normalized).
- Path must contain exactly a public channel username and positive numeric message ID: `/<username>/<messageId>`.
- Reject query strings/fragments unless they are explicitly allowlisted and safely normalized.
- Reject private invite links such as `t.me/+...` and `joinchat`.
- Reject lookalike domains such as `t.me.example.com`.

### Metadata provider
Implement an interface such as:
```ts
interface TelegramMetadataProvider {
  fetch(url: ValidatedTelegramPostUrl): Promise<TelegramMetadataResult>;
}
```

The provider must:
- Use a documented/publicly accessible preview mechanism where possible.
- Set a short timeout and bounded response size.
- Validate response content type and parse defensively.
- Extract only fields that are actually present: title/caption, channel label, thumbnail URL, and post date if available.
- Treat remote HTML and metadata as untrusted input.
- Never execute remote scripts or render remote HTML directly.
- Never fetch or download the video file.
- Never bypass bot checks, authentication, rate limits, or access controls.
- Cache successful and failed lookups for a reasonable period to avoid repeated requests.
- Return typed partial results; missing fields are normal.
- Include an explicit result status such as `complete`, `partial`, or `unavailable`.

If a supported metadata method cannot reliably provide a thumbnail, allow the admin to enter a valid HTTPS thumbnail URL manually. Do not store a Telegram video file as a thumbnail.

### Thumbnail safety
- Permit only HTTPS URLs.
- Block localhost, private IP ranges, link-local addresses, and unsupported protocols if the server fetches/validates remote image URLs.
- Prefer rendering an image URL directly with a safe fallback; do not create an unrestricted server-side URL proxy.
- Add `referrerPolicy="no-referrer"` where appropriate.
- Use lazy loading and fixed aspect-ratio containers to prevent layout shifts.
- Handle broken images with a neutral custom placeholder.

## 5. API contract

Suggested endpoints:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/posts` | Public | List published posts with pagination |
| `GET` | `/api/v1/posts/:id` | Public | Read one published post |
| `POST` | `/api/v1/admin/telegram/preview` | Admin | Validate URL and fetch best-effort metadata |
| `POST` | `/api/v1/admin/posts` | Admin | Create draft |
| `PATCH` | `/api/v1/admin/posts/:id` | Admin | Edit draft/published post |
| `POST` | `/api/v1/admin/posts/:id/publish` | Admin | Publish after validation |
| `POST` | `/api/v1/admin/posts/:id/unpublish` | Admin | Unpublish |
| `DELETE` | `/api/v1/admin/posts/:id` | Admin | Delete post |

API rules:
- Use consistent response envelopes and typed error codes.
- Validate every request and response.
- Paginate public lists; do not return the entire collection.
- Apply rate limits to metadata preview and admin mutation endpoints.
- Verify Firebase ID tokens on protected routes.
- Check admin role and active status from trusted server-side data.
- Avoid leaking Firestore paths, stack traces, secrets, or provider internals.
- Use idempotency or safe duplicate detection for repeated source URLs.
- Return partial metadata instead of failing the entire preview when only one field is unavailable.

## 6. Custom design system and UI rules

Build and use project-owned components, at minimum:

- `AppShell`
- `SiteHeader`
- `PageContainer`
- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Field`
- `Card`
- `Badge`
- `Dialog`
- `DropdownMenu`
- `Skeleton`
- `EmptyState`
- `ErrorState`
- `Toast`
- `Pagination`
- `PostCard`
- `PostGrid`
- `Thumbnail`
- `AdminSidebar`
- `MetadataPreview`
- `StatusBadge`

### Visual direction
- Minimalist, clean, editorial/content-catalog feel.
- Neutral base palette: off-white/light background, white surfaces, charcoal text, muted gray borders.
- One restrained accent color for primary actions.
- Use consistent spacing scale, radius scale, typography scale, and icon size.
- Thin borders over heavy shadows.
- Avoid gradients, neon colors, glass effects, decorative blobs, excessive rounded pills, and unnecessary motion.
- Use clear focus states and accessible contrast.
- Use a consistent thumbnail ratio (16:9) and predictable card layout.
- Mobile-first responsive behavior; admin forms must remain usable on narrow screens.
- Do not use emoji as interface icons. Use one consistent icon library.
- Do not create a different visual style for each page.

### Component implementation rules
- Every visible control must be a reusable custom component or a composition of custom components.
- Define component variants centrally (e.g. primary, secondary, ghost, destructive).
- Do not duplicate styling strings across pages; use shared tokens and component variants.
- Components must support disabled, loading, error, focus, and responsive states where relevant.
- Use semantic HTML and accessible labels.
- No clickable `div` when a button or link is appropriate.
- All external links must have safe `target` and `rel` attributes.

## 7. Suggested project structure

```text
telegram-link-catalog/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   └── posts/
│   │   │   ├── features/
│   │   │   │   ├── public-posts/
│   │   │   │   └── admin/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── routes/
│   │   │   ├── styles/
│   │   │   └── types/
│   │   └── ...
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── posts/
│       │   │   └── telegram/
│       │   ├── providers/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── validators/
│       │   └── server.ts
│       └── ...
├── packages/
│   └── shared/
│       ├── schemas/
│       ├── types/
│       └── ...
├── tests/
│   ├── contract/
│   ├── e2e/
│   ├── integration/
│   └── mutation/
├── docs/
├── .env.example
├── prompt.md
└── desain.md
```

Adjust to the repository if it already has a sound structure; do not reorganize blindly.

## 8. Environment variables

Create `.env.example` with names and safe placeholders only. Never commit real secrets.

Frontend:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_BASE_URL`

Backend:
- `FIREBASE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (local path only; never commit the file)
- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `ADMIN_BOOTSTRAP_UID` (optional one-time provisioning process; do not expose to client)

Use the hosting platform's secret manager or workload identity in production. Never place Firebase Admin credentials in Vite variables.

## 9. Mandatory quality pipeline

Run the stages in this exact order. A stage may run only after the previous stage passes, except when documenting an intentional independent diagnostic. Record command, result, and any failure in the project README or CI output.

```text
Nulis Kode
   ↓
[ Static Test ]
   ↓
[ Unit Test ]
   ↓
[ Mutation Test ]
   ↓
[ Component / Visual ]
   ↓
[ Contract Test ]
   ↓
[ Integration ]
   ↓
[ E2E Test ]
   ↓
[ Security Test ]
   ↓
[ Load Test ]
```

### Stage requirements and suggested tools

1. **Static Test**
   - TypeScript strict type-check (`tsc --noEmit`).
   - ESLint.
   - Formatting check (Prettier).
   - Fail on type errors, lint errors, or formatting violations.

2. **Unit Test**
   - Vitest or Jest.
   - Test URL validation, canonicalization, metadata parsing, schema validation, pagination, authorization helpers, and UI utility functions.
   - Include positive, negative, boundary, and missing-metadata cases.

3. **Mutation Test**
   - StrykerJS for TypeScript/JavaScript.
   - Run against critical pure logic: Telegram URL validator, authorization checks, publish validation, and metadata normalization.
   - Set a documented mutation score threshold (initial target: 70% for critical modules); explain excluded mutants. Do not claim mutation testing happened if Stryker was not run.

4. **Component / Visual**
   - Storybook for component states.
   - Playwright component tests or the selected Storybook test runner.
   - Chromatic is optional for visual regression; if used, configure a baseline and review diffs.
   - Cover default, loading, disabled, error, empty, long-text, missing-thumbnail, and mobile states.

5. **Contract Test**
   - Pact or schema-driven contract tests.
   - Verify frontend expectations against API request/response schemas.
   - Include success, validation error, unauthorized, forbidden, not found, rate-limited, and partial metadata responses.

6. **Integration**
   - Use Firebase Emulator Suite for Auth and Firestore tests.
   - Test API-to-Firestore create/read/update/publish/unpublish flows.
   - Test token verification and role enforcement.
   - Mock external Telegram preview responses; do not depend on Telegram availability for deterministic tests.

7. **E2E**
   - Playwright or Cypress; prefer Playwright unless the repository already standardizes on Cypress.
   - Test admin login, paste URL, preview, edit metadata, save draft, publish, public listing, and Watch Now destination.
   - Test invalid/private links, duplicate links, missing thumbnail, extraction failure, and mobile layout.
   - Use isolated test data and Firebase emulators where possible.

8. **Security**
   - `npm audit` (or `pnpm audit`) and optionally Snyk.
   - Check Firestore Security Rules with emulator tests.
   - Test unauthorized admin routes, privilege escalation attempts, XSS payloads in captions, unsafe URLs, SSRF protections, CORS, rate limits, and security headers.
   - Fix high/critical vulnerabilities or document a justified exception with owner and mitigation.
   - Never run destructive security tests against production.

9. **Load**
   - k6 or JMeter.
   - Test public list/detail endpoints and metadata preview rate limiting.
   - Include realistic read-heavy traffic and bursts.
   - Establish baseline targets before testing; report p50/p95 latency, error rate, throughput, and resource usage.
   - Do not load-test Telegram itself. Mock or stub the external metadata provider.
   - Do not claim capacity based on an unrun test.

### CI gate
- Add a CI workflow that runs the stages in the required order.
- Fail the pipeline when a required stage fails.
- Mutation and load tests may run in dedicated jobs if runtime requires it, but the final quality report must show their actual status.
- Use explicit statuses: `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`.
- Never convert `BLOCKED` or `NOT RUN` into `PASS`.

## 10. Definition of Done

The project is complete only when:
- Admin authentication and server-side authorization work.
- Admin can paste a valid public Telegram post URL.
- Metadata preview returns real, best-effort data or an honest partial/unavailable state.
- Admin can edit metadata and save a draft.
- Admin can publish and unpublish posts.
- Public pages show published posts only.
- Thumbnail fallback works.
- Watch Now opens the exact original Telegram post.
- No video file is downloaded, stored, proxied, or streamed by the app.
- Responsive and accessible custom components are used consistently.
- Firestore rules and API authorization are tested.
- All nine quality pipeline stages have recorded statuses; no stage is falsely marked as passed.
- README explains local setup, Firebase Emulator setup, environment variables, deployment, and test commands.

## 11. Working instructions for the coding agent

Before writing code:
1. Inspect the repository and report the existing stack and structure.
2. Identify missing requirements and potential integration risks.
3. Present a concise implementation plan.
4. Do not overwrite existing working configuration without explaining why.

While implementing:
- Work in small, verifiable steps.
- Keep frontend, backend, and shared schemas type-safe.
- Add tests alongside each feature.
- Prefer simple, maintainable solutions over abstractions without clear value.
- Do not invent Firebase project credentials or Telegram API access.
- If Telegram metadata extraction is unreliable in the current environment, implement the provider interface and manual fallback; document the limitation honestly.

At completion:
- Summarize files changed and features implemented.
- List exact commands run and actual results for each quality stage.
- List required environment variables and manual Firebase setup steps.
- Explicitly list anything blocked or not implemented.
