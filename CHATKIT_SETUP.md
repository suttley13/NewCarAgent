# ChatKit Integration Setup

This guide explains how to use the ChatKit web interface with your Agent Builder workflow.

## What is ChatKit?

ChatKit is OpenAI's embeddable chat UI that connects to your Agent Builder workflow. Instead of running the agent from the command line, you can now interact with it through a beautiful web interface.

## Quick Start

1. **Make sure your .env file is configured:**
   ```
   OPENAI_API_KEY=your_api_key
   OPENAI_AGENT_ID=wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3
   PORT=3000
   ```

2. **Start the ChatKit server:**
   ```bash
   npm run server
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

You'll see a beautiful chat interface where you can interact with your sports car search agent!

## How It Works

### Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│   Browser   │─────▶│  Express    │─────▶│  OpenAI Agent   │
│  (ChatKit)  │      │   Server    │      │    Builder      │
└─────────────┘      └─────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   SQLite    │
                     │  Database   │
                     └─────────────┘
```

1. **Frontend (public/index.html)**
   - Embeds ChatKit widget
   - Handles user interactions
   - Requests session tokens from backend

2. **Backend (server.js)**
   - Creates ChatKit sessions
   - Manages authentication
   - Proxies requests to OpenAI

3. **Agent Builder Workflow**
   - Your workflow ID: `wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3`
   - Hosted on OpenAI's servers
   - Executes the sports car search logic

## Features

### Chat Interface
- Real-time conversations with your AI agent
- Beautiful, responsive design
- Mobile-friendly

### Agent Capabilities
Ask questions like:
- "Find me new sports cars under $100k"
- "What's the best sports car in 2024?"
- "Compare the Porsche 911 and BMW M4"
- "Show me hybrid sports cars"

### Database Integration
The agent stores all cars it finds in the SQLite database, so you can:
- View all cars with: `npm run view`
- Run the CLI agent with: `npm start`
- Both interfaces share the same database!

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-...         # Your OpenAI API key
OPENAI_AGENT_ID=wf_...             # Your Agent Builder workflow ID

# Optional
PORT=3000                          # Server port (default: 3000)
DATABASE_PATH=./data/cars.db       # Database location
```

### Customization

#### Change the theme colors (public/index.html):
```javascript
theme: {
  primaryColor: '#667eea',  // Change this to your brand color
  borderRadius: '8px',
},
```

#### Adjust the chat height:
```css
.chat-container {
  height: 700px;  /* Change this value */
}
```

## Agent Builder Setup

To configure your Agent Builder workflow:

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to Agent Builder
3. Open your workflow: `wf_6900e5de770c8190aab1984b6f25eafe0f1d90c61a1e1fe3`
4. Enable these tools:
   - **Web Search** - For finding new sports cars
   - **Code Interpreter** - For data analysis (optional)

### Recommended Instructions for Your Agent:

```
You are a sports car search specialist. Your job is to help users find and
compare sports cars.

When users ask about sports cars:
1. Search the web for current information
2. Provide accurate pricing in USD
3. Include key specifications and features
4. Compare similar models when relevant
5. Keep responses conversational and helpful

For each car, try to provide:
- Make and model
- Year
- Price (MSRP)
- Key features (engine, horsepower, 0-60 time, etc.)
- Pros and cons
- Links to official sites or reviews
```

## Troubleshooting

### "Failed to create ChatKit session"

**Check:**
1. Is your `OPENAI_API_KEY` valid?
2. Is your `OPENAI_AGENT_ID` correct?
3. Is the workflow ID a valid workflow (starts with `wf_`)?

**Solution:**
```bash
# Test your API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Cannot connect to server"

**Check:**
1. Is the server running? (`npm run server`)
2. Is the port (3000) already in use?

**Solution:**
```bash
# Use a different port
PORT=3001 npm run server
```

### ChatKit widget not loading

**Check:**
1. Browser console for errors (F12)
2. Network tab to see if ChatKit script is loading
3. Try a different browser

**Solution:**
- Clear browser cache
- Disable ad blockers
- Check if you're behind a firewall

## API Endpoints

### POST /api/chatkit/session
Creates a new ChatKit session.

**Request:**
```json
{
  "deviceId": "device_abc123"
}
```

**Response:**
```json
{
  "client_secret": "cs_live_..."
}
```

### POST /api/chatkit/refresh
Refreshes an existing session.

**Request:**
```json
{
  "currentClientSecret": "cs_live_..."
}
```

**Response:**
```json
{
  "client_secret": "cs_live_..."
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "workflowId": "wf_..."
}
```

## Development Tips

### Local Development
```bash
# Run with auto-reload (requires nodemon)
npx nodemon server.js
```

### Testing Different Workflows
```bash
# Temporarily use a different workflow
OPENAI_AGENT_ID=wf_different_workflow npm run server
```

### View Server Logs
The server logs all requests, including:
- Session creations
- ChatKit interactions
- Errors

## Production Deployment

When deploying to production:

1. **Use environment variables** - Never commit `.env` file
2. **Enable HTTPS** - Use a reverse proxy (nginx, CloudFlare)
3. **Set up CORS** - Restrict allowed origins
4. **Monitor logs** - Use a logging service
5. **Scale horizontally** - Use a load balancer for high traffic

### Example nginx config:
```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Comparison: CLI vs ChatKit

| Feature | CLI (`npm start`) | ChatKit (`npm run server`) |
|---------|------------------|---------------------------|
| Interface | Terminal | Web Browser |
| User Experience | Technical | User-Friendly |
| Batch Processing | ✓ Better | Limited |
| Interactive Chat | Limited | ✓ Better |
| Deployment | Server only | Server + Frontend |
| Mobile Access | ✗ | ✓ |
| Sharing | Difficult | Easy (URL) |

## Next Steps

- **Customize the UI** - Edit `public/index.html` to match your brand
- **Add analytics** - Track usage with Google Analytics or similar
- **Integrate with your app** - Embed ChatKit in your existing product
- **Add authentication** - Require login before using the agent
- **Connect database queries** - Show real-time stats from the database

## Resources

- [ChatKit Documentation](https://openai.github.io/chatkit-python)
- [Agent Builder Guide](https://platform.openai.com/docs/guides/agent-builder)
- [ChatKit Examples](https://github.com/openai/openai-chatkit-advanced-samples)
- [Starter App](https://github.com/openai/openai-chatkit-starter-app)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify your `.env` configuration
4. Test with the CLI version first (`npm start`)
