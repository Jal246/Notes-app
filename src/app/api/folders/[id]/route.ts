import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: { id: string };
};

export async function GET(_: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({
        where: { id },
        include: {
            notes: {
                orderBy: [
                    { pinned: "desc" },
                    { createdAt: "desc" }
                ]
            }
        }
    });

    if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(folder);
}

export async function PUT(request: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const { name, color } = body ?? {};

    if (!name) {
        return NextResponse.json({ error: "Missing folder name" }, { status: 400 });
    }

    const folder = await prisma.folder.update({
        where: { id },
        data: { name, color },
        include: {
            notes: true
        }
    });
    return NextResponse.json(folder);
}

export async function DELETE(_: Request, { params }: Params) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        // First, move all notes in this folder to uncategorized (folderId = null)
        await prisma.note.updateMany({
            where: { folderId: id },
            data: { folderId: null }
        });

        // Then delete the folder
        await prisma.folder.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
}
