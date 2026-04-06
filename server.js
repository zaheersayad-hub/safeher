const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let contacts = [
  { id: 1, name: 'Mom', phone: '+91-9876543210', relation: 'Family', priority: true },
  { id: 2, name: 'Ravi', phone: '+91-9876543211', relation: 'Friend', priority: false }
];
let sosLog = [];

// Risk calculation with more factors
function calculateRisk({ hour, isIsolated, isStationary, isDark, speed }) {
  let score = 0;
  if (hour >= 22 || hour <= 5) score += 38;
  else if (hour >= 20 || hour <= 7) score += 18;
  if (isIsolated) score += 32;
  if (isStationary) score += 14;
  if (isDark) score += 12;
  if (isIsolated && (hour >= 22 || hour <= 5)) score += 10;
  score = Math.min(score, 100);
  const level = score >= 60 ? 'danger' : score >= 28 ? 'medium' : 'safe';
  return { score, level };
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/risk', (req, res) => {
  const { hour, isIsolated, isStationary, isDark, speed } = req.body;
  const risk = calculateRisk({
    hour: hour ?? new Date().getHours(),
    isIsolated: isIsolated ?? false,
    isStationary: isStationary ?? false,
    isDark: isDark ?? false,
    speed: speed ?? 5
  });
  res.json({ success: true, risk });
});

app.post('/api/sos', (req, res) => {
  const { location, triggeredBy } = req.body;
  // Sort contacts by priority
  const priorityContacts = contacts.filter(c => c.priority);
  const others = contacts.filter(c => !c.priority);
  const alertOrder = [...priorityContacts, ...others];

  const alert = {
    id: Date.now(),
    time: new Date().toISOString(),
    location: location || { lat: 12.9716, lng: 77.5946 },
    triggeredBy: triggeredBy || 'button',
    contacts: alertOrder.map(c => c.name),
    status: 'sent'
  };
  sosLog.push(alert);
  console.log('🚨 SOS TRIGGERED (priority order):', alert);
  res.json({
    success: true,
    message: `SOS sent to ${contacts.length} contacts in priority order!`,
    alert
  });
});

app.get('/api/contacts', (req, res) => res.json({ success: true, contacts }));

app.post('/api/contacts', (req, res) => {
  const { name, phone, relation, priority } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
  const contact = { id: Date.now(), name, phone, relation: relation || 'Other', priority: !!priority };
  contacts.push(contact);
  res.json({ success: true, contact });
});

app.delete('/api/contacts/:id', (req, res) => {
  contacts = contacts.filter(c => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/voice-trigger', (req, res) => {
  const { phrase, location } = req.body;
  const alert = { id: Date.now(), time: new Date().toISOString(), location, triggeredBy: 'voice', phrase, contacts: contacts.map(c => c.name), status: 'sent' };
  sosLog.push(alert);
  res.json({ success: true, message: 'Voice SOS triggered!', alert });
});

app.get('/api/sos/log', (req, res) => res.json({ success: true, log: sosLog }));

const PORT = 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('🛡️  SafeHer AI Server Running!');
  console.log(`🌐  Open: http://localhost:${PORT}`);
  console.log('');
});