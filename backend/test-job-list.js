require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const jobs = await db.collection('jobs').find({}).toArray();
  console.log("Jobs found:", jobs.length);
  if (jobs.length > 0) {
    console.log("First job ID:", jobs[0]._id.toString());
  }
  process.exit(0);
}).catch(console.error);
