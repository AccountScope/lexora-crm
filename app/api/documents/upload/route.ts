import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadDocument } from "@/lib/api/documents";
import { documentUploadSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("file field missing");
    }
    const metadata = documentUploadSchema.parse(JSON.parse(String(formData.get("metadata") ?? "{}")));
    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await uploadDocument({
      ...metadata,
      fileName: file.name,
      buffer,
      contentType: file.type,
      uploadedBy: user.id,
    });

    return success({ data: document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
