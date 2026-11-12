import { NextRequest } from "next/server";
import { archiveCardHandler } from "@/lib/services/card-archiver.service";

export async function DELETE(req: NextRequest) {
  return archiveCardHandler(req);
}

export async function POST(req: NextRequest) {
  return archiveCardHandler(req);
}
