import { Schema, model } from "mongoose";

export const hug = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

export const Hug = model("Hug", hug);
