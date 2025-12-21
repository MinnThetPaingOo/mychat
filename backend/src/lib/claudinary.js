import { v2 as claudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

claudinary.config({
  cloud_name: process.env.CLAUDINARY_CLOUD_NAME,
  api_key: process.env.CLAUDINARY_API_KEY,
  api_secret: process.env.CLAUDINARY_API_SECRET,
});
export default claudinary;
