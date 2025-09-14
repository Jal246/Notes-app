import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get all deleted notes that haven't expired
        const deletedNotes = await prisma.deletedNote.findMany({
            where: {
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                folder: true
            },
            orderBy: {
                deletedAt: 'desc'
            }
        });
        return NextResponse.json(deletedNotes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch deleted notes" }, { status: 500 });
    }
}
