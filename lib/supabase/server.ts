import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Creates a client that authenticates via Bearer token from Authorization header.
 * Used by API routes called from external clients or test scripts.
 */
export function createClientFromToken(accessToken: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}

/**
 * Resolves a Supabase client from either cookies (browser) or Authorization header (API/test).
 * Call this inside Route Handlers by passing `request.headers`.
 */
export async function createClientFromRequest(
  requestHeaders: Headers
): Promise<ReturnType<typeof createClientFromToken>> {
  const authHeader = requestHeaders.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return createClientFromToken(authHeader.slice(7));
  }
  // Fall back to cookie-based client (cast is safe — same shape)
  return createClient() as unknown as ReturnType<typeof createClientFromToken>;
}
