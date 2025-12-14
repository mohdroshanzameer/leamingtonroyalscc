# Backend Code for Self-Hosted Deployment

Create a new folder called `backend` outside of this project and add these files:

## 1. package.json

```json
{
  "name": "lrcc-backend",
  "version": "1.0.0",
  "description": "Leamington Royals Cricket Club API",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.7",
    "openai": "^4.24.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0"
  }
}
```

## 2. .env

```env
# Server
PORT=3001
NODE_ENV=development

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Storage (Supabase Storage)
STORAGE_BUCKET="uploads"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@lrcc.com"

# OpenAI (for LLM features)
OPENAI_API_KEY="sk-..."

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

## 3. src/index.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middleware/auth');
const entityRoutes = require('./routes/entities');
const authRoutes = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', authMiddleware.optional, entityRoutes);
app.use('/api/integrations', authMiddleware.required, integrationRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

## 4. src/config/supabase.js

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const createSupabaseClient = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

module.exports = {
  supabaseAdmin,
  createSupabaseClient,
  supabaseUrl,
  supabaseAnonKey,
};
```

## 5. src/config/prisma.js

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
```

## 6. src/middleware/auth.js

```javascript
const { supabaseAdmin } = require('../config/supabase');

const required = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role: user.user_metadata?.role || 'user',
    };
    req.token = token;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const optional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'user',
      };
      req.token = token;
    }

    next();
  } catch (error) {
    next();
  }
};

const adminOnly = async (req, res, next) => {
  await required(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

module.exports = { required, optional, adminOnly };
```

## 7. src/routes/entities.js

```javascript
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

const entityModelMap = {
  'Season': 'season',
  'Competition': 'competition',
  'Team': 'team',
  'TeamPlayer': 'teamPlayer',
  'Tournament': 'tournament',
  'TournamentTeam': 'tournamentTeam',
  'TournamentMatch': 'tournamentMatch',
  'TournamentPlayer': 'tournamentPlayer',
  'BallByBall': 'ballByBall',
  'MatchState': 'matchState',
  'MatchProfile': 'matchProfile',
  'InningsScore': 'inningsScore',
  'MatchAvailability': 'matchAvailability',
  'FinanceCategory': 'financeCategory',
  'Transaction': 'transaction',
  'PlayerCharge': 'playerCharge',
  'PlayerPayment': 'playerPayment',
  'PaymentAllocation': 'paymentAllocation',
  'Membership': 'membership',
  'Sponsor': 'sponsor',
  'SponsorPayment': 'sponsorPayment',
  'Invoice': 'invoice',
  'PaymentSettings': 'paymentSettings',
  'News': 'news',
  'Event': 'event',
  'EventRSVP': 'eventRSVP',
  'GalleryImage': 'galleryImage',
  'ContactMessage': 'contactMessage',
  'Notification': 'notification',
  'UserNotification': 'userNotification',
  'ClubStats': 'clubStats',
  'UserActivityLog': 'userActivityLog',
  'SystemLog': 'systemLog',
  'AuthLog': 'authLog',
  'PaymentAuditLog': 'paymentAuditLog',
  'User': 'user',
};

const getModel = (entityName) => {
  const modelName = entityModelMap[entityName];
  if (!modelName || !prisma[modelName]) {
    throw new Error(`Unknown entity: ${entityName}`);
  }
  return prisma[modelName];
};

const parseSort = (sortString) => {
  if (!sortString) return { createdDate: 'desc' };
  const isDesc = sortString.startsWith('-');
  const field = isDesc ? sortString.slice(1) : sortString;
  const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  return { [camelField]: isDesc ? 'desc' : 'asc' };
};

const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
};

const toSnakeCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj instanceof Date) return obj.toISOString();
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

// LIST
router.get('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { sort, limit, skip } = req.query;
    const model = getModel(entity);
    const records = await model.findMany({
      orderBy: parseSort(sort),
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    res.json(records.map(toSnakeCase));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FILTER
router.post('/:entity/filter', async (req, res) => {
  try {
    const { entity } = req.params;
    const { query, sort, limit, skip } = req.body;
    const model = getModel(entity);
    const where = query ? toCamelCase(query) : {};
    const records = await model.findMany({
      where,
      orderBy: parseSort(sort),
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    res.json(records.map(toSnakeCase));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET BY ID
router.get('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getModel(entity);
    const record = await model.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(toSnakeCase(record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE
router.post('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const data = toCamelCase(req.body);
    const model = getModel(entity);
    const record = await model.create({
      data: { ...data, createdBy: req.user?.email },
    });
    res.status(201).json(toSnakeCase(record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BULK CREATE
router.post('/:entity/bulk', async (req, res) => {
  try {
    const { entity } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Body must be an array' });
    }
    const model = getModel(entity);
    const records = await Promise.all(
      items.map(item => model.create({
        data: { ...toCamelCase(item), createdBy: req.user?.email },
      }))
    );
    res.status(201).json(records.map(toSnakeCase));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE
router.put('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const data = toCamelCase(req.body);
    const model = getModel(entity);
    const record = await model.update({
      where: { id },
      data: { ...data, updatedDate: new Date() },
    });
    res.json(toSnakeCase(record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = getModel(entity);
    await model.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 8. src/routes/auth.js

```javascript
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const prisma = require('../config/prisma');
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware.required, async (req, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    res.json({ ...req.user, ...userData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/me', authMiddleware.required, async (req, res) => {
  try {
    const { full_name, ...otherData } = req.body;
    if (full_name) {
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        user_metadata: { full_name },
      });
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName: full_name, ...otherData, updatedDate: new Date() },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/check', authMiddleware.optional, (req, res) => {
  res.json({ authenticated: !!req.user, user: req.user || null });
});

router.post('/logout', authMiddleware.optional, async (req, res) => {
  res.json({ success: true });
});

module.exports = router;
```

## 9. src/routes/integrations.js

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');
const { supabaseAdmin } = require('../config/supabase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const fileName = `${uuidv4()}-${req.file.originalname}`;
    const bucket = process.env.STORAGE_BUCKET || 'uploads';
    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
    });
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    res.json({ file_url: urlData.publicUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Send email
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body, from_name } = req.body;
    await transporter.sendMail({
      from: `${from_name || 'LRCC'} <${process.env.EMAIL_FROM}>`,
      to, subject, html: body,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Invoke LLM
router.post('/llm', async (req, res) => {
  try {
    const { prompt, response_json_schema } = req.body;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      ...(response_json_schema && { response_format: { type: 'json_object' } }),
    });
    const content = completion.choices[0]?.message?.content;
    res.json(response_json_schema ? JSON.parse(content) : { response: content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invoke LLM' });
  }
});

// Generate image
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.images.generate({
      model: 'dall-e-3', prompt, n: 1, size: '1024x1024',
    });
    res.json({ url: response.data[0].url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

module.exports = router;
```

## 10. prisma/schema.prisma

Copy the Prisma schema I provided earlier in this conversation.

---

## Deployment to Railway

1. Create a new Railway project
2. Add a PostgreSQL database
3. Connect your backend repo
4. Set environment variables
5. Deploy

## Frontend Environment Variables

Add to your `.env` file:

```env
VITE_API_URL=https://your-railway-app.railway.app/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
``