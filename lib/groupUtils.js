// lib/groupUtils.js

/**
 * Generates a URL-safe slug from a group name + 4-char random suffix
 * e.g. "Football Team" → "football-team-a3x9"
 */
export function generateSlug(name) {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
        .replace(/\s+/g, '-')            // spaces → hyphens
        .replace(/-+/g, '-')             // collapse multiple hyphens
        .slice(0, 40)                    // max 40 chars for the base

    const suffix = Math.random().toString(36).slice(2, 6) // 4-char random e.g. "a3x9"
    return `${base}-${suffix}`
}

/**
 * Generates a short human-readable invite code
 * e.g. "XK9-TM2"
 */
export function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars (0/O, 1/I)
    const part = (len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${part(3)}-${part(3)}`
}