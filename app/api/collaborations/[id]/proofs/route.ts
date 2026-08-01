import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { participantRole } from "@/lib/collaboration-access";
import { canRevealCollaborationContactEmail } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { ProofUpload } from "@/lib/models/ProofUpload";
import { User } from "@/lib/models/User";
import { inspectProofImage, MAX_PROOF_FILE_SIZE, sanitizedFilename, uploadsBucket } from "@/lib/private-uploads";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const [user, collaboration] = await Promise.all([User.findOne({ clerkId }).exec(), BrandInquiry.findById(id).exec()]);
  if (!user || !collaboration) return NextResponse.json({ error: "Collaboration not found." }, { status: 404 });
  const role = await participantRole(collaboration, user);
  if (!role) return NextResponse.json({ error: "You are not a participant in this collaboration." }, { status: 403 });
  if (!canRevealCollaborationContactEmail(collaboration.status)) return NextResponse.json({ error: "Proof uploads are available only after acceptance." }, { status: 400 });

  const form = await request.formData();
  const proofType = form.get("proofType") === "campaign" ? "campaign" : "payment";
  if ((proofType === "payment" && role !== "brand") || (proofType === "campaign" && role !== "creator")) return NextResponse.json({ error: "This proof type cannot be submitted by your role." }, { status: 403 });
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  const maxFiles = proofType === "payment" ? 1 : 5;
  if (!files.length || files.length > maxFiles) return NextResponse.json({ error: `Submit between 1 and ${maxFiles} screenshot${maxFiles > 1 ? "s" : ""}.` }, { status: 400 });
  const transactionId = String(form.get("transactionId") ?? "").trim().slice(0, 120);
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const saved: string[] = [];
  try {
    const bucket = await uploadsBucket();
    for (const file of files) {
      if (file.size < 1 || file.size > MAX_PROOF_FILE_SIZE) return NextResponse.json({ error: "Each screenshot must be 1 MB or smaller." }, { status: 413 });
      const buffer = await file.arrayBuffer();
      const image = inspectProofImage(new Uint8Array(buffer), file.type);
      if (!image) return NextResponse.json({ error: "Only genuine JPEG, PNG, or WebP images are allowed." }, { status: 415 });
      const folder = proofType === "payment" ? "payment-proofs" : "campaign-proofs";
      const key = `collaborations/${collaboration._id}/${folder}/${randomUUID()}.${image.extension}`;
      await bucket.put(key, buffer, { httpMetadata: { contentType: image.mimeType }, customMetadata: { originalFilename: sanitizedFilename(file.name) } });
      saved.push(key);
      const record = await ProofUpload.create({ collaborationId: collaboration._id, uploaderUserId: user._id, uploaderClerkId: clerkId, objectKey: key, originalFilename: sanitizedFilename(file.name), mimeType: image.mimeType, fileSize: file.size, proofType, transactionId, note });
      if (proofType === "payment") return NextResponse.json({ ok: true, proofIds: [record._id.toString()] });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("BRANZZO_UPLOADS")) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ error: "Could not store proof securely." }, { status: 500 });
  }
}
