# LotusTank — Brand Website

Premium yoga tank tops designed for hot yoga and vinyasa flow.

> **Tagline:** *Rooted in Practice. Flow in Motion.*

This is the official LotusTank brand website — a single-page landing page with email waitlist capture, product showcase, brand story, and subscription teaser.

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (check with `node -v`)
- **npm** (comes with Node.js)

### Run Locally

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```

The site will be available at **http://localhost:3001**

To run on a custom port:
```bash
PORT=8080 npm start
```

---

## Project Structure

```
website/
├── index.html              # Main landing page
├── css/
│   └── style.css           # Brand stylesheet
├── js/
│   └── main.js             # Frontend JavaScript (form handling, animations)
├── images/
│   ├── hero.jpg            # Hero section image
│   ├── logo.png            # LotusTank logo
│   └── product-mockup.png  # Product visualization
├── data/
│   └── waitlist.json       # Email signup data (auto-created)
├── server/
│   ├── server.js           # Express API + static file server
│   ├── package.json        # Node.js package manifest
│   └── node_modules/       # Dependencies (install with npm install)
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/waitlist` | Join the waitlist — accepts `{ email: string }` |
| `GET` | `/api/waitlist/count` | Returns total signup count |
| `GET` | `/api/health` | Health check |

### POST /api/waitlist Example

```bash
curl -X POST http://localhost:3001/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "yogi@example.com"}'
```

Response:
```json
{
  "success": true,
  "message": "You're on the list! We'll let you know when we launch. 🧘",
  "total": 42
}
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Static + Serverless)

**Note:** This project uses an Express server, so it works best as a full Node app. For Vercel:

1. Push the repo to GitHub
2. Import into Vercel
3. Set **Root Directory** to `server/`
4. Set **Build Command** to `npm install`
5. Set **Output Directory** to `..` (to serve static files from parent)
6. Framework preset: **Node.js** / **Express**

Or use Vercel's `vercel.json` configuration. A sample `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/server.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

### Option 2: Netlify

1. Push the repo to GitHub
2. Import into Netlify
3. **Build command:** `cd server && npm install`
4. **Publish directory:** `.`
5. Add a `netlify.toml`:

```toml
[build]
  command = "cd server && npm install"
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "http://localhost:3001/api/:splat"
  status = 200
```

For full Express support on Netlify, use Netlify Functions or deploy as a full Node app on a VPS.

### Option 3: Simple VPS (DigitalOcean, Linode, AWS EC2)

```bash
# Clone the repo on your server
git clone <repo-url> /opt/lotustank
cd /opt/lotustank/server
npm install --production

# Run with process manager (pm2)
npm install -g pm2
pm2 start server.js --name lotustank

# Set up nginx reverse proxy (recommended)
```

**Nginx config example:**

```nginx
server {
    listen 80;
    server_name lotustank.co www.lotustank.co;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 4: Render / Railway

Platforms like [Render](https://render.com) and [Railway](https://railway.app) support Node.js apps natively:

1. Connect your GitHub repo
2. Set **Start Command** to `cd server && npm install && npm start`
3. Set environment variable `PORT` to `10000` (or their default)
4. Deploy

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the server listens on |

---

## Mailchimp Integration

To swap from the built-in API to Mailchimp:

1. Create a [Mailchimp](https://mailchimp.com) account
2. Go to **Audience** → **Signup Forms** → **Embedded Forms**
3. Copy the form action URL (looks like `https://...us18.list-manage.com/subscribe/post?u=...&id=...`)
4. Update the form handler in `js/main.js` — replace the `fetch()` call with a POST to the Mailchimp URL
5. (Optional) Disable the Express API or keep both running

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no framework)
- **Backend:** Node.js, Express.js
- **Fonts:** Google Fonts — Playfair Display (headings), Inter (body)
- **Storage:** JSON file (easy to migrate to any service later)
- **Deployment:** Compatible with Vercel, Netlify, Render, Railway, or any VPS

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary (Sage Green)** | `#5B7B5E` |
| **Accent (Terracotta)** | `#C16E4E` |
| **Premium (Soft Gold)** | `#D4AF37` |
| **Background (Warm Cream)** | `#F5F0E8` |
| **Text (Charcoal)** | `#333333` |
| **Headings Font** | Playfair Display |
| **Body Font** | Inter |
| **Tagline** | *Rooted in Practice. Flow in Motion.* |

---

## License

UNLICENSED — Proprietary. All rights reserved.