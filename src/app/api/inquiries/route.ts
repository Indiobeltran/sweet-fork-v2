import { NextResponse } from "next/server";

import { submitInquiry } from "@/lib/inquiries/submit";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = formData.get("payload");

    if (typeof payload !== "string") {
      return NextResponse.json(
        {
          error: "Missing inquiry payload.",
        },
        { status: 400 },
      );
    }

    const files = formData
      .getAll("inspirationFiles")
      .filter((entry): entry is File => entry instanceof File);

    const result = await submitInquiry(JSON.parse(payload), files);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Inquiry submission failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We could not submit the inquiry right now.",
      },
      { status: 500 },
    );
  }
}
