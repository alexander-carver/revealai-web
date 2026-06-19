import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureDeviceAuthUser,
  ensureEmailAuthUser,
  findAuthUserByEmail,
} from "@/lib/auth-admin";

export interface BillingIdentityInput {
  userId?: string | null;
  deviceId?: string | null;
  email?: string | null;
}

export interface ResolvedBillingIdentity {
  userId: string;
  email: string | null;
  deviceId: string | null;
}

export async function resolveBillingIdentity(
  supabase: SupabaseClient,
  input: BillingIdentityInput
): Promise<ResolvedBillingIdentity | null> {
  const normalizedEmail = input.email?.trim().toLowerCase() || null;

  if (input.userId) {
    return {
      userId: input.userId,
      email: normalizedEmail,
      deviceId: input.deviceId ?? null,
    };
  }

  if (input.deviceId) {
    const deviceIdentity = await ensureDeviceAuthUser(supabase, input.deviceId);
    return {
      userId: deviceIdentity.userId,
      email: normalizedEmail ?? deviceIdentity.deviceEmail,
      deviceId: input.deviceId,
    };
  }

  if (normalizedEmail) {
    const existingUser = await findAuthUserByEmail(supabase, normalizedEmail);
    if (existingUser?.id) {
      return {
        userId: existingUser.id,
        email: normalizedEmail,
        deviceId: null,
      };
    }

    const emailIdentity = await ensureEmailAuthUser(supabase, normalizedEmail);
    return {
      userId: emailIdentity.userId,
      email: emailIdentity.email,
      deviceId: null,
    };
  }

  return null;
}
