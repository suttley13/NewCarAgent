import DatabaseOperations from './database/operations.js';

async function viewDatabase() {
  const db = new DatabaseOperations();

  try {
    await db.connect();
    console.log('🚗 Car Database Viewer\n');
    console.log('='.repeat(100));

    // Get all cars
    const cars = await db.getAllCars();

    if (cars.length === 0) {
      console.log('\n📭 No cars in database yet. Run the agent first with: npm start\n');
      await db.close();
      return;
    }

    console.log(`\n📊 Total Cars: ${cars.length}\n`);

    // Display each car
    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} ${car.make} ${car.model}`);
      console.log(`   💰 Price: $${car.price.toLocaleString()}`);
      if (car.description) {
        console.log(`   📝 Description: ${car.description}`);
      }
      if (car.url) {
        console.log(`   🔗 URL: ${car.url}`);
      }
      console.log(`   📅 Added: ${new Date(car.created_at).toLocaleString()}`);
      console.log('');
    });

    // Get statistics
    const stats = await db.getStatistics();
    console.log('='.repeat(100));
    console.log('\n📈 Statistics:');
    console.log(`   Total cars: ${stats.total_cars}`);
    console.log(`   Average price: $${stats.avg_price?.toLocaleString()}`);
    console.log(`   Price range: $${stats.min_price?.toLocaleString()} - $${stats.max_price?.toLocaleString()}`);
    console.log(`   Total searches: ${stats.total_searches}`);

    // Get search history
    const searchHistory = await db.getSearchHistory(5);
    if (searchHistory.length > 0) {
      console.log('\n🔍 Recent Searches:');
      searchHistory.forEach((search, index) => {
        console.log(`   ${index + 1}. "${search.search_query}"`);
        console.log(`      Found: ${search.results_found} | Added: ${search.new_cars_added} | ${new Date(search.executed_at).toLocaleString()}`);
      });
    }

    console.log('\n');

    await db.close();
  } catch (error) {
    console.error('Error viewing database:', error);
    process.exit(1);
  }
}

viewDatabase();
