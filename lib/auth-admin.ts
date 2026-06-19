import { randomBytes } from "crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const USERS_PAGE_SIZE = 200;
const MAX_USER_PAGES = 20;

export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const match = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (match) {
      return match;
    }

    if (users.length < USERS_PAGE_SIZE) {
      break;
    }
  }

  return null;
}

export async function ensureDeviceAuthUser(
  supabase: SupabaseClient,
  deviceId: string
): Promise<{ userId: string; deviceEmail: string; created: boolean }> {
  const deviceEmail = `device_${deviceId}@revealai.device`;
  let existingUser = await findAuthUserByEmail(supabase, deviceEmail);

  if (existingUser) {
    const currentMetadata = existingUser.user_metadata ?? {};
    const shouldRepairPassword = currentMetadata.device_password_managed !== true;
    const shouldRepairMetadata =
      currentMetadata.device_id !== deviceId ||
      currentMetadata.is_device_user !== true;

    if (shouldRepairPassword || shouldRepairMetadata) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          ...(shouldRepairPassword ? { password: deviceId } : {}),
          email_confirm: true,
          user_metadata: {
            ...currentMetadata,
            device_id: deviceId,
            is_device_user: true,
            device_password_managed: true,
          },
        }
      );

      if (updateError) {
        throw updateError;
      }
    }

    return {
      userId: existingUser.id,
      deviceEmail,
      created: false,
    };
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: deviceEmail,
      password: deviceId,
      email_confirm: true,
      user_metadata: {
        device_id: deviceId,
        is_device_user: true,
        device_password_managed: true,
      },
    });

  if (createError) {
    const isDuplicateError =
      createError.message?.toLowerCase().includes("already exists") ||
      createError.message?.toLowerCase().includes("already registered");

    if (!isDuplicateError) {
      throw createError;
    }

    existingUser = await findAuthUserByEmail(supabase, deviceEmail);
    if (!existingUser) {
      throw createError;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: deviceId,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          device_id: deviceId,
          is_device_user: true,
          device_password_managed: true,
        },
      }
    );

    if (updateError) {
      throw updateError;
    }

    return {
      userId: existingUser.id,
      deviceEmail,
      created: false,
    };
  }

  if (!createdUser.user?.id) {
    throw new Error("Device user creation did not return a user id");
  }

  return {
    userId: createdUser.user.id,
    deviceEmail,
    created: true,
  };
}

export async function ensureEmailAuthUser(
  supabase: SupabaseClient,
  email: string
): Promise<{ userId: string; email: string; created: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  let existingUser = await findAuthUserByEmail(supabase, normalizedEmail);

  if (existingUser) {
    return {
      userId: existingUser.id,
      email: normalizedEmail,
      created: false,
    };
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: randomBytes(32).toString("hex"),
      email_confirm: true,
    });

  if (createError) {
    const isDuplicateError =
      createError.message?.toLowerCase().includes("already exists") ||
      createError.message?.toLowerCase().includes("already registered");

    if (!isDuplicateError) {
      throw createError;
    }

    existingUser = await findAuthUserByEmail(supabase, normalizedEmail);
    if (!existingUser) {
      throw createError;
    }

    return {
      userId: existingUser.id,
      email: normalizedEmail,
      created: false,
    };
  }

  if (!createdUser.user?.id) {
    throw new Error("Email user creation did not return a user id");
  }

  return {
    userId: createdUser.user.id,
    email: normalizedEmail,
    created: true,
  };
}
