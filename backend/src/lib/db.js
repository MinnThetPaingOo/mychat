import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.log("\n⚠️  Troubleshooting steps:");
    console.log("1. Check if cluster is paused in MongoDB Atlas");
    console.log("2. Verify database user exists in Database Access");
    console.log("3. Confirm IP whitelist in Network Access (0.0.0.0/0)");
    console.log("4. Wait 2-3 minutes after making changes\n");
    process.exit(1);
  }
};
