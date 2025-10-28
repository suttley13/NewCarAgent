import sqlite3 from 'sqlite3';
import { DB_PATH } from './init.js';

class DatabaseOperations {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Check if a car already exists in the database
  async carExists(make, model, year) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id FROM cars WHERE make = ? AND model = ? AND year = ?`,
        [make, model, year],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  // Insert a new car
  async insertCar(carData) {
    const { make, model, year, price, url, description, source, image_url } = carData;

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO cars (make, model, year, price, url, description, source, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [make, model, year, price, url, description, source, image_url],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              resolve({ id: null, duplicate: true });
            } else {
              reject(err);
            }
          } else {
            resolve({ id: this.lastID, duplicate: false });
          }
        }
      );
    });
  }

  // Get all cars
  async getAllCars() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM cars ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get cars within a price range
  async getCarsInPriceRange(minPrice, maxPrice) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM cars WHERE price BETWEEN ? AND ? ORDER BY price`,
        [minPrice, maxPrice],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Find similar cars by price
  async findSimilarCarsByPrice(targetPrice, tolerance = 5000, limit = 3) {
    const minPrice = targetPrice - tolerance;
    const maxPrice = targetPrice + tolerance;

    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM cars
         WHERE price BETWEEN ? AND ?
         ORDER BY ABS(price - ?) ASC
         LIMIT ?`,
        [minPrice, maxPrice, targetPrice, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Log search history
  async logSearch(query, resultsFound, newCarsAdded) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO search_history (search_query, results_found, new_cars_added)
         VALUES (?, ?, ?)`,
        [query, resultsFound, newCarsAdded],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Get search history
  async getSearchHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM search_history ORDER BY executed_at DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Get statistics
  async getStatistics() {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT
          COUNT(*) as total_cars,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          (SELECT COUNT(*) FROM search_history) as total_searches
         FROM cars`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

export default DatabaseOperations;
