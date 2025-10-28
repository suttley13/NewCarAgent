# Agent Builder Workflow Setup

This guide shows you how to configure your Agent Builder workflow to save cars to the database when using ChatKit.

## Why Cars Aren't Being Saved

Currently, when you use ChatKit, the agent runs on OpenAI's servers and doesn't automatically save to your local database. Only the CLI agent (`npm start`) saves to the database because it runs your local code.

To fix this, you need to add a **Custom Action** (API endpoint) to your workflow that the agent can call to save cars.

## Step 1: Add Custom Action to Your Workflow

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to Agent Builder
3. Open your workflow: `wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3`
4. Click on **"Actions"** or **"Tools"**
5. Click **"Add Action"** or **"Add Custom Action"**

## Step 2: Configure the Action

Add a new action with these details:

### Action Name
```
save_car_to_database
```

### Description
```
Saves a sports car to the database. Call this for each car you find to store it persistently.
The function will check for duplicates and only add new cars.
```

### API Endpoint

**Method:** `POST`

**URL:** `http://localhost:3000/api/cars`

(Note: For production, replace `localhost:3000` with your deployed server URL)

### Request Body Schema

```json
{
  "type": "object",
  "properties": {
    "make": {
      "type": "string",
      "description": "Car manufacturer (e.g., Ferrari, Porsche)"
    },
    "model": {
      "type": "string",
      "description": "Car model name (e.g., 911, Corvette)"
    },
    "year": {
      "type": "integer",
      "description": "Model year (e.g., 2024, 2025)"
    },
    "price": {
      "type": "number",
      "description": "Price in USD"
    },
    "url": {
      "type": "string",
      "description": "Source URL or link to the car listing"
    },
    "description": {
      "type": "string",
      "description": "Brief description of the car including key features"
    },
    "image_url": {
      "type": "string",
      "description": "URL to car image if available"
    }
  },
  "required": ["make", "model", "year", "price"]
}
```

### Authentication
- **Type:** None (for localhost)
- For production: Use API Key authentication

## Step 3: Update Agent Instructions

Update your agent's system instructions to include:

```
You are a sports car search specialist. When users ask about sports cars:

1. Search the web for current information about sports cars
2. For EACH car you find, extract these details:
   - Make (manufacturer)
   - Model (model name)
   - Year (2024 or 2025)
   - Price (in USD)
   - URL (source link)
   - Description (brief summary of key features)
   - Image URL (if available)

3. **IMPORTANT:** After finding each car, immediately call the save_car_to_database
   action to store it in the database. This ensures all cars are saved for future reference.

4. Let the user know if a car was saved or if it was a duplicate.

Example workflow:
- User: "Find me sports cars under $100k"
- You: Search the web, find cars
- For each car found: Call save_car_to_database action
- Then: Respond to user with the results and which ones were saved

Always save cars to the database as you find them so users can view them later.
```

## Step 4: Test the Integration

1. **Restart your server:**
   ```bash
   npm run server
   ```

2. **Open ChatKit** at `http://localhost:3000`

3. **Ask the agent to find cars:**
   ```
   Find me 3 new sports cars under $80k
   ```

4. **Watch the magic happen:**
   - The agent will search for cars
   - For each car found, it will call `save_car_to_database`
   - You'll see new cars appear in the left panel
   - Server logs will show: `✓ Added car via ChatKit: 2024 Nissan Z - $39990`

## Alternative: Using ngrok for Local Testing

If your workflow can't access `localhost`, use ngrok to create a public URL:

1. **Install ngrok:**
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update your action URL** in Agent Builder:
   ```
   https://abc123.ngrok.io/api/cars
   ```

## API Response Format

When the agent calls `save_car_to_database`, it will receive:

### Success Response
```json
{
  "success": true,
  "duplicate": false,
  "id": 16,
  "message": "Successfully added 2024 BMW M4"
}
```

### Duplicate Response
```json
{
  "success": false,
  "duplicate": true,
  "message": "2024 BMW M4 already exists in database"
}
```

### Error Response
```json
{
  "error": "Missing required fields",
  "required": ["make", "model", "year", "price"]
}
```

## Troubleshooting

### Cars still not saving?

1. **Check server logs:**
   ```bash
   # Look for messages like:
   # ✓ Added car via ChatKit: 2024 Porsche 911 - $101200
   ```

2. **Test the endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/api/cars \
     -H "Content-Type: application/json" \
     -d '{
       "make": "Porsche",
       "model": "911",
       "year": 2024,
       "price": 101200,
       "description": "Test car"
     }'
   ```

3. **Check Agent Builder logs:**
   - Go to your workflow in Agent Builder
   - Check the execution logs to see if the action is being called

### Action not available in workflow?

- Make sure you saved the action
- Refresh the Agent Builder page
- Check that the action is enabled

### localhost not accessible?

- Use ngrok (see instructions above)
- Or deploy your server to a cloud service (Heroku, Railway, etc.)

## Production Deployment

For production:

1. **Deploy your server** to a cloud provider
2. **Update the action URL** to your production URL
3. **Add authentication** to protect your API:

```javascript
// In server.js, add authentication middleware
app.use('/api/cars', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

4. **Configure the action** in Agent Builder with:
   - Authentication: API Key
   - Header: `X-API-Key`
   - Value: Your secret key

## Example Conversation

**User:** "Find me the best sports car under $50k"

**Agent:** "I'll search for the best sports cars under $50,000. Let me find some options for you..."

*Agent searches and finds: 2024 Nissan Z at $39,990*

*Agent calls: save_car_to_database(make="Nissan", model="Z", year=2024, price=39990, ...)*

*Response: {"success": true, "message": "Successfully added 2024 Nissan Z"}*

**Agent:** "I found a great option! The 2024 Nissan Z starts at $39,990. It features a 3.0L twin-turbo V6 engine with 400 hp and combines modern performance with retro styling. I've saved this to your database for future reference."

---

Now your ChatKit agent will automatically save all cars it finds to your local database!
