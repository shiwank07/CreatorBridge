import mongoose, { type Document, type Model, Schema } from "mongoose";

interface ICounter extends Document {
  key: string;
  value: number;
}

const CounterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

export const Counter =
  (mongoose.models.Counter as Model<ICounter> | undefined) ?? mongoose.model<ICounter>("Counter", CounterSchema);
