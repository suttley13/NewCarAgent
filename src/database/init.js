import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'cars.db');

async function initDatabase() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DB_DIR, { recursive: true });
    console.log('✓ Data directory created');

    // Create database connection
    const db = new sqlite3.Database(DB_PATH);

    // Create tables
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Cars table
        db.run(`
          CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            price REAL NOT NULL,
            url TEXT,
            description TEXT,
            source TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(make, model, year, price)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Search history table
        db.run(`
          CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            search_query TEXT NOT NULL,
            results_found INTEGER,
            new_cars_added INTEGER,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    console.log('✓ Database tables created successfully');

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✓ Database initialized at:', DB_PATH);
      }
    });

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase().catch(console.error);
}

export { initDatabase, DB_PATH };
