import moongoose from "mongoose";
export const connectDB = async () => {
  try {
    const conn = await moongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
