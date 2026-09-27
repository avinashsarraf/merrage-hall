import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.API_PORT || 3001);
const root = path.dirname(fileURLToPath(import.meta.url));
const storeFile = path.join(root, '..', 'data', 'store.json');
app.use(express.json({ limit: '1mb' }));

const initialData = {
  bookings: [
    {id:1,name:'Aarav & Meera Sharma',event:'Wedding reception',date:'2026-10-18',guests:450,venue:'The Grand Pavilion',status:'Confirmed',amount:18500,avatar:'AM',color:'peach'},
    {id:2,name:'Rohan & Sanya Kapoor',event:'Engagement',date:'2026-10-21',guests:180,venue:'The Garden Room',status:'Pending',amount:8200,avatar:'RS',color:'lavender'},
    {id:3,name:'Priya Malhotra',event:'Mehendi celebration',date:'2026-10-24',guests:250,venue:'The Grand Pavilion',status:'Confirmed',amount:12750,avatar:'PM',color:'sage'},
    {id:4,name:'Kabir & Naina Verma',event:'Wedding ceremony',date:'2026-10-26',guests:600,venue:'The Grand Pavilion',status:'Confirmed',amount:24600,avatar:'KN',color:'blue'},
    {id:5,name:'Arjun & Diya Singh',event:'Sangeet night',date:'2026-10-29',guests:320,venue:'The Garden Room',status:'Inquiry',amount:14800,avatar:'AD',color:'yellow'}
  ],
  venues: [
    {id:1,name:'The Grand Pavilion',type:'Ballroom',capacity:700,events:18,image:'photo-1519167758481-83f550bb49b3'},
    {id:2,name:'The Garden Room',type:'Garden estate',capacity:250,events:12,image:'photo-1519741497674-611481863552'}
  ],
  assets: [
    {id:1,name:'Gold Chiavari chair',category:'Furniture',qty:450,price:8,icon:'chair'},
    {id:2,name:'Ivory table linen',category:'Decor',qty:80,price:24,icon:'linen'},
    {id:3,name:'Floral arch installation',category:'Decor',qty:4,price:680,icon:'flower'},
    {id:4,name:'Wireless microphone set',category:'AV & Tech',qty:6,price:85,icon:'mic'}
  ],
  menu: [
    {id:1,name:'Royal wedding buffet',category:'Food package',price:68,detail:'Per guest · 12 dishes'},
    {id:2,name:'Live chaat station',category:'Starter',price:14,detail:'Per guest · Live counter'},
    {id:3,name:'Rose & pistachio kulfi',category:'Dessert',price:9,detail:'Per guest · 2 flavours'},
    {id:4,name:'Welcome mocktail bar',category:'Beverage',price:12,detail:'Per guest · 3 hours'}
  ]
};

async function readData() {
  try {
    const data = JSON.parse(await fs.readFile(storeFile, 'utf8'));
    if (!Array.isArray(data.venues)) { data.venues = initialData.venues; await writeData(data); }
    return data;
  }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(storeFile), { recursive: true });
    await fs.writeFile(storeFile, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}
async function writeData(value) {
  const tmp = `${storeFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2));
  await fs.rename(tmp, storeFile);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'merrage-api' }));
app.get('/api/data', async (_req, res, next) => {
  try { res.json(await readData()); } catch (error) { next(error); }
});
app.put('/api/data', async (req, res, next) => {
  try {
    const value = req.body;
    if (!value || !Array.isArray(value.bookings) || !Array.isArray(value.assets) || !Array.isArray(value.menu) || !Array.isArray(value.venues)) {
      return res.status(400).json({ error: 'A valid venue workspace is required.' });
    }
    await writeData(value);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) { next(error); }
});
app.post('/api/auth/login', (req, res) => {
  const { email, password, role = 'venue-owner' } = req.body || {};
  const roles = ['saas-owner', 'venue-owner', 'staff', 'event-client'];
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (!roles.includes(role)) return res.status(400).json({ error: 'Choose a valid account type.' });
  // Demo-ready sign-in. Replace this adapter with a production identity provider before launch.
  res.json({
    token: `demo_${Buffer.from(`${email}:${role}`).toString('base64url')}`,
    user: { email, name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role }
  });
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});
app.listen(port, '0.0.0.0', () => console.log(`Merrage API listening on 0.0.0.0:${port}`));
