import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        // Get the deleted note
        const deletedNote = await prisma.deletedNote.findUnique({
            where: { id }
        });

        if (!deletedNote) {
            return NextResponse.json({ error: "Deleted note not found" }, { status: 404 });
        }

        // Check if it's expired
        if (deletedNote.expiresAt < new Date()) {
            return NextResponse.json({ error: "Note has expired" }, { status: 410 });
        }

        // Restore the note
        const restoredNote = await prisma.note.create({
            data: {
                title: deletedNote.title,
                content: deletedNote.content,
                pinned: deletedNote.pinned,
                tags: deletedNote.tags,
                folderId: deletedNote.folderId
            }
        });

        // Remove from deleted notes
        await prisma.deletedNote.delete({
            where: { id }
        });

        return NextResponse.json(restoredNote);
    } catch (error) {
        return NextResponse.json({ error: "Failed to restore note" }, { status: 500 });
    }
}
