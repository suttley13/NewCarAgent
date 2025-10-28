# New Car Agent

An intelligent agent built with OpenAI Agent Builder that searches the web for new sports cars, finds similar-priced vehicles, and maintains a database to avoid duplicates.

## Features

- **Web Search Integration**: Uses OpenAI Agent Builder with web search capabilities
- **Price Comparison**: Automatically finds 3 cars with similar prices
- **Duplicate Detection**: Tracks all cars in SQLite database to avoid repeating searches
- **Search History**: Logs all searches and results for tracking
- **Statistics Dashboard**: View database statistics and insights

## Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- OpenAI Agent Builder agent ID

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI credentials:

```
OPENAI_API_KEY=your_api_key_here
OPENAI_AGENT_ID=your_agent_id_here
```

### 3. Create Your OpenAI Agent

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to Agent Builder
3. Create a new agent with the following configuration:

   **Name**: Sports Car Search Agent

   **Instructions**:
   ```
   You are a sports car search specialist. Your job is to search the web for new sports cars
   and provide detailed information in a structured format.

   When given a search query, use web search to find current sports cars for sale or recently
   announced. For each car, extract:
   - Make (manufacturer)
   - Model name
   - Year
   - Price in USD
   - URL/Source link
   - Brief description
   - Image URL if available

   Return results as a JSON array with these exact fields:
   [
     {
       "make": "Ferrari",
       "model": "296 GTB",
       "year": 2024,
       "price": 321400,
       "url": "https://...",
       "description": "Hybrid V6 supercar...",
       "image_url": "https://..."
     }
   ]
   ```

   **Tools**: Enable "Web Search"

   **Model**: Choose GPT-4 or GPT-4 Turbo for best results

4. Copy the Agent ID from the Agent Builder interface
5. Add it to your `.env` file

### 4. Initialize Database

```bash
npm run init-db
```

## Usage

### Run the Agent

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

## How It Works

1. **Search Phase**:
   - The agent searches the web using OpenAI's web search capability
   - Finds new sports cars matching the search query
   - Extracts structured data (make, model, year, price, etc.)

2. **Deduplication Phase**:
   - Checks each car against the database
   - Skips cars already in the database (by make, model, and year)
   - Only adds genuinely new cars

3. **Price Comparison Phase**:
   - For each new car, finds 3 similar-priced cars from the database
   - Groups cars within the price tolerance range
   - Displays price comparison groups

4. **Logging Phase**:
   - Records search query, results count, and new cars added
   - Updates database statistics

## Configuration

Adjust these values in your `.env` file:

- `SEARCH_QUERY`: Customize what to search for
- `PRICE_TOLERANCE`: Price range for finding similar cars (default: $5,000)
- `MAX_RESULTS`: Maximum number of results to process
- `DATABASE_PATH`: Location of SQLite database

## Database Schema

### Cars Table
```sql
CREATE TABLE cars (
  id INTEGER PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price REAL NOT NULL,
  url TEXT,
  description TEXT,
  source TEXT,
  image_url TEXT,
  created_at DATETIME
)
```

### Search History Table
```sql
CREATE TABLE search_history (
  id INTEGER PRIMARY KEY,
  search_query TEXT NOT NULL,
  results_found INTEGER,
  new_cars_added INTEGER,
  executed_at DATETIME
)
```

## Example Output

```
🚗 New Car Agent Starting...

✓ Data directory created
✓ Database tables created successfully
✓ Database initialized at: ./data/cars.db
✓ Car Search Agent initialized

🔍 Searching for: new sports cars 2024 2025

📊 Found 8 cars from search

✓ Added: 2024 Porsche 911 GT3 RS - $225,250
✓ Added: 2024 Chevrolet Corvette Z06 - $106,395
✓ Added: 2025 BMW M4 CSL - $139,900
⏭️  Skipping duplicate: 2024 Ferrari 296 GTB
...

📈 Summary:
   New cars added: 5
   Duplicates skipped: 3
   Similar price groups: 2

💰 Cars with Similar Prices:

Group 1: ~$140,000
   New: 2025 BMW M4 CSL - $139,900
        2024 Audi R8 V10 - $142,700
        2024 Mercedes-AMG GT - $136,500

📊 Database Statistics:
   Total cars: 47
   Average price: $156,234
   Price range: $45,000 - $450,000
   Total searches: 12
```

## Project Structure

```
NewCarAgent/
├── src/
│   ├── agent/
│   │   └── carSearchAgent.js    # Main agent logic
│   ├── database/
│   │   ├── init.js              # Database initialization
│   │   └── operations.js        # Database CRUD operations
│   └── index.js                 # Entry point
├── data/
│   └── cars.db                  # SQLite database
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## Advanced Usage

### Custom Search Queries

Modify the search query in `.env`:

```
SEARCH_QUERY=luxury sports cars under 100k 2024
```

### Programmatic Usage

You can also use the agent programmatically:

```javascript
import CarSearchAgent from './src/agent/carSearchAgent.js';

const agent = new CarSearchAgent(apiKey, agentId);
await agent.initialize();

const results = await agent.run('supercar 2024', 10000);
console.log(results);

await agent.cleanup();
```

## Troubleshooting

### Agent not returning JSON

Make sure your agent instructions clearly specify JSON format output.

### Duplicate cars still appearing

The deduplication checks make + model + year. If any field differs, it's considered a new car.

### Price comparison not working

Adjust the `PRICE_TOLERANCE` in `.env` to widen or narrow the price range.

## Future Enhancements

- Add email notifications for new cars in specific price ranges
- Implement scheduling for automatic searches
- Add car comparison dashboard with web UI
- Export results to CSV/Excel
- Add filters for specific manufacturers or price ranges
- Integration with car valuation APIs

## License

MIT
