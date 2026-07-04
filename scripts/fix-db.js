require('dotenv').config({path: '.env.local'});
const mongoose = require('mongoose');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection.db.collection('groups').updateMany(
      { name: { $exists: false } },
      { $set: { name: 'Untitled Group' } }
    );
    console.log('Fixed missing names:', result.modifiedCount);
    
    // Also fix any empty string names
    const result2 = await mongoose.connection.db.collection('groups').updateMany(
      { name: '' },
      { $set: { name: 'Untitled Group' } }
    );
    console.log('Fixed empty string names:', result2.modifiedCount);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
