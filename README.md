# DARKX HUB 🛡️

Ghala la Tools za DarkX — kama Play Store, lakini kwa tools/bots zako zote.
Imejengwa na **MrX Dev**. Data zote zinahifadhiwa kwenye **MongoDB**.

## Muundo wa Files — FLAT (folda moja, hakuna subfolders)

```
darkx-hub/
├── server.js         # Express server + API + MongoDB models
├── package.json
├── .env              # MONGODB_URI + ADMIN_PASSWORD (usiipakie GitHub!)
├── .gitignore
├── index.html        # Homepage
├── upload.html       # Upload panel
├── login.html        # Login/Register
├── my-tools.html     # Tools za mtumiaji
├── tool.html         # Ukurasa wa tool moja
├── admin.html        # Admin panel
├── style.css
├── api.js
├── home.js
├── upload.js
├── login.js
├── my-tools.js
├── tool.js
└── admin.js
```

Files zote za tovuti ziko level moja tu — hakuna folda za `public/`, `css/`, `js/`. Server inatoa kila faili kwa njia salama (whitelist ya routes), hivyo `server.js` na `.env` (zenye siri za MongoDB) **haziwezi kufikiwa na mtu yeyote kwa browser**.

## Features

- Homepage kama Play Store: grid ya tools, search, category filters
- `/upload` — weka tool: jina, namba, download link, preview link, cover link, hadi links 12 za ziada, size, version, maelezo
- `/login` — akaunti ya mtumiaji
- `/my-tools` — tools zako na status yake
- `/tool/:id` — ukurasa kamili wa tool
- `/admin` — password gate (`admin123` default) → dashboard: takwimu, idhinisha/kataa tools, hariri/futa, menage watumiaji
- **MongoDB (Mongoose)** kwa users na tools — si flat-file JSON tena
- Design: Dark Blue theme

## Environment Variables (`.env`)

```
MONGODB_URI=mongodb+srv://mrxdeveloper2_db_user:P0DWc9vFOXICW4aa@cluster0.8n43fok.mongodb.net/darkxhub?appName=Cluster0
ADMIN_PASSWORD=admin123
PORT=3000
```

⚠️ **Muhimu sana kuhusu usalama**: `.env` yako ina password ya MongoDB ndani yake. Faili hii haipaswi kupandishwa GitHub kamwe — `.gitignore` tayari imeizuia. Ukiipoteza au kuishare hadharani, nenda MongoDB Atlas → Database Access → badilisha password ya user `mrxdeveloper2_db_user` mara moja.

## Jinsi ya Kuendesha (Local)

```bash
cd darkx-hub
npm install
npm start
```

Site itapatikana kwenye `http://localhost:3000`. Ukiona "✅ MongoDB imeunganishwa" kwenye console, database iko tayari.

## Kubadilisha Admin Password

Badilisha thamani ya `ADMIN_PASSWORD` kwenye `.env`, au kwenye Render Environment Variables.

## Deploy kwenye Render

1. Panda code kwenye GitHub repo (HAKIKISHA `.env` haipo kwenye commit — `.gitignore` inaishughulikia)
2. Render → New → Web Service → unganisha repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Kwenye Render → Environment, ongeza:
   - `MONGODB_URI` = connection string yako
   - `ADMIN_PASSWORD` = password yako ya admin
6. Kwenye **MongoDB Atlas → Network Access**, ruhusu `0.0.0.0/0` (au IP ya Render) ili server iweze kuunganisha na database kutoka mtandaoni

Kwa sababu data sasa iko MongoDB (siyo flat JSON), hujahitaji tena persistent disk — data itadumu hata baada ya deploy mpya au restart kwenye Render.

## Mtiririko wa Tool Mpya

1. Mtumiaji anajisajili/anaingia kwenye `/login`
2. Anaenda `/upload` na kujaza fomu
3. Tool inaingia hali ya **pending**
4. Admin (`/admin`) anaidhinisha au kukataa kwenye tab "Zinazosubiri"
5. Tool iliyoidhinishwa inaonekana hadharani kwenye homepage
