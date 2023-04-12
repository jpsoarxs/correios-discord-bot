// create a model using mongoose's model method

import mongoose from "mongoose";

const Schema = mongoose.Schema;

const codeSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notify = mongoose.model("notify", codeSchema);

export default Notify;
