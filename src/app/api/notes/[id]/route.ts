import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const note = await prisma.note.findUnique({
        where: { id },
        include: {
            folder: true
        }
    });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(note);
}

export async function PUT(request: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    const { title, content, pinned, tags, folderId } = body ?? {};
    if (!title || !content) {
        return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }
    const updateData: any = { title, content };
    if (typeof pinned === 'boolean') updateData.pinned = pinned;
    if (typeof tags === 'string') updateData.tags = tags;
    if (folderId !== undefined) updateData.folderId = folderId;

    const note = await prisma.note.update({
        where: { id },
        data: updateData,
        include: {
            folder: true
        }
    });
    return NextResponse.json(note);
}

export async function DELETE(_: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        // Get the note before deleting
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Calculate expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Move to deleted notes
        await prisma.deletedNote.create({
            data: {
                title: note.title,
                content: note.content,
                pinned: note.pinned,
                tags: note.tags,
                folderId: note.folderId,
                originalId: note.id,
                expiresAt: expiresAt
            }
        });

        // Delete from active notes
        await prisma.note.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
