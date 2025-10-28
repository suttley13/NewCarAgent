import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { promises as fs } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Authentication middleware for sensitive endpoints
const authenticateRequest = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const apiToken = process.env.RAILWAY_API_TOKEN || process.env.API_TOKEN;

  if (apiToken && token !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// ChatKit session endpoint
app.post('/api/chatkit/session', async (req, res) => {
  try {
    const { deviceId } = req.body;

    console.log('Creating ChatKit session for workflow:', process.env.OPENAI_AGENT_ID);

    // Create ChatKit session with your workflow ID
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: {
          id: process.env.OPENAI_AGENT_ID
        },
        user: deviceId || 'anonymous',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return res.status(response.status).json({
        error: data.error || 'Failed to create ChatKit session',
        details: data
      });
    }

    console.log('ChatKit session created successfully');
    res.json({
      client_secret: data.client_secret
    });
  } catch (error) {
    console.error('Error creating ChatKit session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Session refresh endpoint
app.post('/api/chatkit/refresh', async (req, res) => {
  try {
    const { currentClientSecret } = req.body;

    if (!currentClientSecret) {
      return res.status(400).json({ error: 'Missing client secret' });
    }

    // Refresh the session
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        client_secret: currentClientSecret,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return res.status(response.status).json({
        error: data.error || 'Failed to refresh ChatKit session'
      });
    }

    res.json({
      client_secret: data.client_secret
    });
  } catch (error) {
    console.error('Error refreshing ChatKit session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get all cars from database
app.get('/api/cars', async (req, res) => {
  try {
    const DatabaseOperations = (await import('./src/database/operations.js')).default;
    const db = new DatabaseOperations();

    await db.connect();
    const cars = await db.getAllCars();
    const stats = await db.getStatistics();
    await db.close();

    res.json({
      cars,
      stats
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({
      error: 'Failed to fetch cars',
      message: error.message
    });
  }
});

// Add a car to the database (called by ChatKit workflow)
app.post('/api/cars', async (req, res) => {
  try {
    const { make, model, year, price, url, description, source, image_url } = req.body;

    // Validate required fields
    if (!make || !model || !year || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['make', 'model', 'year', 'price']
      });
    }

    const DatabaseOperations = (await import('./src/database/operations.js')).default;
    const db = new DatabaseOperations();

    await db.connect();

    // Check if car already exists
    const exists = await db.carExists(make, model, year);

    if (exists) {
      await db.close();
      return res.json({
        success: false,
        duplicate: true,
        message: `${year} ${make} ${model} already exists in database`
      });
    }

    // Insert the car
    const result = await db.insertCar({
      make,
      model,
      year: parseInt(year),
      price: parseFloat(price),
      url: url || null,
      description: description || null,
      source: source || 'chatkit',
      image_url: image_url || null
    });

    await db.close();

    console.log(`✓ Added car via ChatKit: ${year} ${make} ${model} - $${price}`);

    res.json({
      success: true,
      duplicate: false,
      id: result.id,
      message: `Successfully added ${year} ${make} ${model}`
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({
      error: 'Failed to add car',
      message: error.message
    });
  }
});

// Database download endpoint (for GitHub Actions)
app.get('/api/database/download', authenticateRequest, async (req, res) => {
  try {
    const dbPath = process.env.DATABASE_PATH || './data/cars.db';
    const fileExists = await fs.access(dbPath).then(() => true).catch(() => false);

    if (!fileExists) {
      return res.status(404).json({ error: 'Database not found' });
    }

    res.download(dbPath, 'cars.db');
  } catch (error) {
    console.error('Error downloading database:', error);
    res.status(500).json({ error: 'Failed to download database' });
  }
});

// Database upload endpoint (for GitHub Actions)
app.post('/api/database/upload', authenticateRequest, upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No database file provided' });
    }

    const dbPath = process.env.DATABASE_PATH || './data/cars.db';
    const uploadedPath = req.file.path;

    // Ensure data directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    // Move uploaded file to database location
    await fs.rename(uploadedPath, dbPath);

    console.log('✓ Database updated from GitHub Actions');

    res.json({
      success: true,
      message: 'Database uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading database:', error);
    res.status(500).json({ error: 'Failed to upload database' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    workflowId: process.env.OPENAI_AGENT_ID,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`\n🚀 Car Agent ChatKit Server running on http://localhost:${port}`);
  console.log(`📝 Workflow ID: ${process.env.OPENAI_AGENT_ID}`);
  console.log(`\n💡 Open http://localhost:${port} in your browser to use ChatKit\n`);
});
