import { getAdminToken, getGuestToken } from "./storage";
import { ApiError } from "./types";
import type {
  AdminGift,
  AdminGuest,
  AdminGuestGroup,
  AdminOverview,
  EventInfo,
  IdentifyResponse,
  MeResponse,
  SessionResponse,
} from "./types";

const API_URL = "/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  guestToken?: string | null;
  adminToken?: string | null;
};

/** Extracts a human-readable message from a NestJS error payload. */
function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && message.length) return String(message[0]);
  return fallback;
}

/** Performs a JSON request against the invitation API. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const guestToken = options.guestToken ?? getGuestToken();
  const adminToken = options.adminToken ?? getAdminToken();
  if (guestToken) headers.set("x-guest-token", guestToken);
  if (adminToken) headers.set("Authorization", `Bearer ${adminToken}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      readErrorMessage(payload, `Request failed (${response.status})`),
    );
  }

  return payload as T;
}

/** Wakes a cold server before interactive requests. */
export async function pingHealth(): Promise<void> {
  try {
    await request("/health");
  } catch {
    // The UI still works if the ping fails; later requests surface the real error.
  }
}

/** Loads public invitation copy, date, and address. */
export function fetchEvent(): Promise<EventInfo> {
  return request<EventInfo>("/event");
}

/** Looks up a guest group by phone number. */
export function identifyGuest(phone: string): Promise<IdentifyResponse> {
  return request<IdentifyResponse>("/invite/identify", {
    method: "POST",
    body: { phone },
  });
}

/** Opens a guest session after choosing a name inside the matched group. */
export function openGuestSession(
  phone: string,
  guestId: string,
): Promise<SessionResponse> {
  return request<SessionResponse>("/invite/session", {
    method: "POST",
    body: { phone, guestId },
  });
}

/** Restores the current guest session. */
export function fetchGuestMe(): Promise<MeResponse> {
  return request<MeResponse>("/invite/me");
}

/** Saves whether the identified guest will attend. */
export function updateAttendance(attending: boolean): Promise<MeResponse> {
  return request<MeResponse>("/invite/attendance", {
    method: "PATCH",
    body: { attending },
  });
}

/** Reserves a gift for the guest's group. */
export function reserveGift(giftId: string): Promise<MeResponse> {
  return request<MeResponse>(`/invite/gifts/${giftId}/reserve`, {
    method: "POST",
  });
}

/** Releases the gift currently reserved by the guest's group. */
export function releaseGift(giftId: string): Promise<MeResponse> {
  return request<MeResponse>(`/invite/gifts/${giftId}/release`, {
    method: "POST",
  });
}

/** Authenticates the event owner and returns a JWT. */
export function adminLogin(
  email: string,
  password: string,
): Promise<{ token: string; email: string }> {
  return request("/admin/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Returns attendance and gift counters for the admin dashboard. */
export function fetchAdminOverview(): Promise<AdminOverview> {
  return request<AdminOverview>("/admin/overview");
}

/** Returns the guest checklist grouped by family/friends. */
export function fetchAdminGuests(): Promise<{ groups: AdminGuestGroup[] }> {
  return request("/admin/guests");
}

/** Updates a guest attendance from the admin checklist. */
export function updateAdminAttendance(
  guestId: string,
  attending: boolean | null,
): Promise<AdminGuest> {
  return request<AdminGuest>(`/admin/guests/${guestId}/attendance`, {
    method: "PATCH",
    body: { attending },
  });
}

/** Returns every gift, including the hidden pre-reserved crib. */
export function fetchAdminGifts(): Promise<{ gifts: AdminGift[] }> {
  return request("/admin/gifts");
}

/** Releases a gift reservation unless it is the pre-reserved crib. */
export function adminReleaseGift(giftId: string): Promise<AdminGift> {
  return request<AdminGift>(`/admin/gifts/${giftId}/release`, {
    method: "POST",
  });
}
