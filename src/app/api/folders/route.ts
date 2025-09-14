import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const folders = await prisma.folder.findMany({
            include: {
                notes: {
                    orderBy: [
                        { pinned: "desc" },
                        { createdAt: "desc" }
                    ]
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(folders);
    } catch (error) {
        console.error("Error fetching folders:", error);
        return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, color = "#3B82F6" } = body ?? {};

        if (!name) {
            return NextResponse.json({ error: "Missing folder name" }, { status: 400 });
        }

        const folder = await prisma.folder.create({
            data: { name, color },
            include: {
                notes: true
            }
        });
        return NextResponse.json(folder, { status: 201 });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }
}
