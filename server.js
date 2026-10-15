require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients without Origin (e.g. curl); browser requests must match configured origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

const readingSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  u: Number, v: Number, z: { type: Number, required: true },
  fx: Number, fy: Number, cx: Number, cy: Number,
  distance: Number, validDepthPercent: Number,
  depthWidth: Number, depthHeight: Number,
  referenceDistance: Number,
  source: { type: String, default: 'webxr-ar-measurement-lab', maxlength: 80 }
}, { timestamps: true, versionKey: false, strict: 'throw' });
readingSchema.index({ timestamp: -1 });
const Reading = mongoose.model('Reading', readingSchema);

app.get('/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/readings', async (req, res) => {
  try {
    const b = req.body || {};
    const required = ['z'];
    for (const key of required) {
      if (typeof b[key] !== 'number' || !Number.isFinite(b[key]) || b[key] <= 0) {
        return res.status(400).json({ error: `Invalid or missing numeric field: ${key}` });
      }
    }
    const numericFields = ['u','v','z','fx','fy','cx','cy','distance','validDepthPercent','depthWidth','depthHeight','referenceDistance'];
    for (const key of numericFields) {
      if (b[key] != null && (typeof b[key] !== 'number' || !Number.isFinite(b[key]))) {
        return res.status(400).json({ error: `Field ${key} must be a finite number or null` });
      }
    }
    if (b.validDepthPercent != null && (b.validDepthPercent < 0 || b.validDepthPercent > 100)) {
      return res.status(400).json({ error: 'validDepthPercent must be between 0 and 100' });
    }
    const timestamp = b.timestamp ? new Date(b.timestamp) : new Date();
    if (Number.isNaN(timestamp.getTime())) return res.status(400).json({ error: 'Invalid timestamp' });
    const doc = await Reading.create({
      timestamp, u: b.u, v: b.v, z: b.z, fx: b.fx, fy: b.fy, cx: b.cx, cy: b.cy,
      distance: b.distance, validDepthPercent: b.validDepthPercent,
      depthWidth: b.depthWidth, depthHeight: b.depthHeight,
      referenceDistance: b.referenceDistance,
      source: typeof b.source === 'string' ? b.source.slice(0, 80) : undefined
    });
    return res.status(201).json({ ok: true, id: doc._id.toString(), timestamp: doc.timestamp });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'StrictModeError') return res.status(400).json({ error: 'Invalid reading payload' });
    console.error('POST /api/readings failed:', err.message);
    return res.status(500).json({ error: 'Could not save reading' });
  }
});

app.get('/api/readings', async (req, res) => {
  try {
    const parsed = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 100)) : 10;
    const readings = await Reading.find({}, { __v: 0 }).sort({ timestamp: -1 }).limit(limit).lean();
    res.json({ ok: true, count: readings.length, readings: readings.map(r => ({ ...r, id: r._id.toString(), _id: undefined })) });
  } catch (err) {
    console.error('GET /api/readings failed:', err.message);
    res.status(500).json({ error: 'Could not load readings' });
  }
});

app.use((err, req, res, next) => {
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({ error: err.message });
  console.error(err.message);
  res.status(400).json({ error: 'Bad request' });
});

const port = process.env.PORT || 8080;
async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Configure it as an environment variable.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB Atlas');
  app.listen(port, '0.0.0.0', () => console.log(`AR measurement API listening on port ${port}`));
}
start().catch(err => { console.error('API startup failed:', err.message); process.exit(1); });
