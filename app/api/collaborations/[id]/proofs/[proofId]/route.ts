import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAdminState } from "@/lib/admin";
import { participantRole } from "@/lib/collaboration-access";
import { connectDB } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { ProofUpload } from "@/lib/models/ProofUpload";
import { User } from "@/lib/models/User";
import { uploadsBucket } from "@/lib/private-uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; proofId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await connectDB();
  const { id, proofId } = await params;
  const [user, collaboration, proof, admin] = await Promise.all([User.findOne({ clerkId: userId }).exec(), BrandInquiry.findById(id).exec(), ProofUpload.findOne({ _id: proofId, collaborationId: id }).select("+objectKey mimeType").exec(), getAdminState()]);
  if (!collaboration || !proof) return NextResponse.json({ error: "Proof not found." }, { status: 404 });
  const role = user ? await participantRole(collaboration, user) : null;
  if (!role && !admin.isAdmin) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const object = await (await uploadsBucket()).get(proof.objectKey);
    if (!object) return NextResponse.json({ error: "Proof file not found." }, { status: 404 });
    return new Response(object.body, { headers: { "Content-Type": proof.mimeType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("BRANZZO_UPLOADS") ? error.message : "Could not retrieve proof.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
