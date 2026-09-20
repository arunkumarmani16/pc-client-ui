# client-ui: Pregnancy Care patient portal

The patient-facing half of Pregnancy Care. It uses the same stack and conventions as the staff console in `../pc-ui` (Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui on Base UI, zustand, axios) and talks to the same Spring Boot API in `../pc-api`.

## Running it

1. Start the API (`../pc-api`) on `http://localhost:8080`.
2. `npm install`
3. `npm run dev`, then open http://localhost:3001

It runs on port 3001 so it can sit beside the staff console on 3000.

Configuration lives in `.env`:

| Variable       | Default                     | Notes                                                    |
| -------------- | --------------------------- | -------------------------------------------------------- |
| `API_BASE_URL` | `http://localhost:8080/api` | Server-only. Include the API's `/api` context path.      |
| `BHASHINI_USER_ID`      | unset                      | Server-only. Bhashini ULCA user id, for Tamil translation of guidance. |
| `BHASHINI_ULCA_API_KEY` | unset                      | Server-only. Bhashini ULCA API key. Without both, guidance stays in English. |
| `BHASHINI_PIPELINE_ID`  | `64392f96daac500b55c543cd` | MeitY's pipeline, which serves AI4Bharat IndicTrans2. |
| `TRANSLATION_ENABLED`   | `true`                     | `false` turns machine translation off without removing the keys. |

## Tamil

A language button in the header switches between English and தமிழ் and remembers the choice in the `portal_language` cookie (`app/api/language`).

- **The app's own words** (menus, headings, topic names) are translated by hand in `lib/strings.ts`.
- **Guidance** is written by the clinic in English and machine-translated on the server with [AI4Bharat IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) through Bhashini (`lib/translation/`). It is sent sentence by sentence, with the HTML tags of a body left as they are. Translations are cached in memory, so a restart loses them. If a call fails, the piece is shown in English with a note, and a translated piece says it was translated automatically.

## How it talks to the API

This app talks only to the API's **`/portal/**`** routes, which exist for it. The staff console's routes (`/patients`, `/content`, ...) are `ROLE_STAFF` and answer this app's tokens with a refusal.

- **Sign in.** The form posts to `app/api/auth/login`, which calls `POST /portal/login` and stores the token in the httpOnly `patient_access_token` cookie. Client script never sees the token.
- **Server components** call the API directly and pass the token as a bearer header, via `requireAuthConfig()` and `requireSession()` in `lib/auth/session.ts`.
- **Browser calls** go to same-origin `/api/backend/*`. `proxy.ts` rewrites them to the API and attaches the token, so the API needs no CORS entry for this app. The shared axios client in `service/http-client.ts` picks the right base URL for each side.
- **Page gating.** `proxy.ts` sends visitors without the cookie to `/login`. `requireSession()` reads `GET /portal/me` on every request and signs out a rejected, deleted or lapsed session.

The endpoints this app uses:

| Call                                            | What it is                                                    |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `POST /portal/login`                            | Sign in. The only one that works without a token.             |
| `GET /portal/me`                                | The signed-in mother's own record.                             |
| `GET /portal/content?week=&type=&category=`     | A week of published guidance. Defaults to the week she is in. |
| `GET /portal/content/{id}`                      | One published piece.                                           |
| `GET /portal/content/{id}/videos/{vid}/stream`  | A video held on the API's own disk.                            |

None of them takes a patient id: the API resolves the caller from the token, so there is no id for one mother to swap for another's.

### Two separate tokens

The portal's tokens are signed with a **different key** from the console's (`app.jwt.patient-secret` against `app.jwt.secret`). Neither verifies as the other, so a portal token cannot be replayed against a staff endpoint even if it leaks — the signature fails before any role check is reached.

The cookie is likewise deliberately not called `access_token` (the console's name). Cookies are shared across ports on the same host, so the two apps would keep signing each other out.

## Layout

```
app/                  routes: (auth)/login,
                      (protected)/{home, guidance, guidance/[contentId], profile},
                      api/auth/{login,logout}
components/ui/        shadcn primitives (add more with `npx shadcn add <name>`)
components/global/    app-wide pieces: header, nav, account menu, loading overlay, page header
components/content/   the guidance feed: card, video player, do/avoid lists
interface/            API request and response types
service/              axios client, plus one module per API resource
lib/                  API config, auth contract and session, loading store, formatting,
                      content presentation (category colours, text previews)
proxy.ts              auth redirects and the /api/backend rewrite
```

The three destinations are Home, Guidance and My details — shown as links in the header from `sm` up, and as a bottom tab bar on a phone.

The theme tokens in `app/globals.css` are shared with `../pc-ui/app/globals.css`; keep the two in step.

## Scripts

`npm run dev`, `npm run build`, `npm start`, `npm run lint`
