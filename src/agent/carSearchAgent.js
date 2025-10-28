import OpenAI from 'openai';
import DatabaseOperations from '../database/operations.js';

class CarSearchAgent {
  constructor(apiKey, agentId) {
    this.client = new OpenAI({ apiKey });
    this.agentId = agentId;
    this.db = new DatabaseOperations();
  }

  // Initialize the agent
  async initialize() {
    await this.db.connect();
    console.log('✓ Car Search Agent initialized');
  }

  // Search for new sports cars using OpenAI with web search
  async searchForCars(query = 'new sports cars 2024 2025') {
    try {
      console.log(`\n🔍 Searching for: ${query}`);

      // For now, we'll use GPT-4 to generate realistic sample data
      // In production, you would integrate with actual web search APIs or use Agent Builder
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a sports car search specialist with access to current automotive market data.
Provide realistic and accurate information about sports cars currently available in the market.`
          },
          {
            role: 'user',
            content: `List 10 ${query} that are currently available for sale in the US market.
For each car, provide the following information in a JSON array format:
- make (manufacturer name)
- model (model name)
- year (4-digit year, use 2024 or 2025)
- price (realistic MSRP in USD, numeric value)
- url (use a placeholder URL like https://manufacturer.com/model)
- description (brief description including key features)
- image_url (use placeholder)

Return ONLY a valid JSON array with realistic data for actual current sports car models. Example format:
[
  {
    "make": "Ferrari",
    "model": "296 GTB",
    "year": 2024,
    "price": 321400,
    "url": "https://ferrari.com/296-gtb",
    "description": "Hybrid V6 supercar with 818 hp",
    "image_url": "https://ferrari.com/296-gtb.jpg"
  }
]

Use real sports car models and approximate realistic pricing.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from agent');
      }

      return this.parseCarResults(content);
    } catch (error) {
      console.error('Error searching for cars:', error);
      throw error;
    }
  }

  // Parse car results from agent response
  parseCarResults(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: try parsing the entire response
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing results:', error);
      console.log('Raw response:', response);
      return [];
    }
  }

  // Process and store car results
  async processCars(cars) {
    let newCarsAdded = 0;
    let duplicatesSkipped = 0;
    const processedCars = [];

    for (const car of cars) {
      try {
        // Validate required fields
        if (!car.make || !car.model || !car.year || !car.price) {
          console.log(`⚠️  Skipping invalid car entry:`, car);
          continue;
        }

        // Check if car already exists
        const exists = await this.db.carExists(car.make, car.model, car.year);

        if (exists) {
          console.log(`⏭️  Skipping duplicate: ${car.year} ${car.make} ${car.model}`);
          duplicatesSkipped++;
          continue;
        }

        // Insert new car
        const result = await this.db.insertCar({
          make: car.make,
          model: car.model,
          year: car.year,
          price: parseFloat(car.price),
          url: car.url || null,
          description: car.description || null,
          source: car.source || 'web search',
          image_url: car.image_url || null
        });

        if (!result.duplicate) {
          console.log(`✓ Added: ${car.year} ${car.make} ${car.model} - $${car.price.toLocaleString()}`);
          newCarsAdded++;
          processedCars.push(car);
        } else {
          duplicatesSkipped++;
        }
      } catch (error) {
        console.error(`Error processing car ${car.make} ${car.model}:`, error);
      }
    }

    return {
      newCarsAdded,
      duplicatesSkipped,
      processedCars
    };
  }

  // Find three cars with similar prices
  async findSimilarPricedCars(cars, tolerance = 5000) {
    const groups = [];

    for (const car of cars) {
      // Find cars in database with similar price
      const similarCars = await this.db.findSimilarCarsByPrice(
        parseFloat(car.price),
        tolerance,
        3
      );

      if (similarCars.length >= 2) {
        groups.push({
          newCar: car,
          similarCars: similarCars,
          priceRange: {
            min: Math.min(...similarCars.map(c => c.price)),
            max: Math.max(...similarCars.map(c => c.price)),
            avg: similarCars.reduce((sum, c) => sum + c.price, 0) / similarCars.length
          }
        });
      }
    }

    return groups;
  }

  // Main execution flow
  async run(searchQuery, priceTolerance = 5000) {
    try {
      // Search for cars
      const carResults = await this.searchForCars(searchQuery);
      console.log(`\n📊 Found ${carResults.length} cars from search`);

      // Process and store cars
      const { newCarsAdded, duplicatesSkipped, processedCars } = await this.processCars(carResults);

      // Log search history
      await this.db.logSearch(searchQuery, carResults.length, newCarsAdded);

      // Find similar priced cars
      const similarGroups = await this.findSimilarPricedCars(processedCars, priceTolerance);

      // Display results
      console.log(`\n📈 Summary:`);
      console.log(`   New cars added: ${newCarsAdded}`);
      console.log(`   Duplicates skipped: ${duplicatesSkipped}`);
      console.log(`   Similar price groups: ${similarGroups.length}`);

      if (similarGroups.length > 0) {
        console.log(`\n💰 Cars with Similar Prices:`);
        similarGroups.forEach((group, index) => {
          console.log(`\nGroup ${index + 1}: ~$${group.priceRange.avg.toLocaleString()}`);
          console.log(`   New: ${group.newCar.year} ${group.newCar.make} ${group.newCar.model} - $${parseFloat(group.newCar.price).toLocaleString()}`);
          group.similarCars.forEach(car => {
            console.log(`        ${car.year} ${car.make} ${car.model} - $${car.price.toLocaleString()}`);
          });
        });
      }

      // Display statistics
      const stats = await this.db.getStatistics();
      console.log(`\n📊 Database Statistics:`);
      console.log(`   Total cars: ${stats.total_cars}`);
      console.log(`   Average price: $${stats.avg_price?.toLocaleString()}`);
      console.log(`   Price range: $${stats.min_price?.toLocaleString()} - $${stats.max_price?.toLocaleString()}`);
      console.log(`   Total searches: ${stats.total_searches}`);

      return {
        newCarsAdded,
        duplicatesSkipped,
        similarGroups,
        stats
      };
    } catch (error) {
      console.error('Error running agent:', error);
      throw error;
    }
  }

  // Cleanup
  async cleanup() {
    await this.db.close();
    console.log('\n✓ Agent cleanup complete');
  }
}

export default CarSearchAgent;
