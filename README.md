# Notable Amplify Portal

Internal CRM and client management portal for DakJen Creative LLC / GoBeNotable.

## Stack
- React 18
- React Router v6
- Lucide React (icons)
- No backend yet — state is in-memory (React Context). Data resets on refresh until a backend is connected.

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm start
# Opens at http://localhost:3000

# Build for production
npm run build
```

## Deploying

### Netlify (easiest)
1. Run `npm run build`
2. Drag the `build/` folder into [netlify.com/drop](https://app.netlify.com/drop)
3. Done — you get a live URL instantly

### Vercel
```bash
npm install -g vercel
vercel
```

### Any static host
Upload the contents of the `build/` folder to any web server (S3, GitHub Pages, Cloudflare Pages, etc.)

> **Note:** Since this uses React Router, add a redirect rule so all routes serve `index.html`.
> - Netlify: create `public/_redirects` with `/* /index.html 200`
> - Vercel: handled automatically

## Adding a Backend (Phase 2)

Current state lives in React Context (`src/context/AppContext.jsx`) — easy to swap for API calls.

Recommended stack for persistence:
- **Supabase** (free tier, Postgres + auth) — swap `useState` for Supabase queries
- **Firebase** — same approach with Firestore
- **Custom Node/Express API** — replace context functions with `fetch()` calls

## Structure

```
src/
  components/     # Reusable UI (Modal, AddClientModal, SendDocModal, Sidebar)
  context/        # AppContext — global state (clients, documents)
  data/           # Constants (tiers, stages, helpers)
  pages/          # Route-level pages (Dashboard, Pipeline, Clients, etc.)
  index.css       # All styles (CSS custom properties + Notable brand)
```

## Planned Features (Phase 2)
- [ ] Persistent backend (Supabase or Firebase)
- [ ] Client-facing portal (separate login for clients to sign/approve)
- [ ] Document generation (auto-generate proposals/contracts from client data)
- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] Team member accounts with permissions

---
*DakJen Creative LLC · admin@gobenotable.com · gobenotable.com*
