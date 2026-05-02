require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const job = await db.collection('jobs').findOne({ _id: new mongoose.Types.ObjectId('69f4c7030e030fcac38df6e5') });
  console.log("Job:", job ? "Found" : "Not Found");
  process.exit(0);
}).catch(console.error);
