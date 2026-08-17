import mongoose from "mongoose";
import { Counter } from "@/lib/models/Counter";
import { FoundingCreatorIssuance } from "@/lib/models/FoundingCreatorIssuance";
export async function allocateFoundingCreatorIssuance(creatorId: mongoose.Types.ObjectId, actorId: string, now = new Date()) {
  const existing = await FoundingCreatorIssuance.findOne({ creatorId }); if (existing) return { issuance: existing, created: false, reservedNumber: existing.number };
  const counter = await Counter.findOneAndUpdate({ key: "founding_creator" }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }); if (counter.value > 100) return { issuance: null, created: false, reservedNumber: counter.value };
  try { const issuance = await FoundingCreatorIssuance.create({ creatorId, number: counter.value, status: "active", grantedAt: now, grantedBy: actorId, audit: [{ action: "grant", actor: actorId, at: now }] }); return { issuance, created: true, reservedNumber: counter.value }; } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === 11000) { const winner = await FoundingCreatorIssuance.findOne({ creatorId }); if (winner) return { issuance: winner, created: false, reservedNumber: counter.value }; } throw error; }
}
