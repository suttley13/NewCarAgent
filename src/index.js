import dotenv from 'dotenv';
import { initDatabase } from './database/init.js';
import CarSearchAgent from './agent/carSearchAgent.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚗 New Car Agent Starting...\n');

  // Validate environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  const agentId = process.env.OPENAI_AGENT_ID;

  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please create a .env file with your OpenAI API key');
    console.log('Example: cp .env.example .env');
    process.exit(1);
  }

  if (!agentId) {
    console.error('❌ Error: OPENAI_AGENT_ID not found in environment variables');
    console.log('Please add your OpenAI Agent ID to the .env file');
    console.log('You can create an agent at: https://platform.openai.com/agents');
    process.exit(1);
  }

  try {
    // Initialize database
    await initDatabase();

    // Create and initialize agent
    const agent = new CarSearchAgent(apiKey, agentId);
    await agent.initialize();

    // Get configuration from environment
    const searchQuery = process.env.SEARCH_QUERY || 'new sports cars 2024 2025';
    const priceTolerance = parseInt(process.env.PRICE_TOLERANCE || '5000');

    // Run the agent
    await agent.run(searchQuery, priceTolerance);

    // Cleanup
    await agent.cleanup();

    console.log('\n✅ Agent execution completed successfully');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
