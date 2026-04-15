export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://slotora.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email" },
                { status: 400, headers: corsHeaders }
            );
        }

        const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.LOOPS_API_KEY,
            },
            body: JSON.stringify({
                email,
                source: "coming-soon",
                mailingLists: { cmnl8l3ftuhyj0iua29t51n7j: true },
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            console.error("Loops error:", res.status, errorBody);
            throw new Error("Loops error");
        }

        return NextResponse.json(
            { success: true },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500, headers: corsHeaders }
        );
    }
}