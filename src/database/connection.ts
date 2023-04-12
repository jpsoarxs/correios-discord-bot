import mongoose from "mongoose";
import config from "../config/environment";

mongoose.connect(config.MONGO_URI);

const connection = mongoose.connection;

export default connection;
