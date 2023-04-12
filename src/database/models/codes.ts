// create a model using mongoose's model method

import mongoose from "mongoose";

const Schema = mongoose.Schema;

const codeSchema = new Schema({
  code: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    default: [],
  },
  user: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Code = mongoose.model("codes", codeSchema);

export default Code;
