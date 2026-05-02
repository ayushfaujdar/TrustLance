require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const jobs = await db.collection('jobs').find({}).toArray();
  const contracts = await db.collection('contracts').find({}).toArray();
  console.log("Jobs:");
  jobs.forEach(j => console.log(j._id, "status:", j.status));
  console.log("\nContracts:");
  contracts.forEach(c => console.log("contractId:", c._id, "job_id:", c.job_id));
  process.exit(0);
}).catch(console.error);
