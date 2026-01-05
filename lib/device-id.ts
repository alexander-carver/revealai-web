// Device ID management - creates a persistent device ID for each browser/device
// This allows subscriptions to be tied to devices, not emails (like mobile apps)

const DEVICE_ID_KEY = 'revealai_device_id';

/**
 * Gets or creates a device ID stored in localStorage
 * This ID persists across sessions and is unique per device/browser
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID (won't persist but that's ok)
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if we already have a device ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate a new device ID (UUID v4 format)
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🔑 Created new device ID:', deviceId);
  }

  return deviceId;
}

/**
 * Gets the existing device ID without creating one
 * Returns null if no device ID exists yet
 */
export function getExistingDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEVICE_ID_KEY);
}

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

