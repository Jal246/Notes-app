import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: { id: string };
};

export async function GET(_: Request, { params }: Params) {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(note);
}

export async function PUT(request: Request, { params }: Params) {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    const { title, content } = body ?? {};
    if (!title || !content) {
        return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }
    const note = await prisma.note.update({ where: { id }, data: { title, content } });
    return NextResponse.json(note);
}

export async function DELETE(_: Request, { params }: Params) {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}


