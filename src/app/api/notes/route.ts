import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const notes = await prisma.note.findMany({
            include: {
                folder: true
            },
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" }
            ],
        });
        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content, pinned = false, tags = "", folderId } = body ?? {};
        if (!title || !content) {
            return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
        }
        const note = await prisma.note.create({
            data: { title, content, pinned, tags, folderId },
            include: {
                folder: true
            }
        });
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}



