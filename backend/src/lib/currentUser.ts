// src/lib/currentUser.ts
// In production this would validate a session token (e.g. via Stytch).
// For this prototype we always return the seeded demo user.
export function getCurrentUserId(): string {
  return "user_seed_001";
}
