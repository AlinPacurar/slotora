"use client";
// app/invite/[token]/page.js
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AcceptInvitePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const token = params.token;

    const [state, setState] = useState("idle"); // idle | accepting | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            // Redirect to login, then come back
            signIn(undefined, { callbackUrl: `/invite/${token}` });
            return;
        }
        if (status === "authenticated" && state === "idle") {
            acceptInvite();
        }
    }, [status]);

    async function acceptInvite() {
        setState("accepting");
        const res = await fetch(`/api/invite/${token}`, { method: "POST" });
        const json = await res.json();
        if (res.ok) {
            setState("success");
            setTimeout(() => router.push(`/dashboard/teams/${json.groupId}`), 1800);
        } else {
            setState("error");
            setMessage(json.error ?? "Something went wrong.");
        }
    }

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-xl p-8 w-full max-w-sm text-center">
                <img src="/logo.svg" alt="Slotora" className="w-10 h-10 rounded-xl mx-auto mb-6" />

                {(state === "idle" || state === "accepting") && (
                    <>
                        <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                        <div className="text-sm font-semibold text-stone-700">Joining group…</div>
                    </>
                )}

                {state === "success" && (
                    <>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div className="text-base font-bold text-stone-900 mb-1">You're in!</div>
                        <div className="text-sm text-stone-400">Redirecting to your group…</div>
                    </>
                )}

                {state === "error" && (
                    <>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <div className="text-base font-bold text-stone-900 mb-2">Invite issue</div>
                        <div className="text-sm text-stone-500 mb-6">{message}</div>
                        <a href="/dashboard/teams"
                            className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition">
                            Go to Groups
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}