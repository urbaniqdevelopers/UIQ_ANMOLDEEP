# UrbanIQ Anmoldeep: website + admin + backend

```
index.html            public website (scroll animations, 3D estate, Explore mode)
admin/index.html      admin panel  ->  yourdomain.com/admin/
assets/               images, css, js (scene.js = 3D, app.js = page + music)
assets/models/        optional .glb mansion models (see below)
server/server.js      backend (Node 18+, no npm install needed)
server/data/          enquiries + admin login live here (back this folder up)
```

## Run locally
```
node server/server.js
```
Open http://localhost:3000 and http://localhost:3000/admin/. On first run the terminal prints the admin username and a random password. To choose your own, copy `server/.env.example` to `server/.env` and set `ADMIN_USER` / `ADMIN_PASS` before the first run. You can change the login later in Admin > Settings.

## Host on your domain (VPS, e.g. Ubuntu)
1. Install Node 18+ (`sudo apt install nodejs` or use nvm). Upload this whole folder, e.g. to `/var/www/anmoldeep`.
2. Keep it running: `npm i -g pm2 && pm2 start server/server.js --name anmoldeep && pm2 save && pm2 startup`
3. Put nginx in front for HTTPS (`sudo certbot --nginx -d yourdomain.com`):
```
server {
  server_name yourdomain.com;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host;
               proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; }
}
```
4. In `server/.env` set `TRUST_PROXY=1` and `COOKIE_SECURE=1`.
Shared hosting with "Setup Node.js App" (cPanel/Hostinger): set the app root to this folder, startup file `server/server.js`.
Static-only hosting also works for the public site (the form then shows a "call us" message), but enquiries and the admin need the Node server.

## What the admin can do
Enquiries (search, status, notes, delete, CSV export), plot availability (Available / Booked / Sold shown on the website), phone number, change login.

## 3D scene notes
- The 3D library loads from cdnjs, then jsDelivr, then `assets/js/vendor/three.min.js` if you add it. If WebGL fails on a device, the site falls back to a photo background and hides Explore instead of showing errors.
- Layout follows the Master Plan: entrance arch, landscaped park left of the entrance (north strip), landscaped park with fountain and play area right of it, civic amenity lawn, 40 ft roads, brick walkways, palm avenue, lamps. Plots 1-8 have white villas with pools; plots 9-12 have larger white commercial blocks.
- To use real Sketchfab/other models: download a CC0 or CC-BY `.glb`, save as `assets/models/villa.glb` (and/or `commercial.glb`). They are scaled and placed automatically. Credit CC-BY authors in the footer.
- Music is generated in the browser (soft pads and bells), so there is no audio file or licence to manage. The speaker button in the nav toggles it.
