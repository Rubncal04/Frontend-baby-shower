export type GuestType = "familia" | "amigos";
export type GiftTier = "costoso" | "economico" | "oculto";
export type AttendanceStatus = boolean | null;

export type EventInfo = {
  babyName: string;
  title: string;
  tagline: string;
  subtitle: string;
  date: string;
  time: string;
  dateLabel: string;
  address: string;
  giftListTitle: string;
  giftListFooter: string;
  identifyHint: string;
};

export type PublicMember = {
  id: string;
  name: string;
  attending: AttendanceStatus;
  hasPhone: boolean;
};

export type PublicGuest = {
  id: string;
  name: string;
  type: GuestType;
  groupKey: string;
  groupName: string;
  attending: AttendanceStatus;
};

export type PublicGift = {
  id: string;
  name: string;
  icon: string;
  order: number;
  reserved: boolean;
  reservedByGroup: boolean;
};

export type GroupReservation = {
  giftId: string;
  giftName: string;
  reservedByName: string | null;
};

export type GroupPayload = {
  type: GuestType;
  groupKey: string;
  groupName: string;
  identifyHint: string;
  selectedGuestId: string | null;
  members: PublicMember[];
  groupReservation: GroupReservation | null;
  gifts: PublicGift[];
};

export type IdentifyResponse = GroupPayload;

export type SessionResponse = GroupPayload & {
  token: string;
  guest: PublicGuest;
};

export type MeResponse = GroupPayload & {
  guest: PublicGuest;
};

export type AdminOverview = {
  event: EventInfo;
  guests: {
    total: number;
    attending: number;
    notAttending: number;
    pending: number;
  };
  gifts: {
    total: number;
    visible: number;
    reserved: number;
    available: number;
    hiddenReserved: number;
  };
};

export type AdminGuest = {
  id: string;
  name: string;
  phone: string | null;
  type: GuestType;
  groupKey: string;
  groupName: string;
  attending: AttendanceStatus;
  attendingAt: string | null;
  hasPhone: boolean;
};

export type AdminGuestGroup = {
  type: GuestType;
  groupKey: string;
  groupName: string;
  members: AdminGuest[];
};

export type AdminGift = {
  id: string;
  name: string;
  icon: string;
  order: number;
  tier: GiftTier;
  visible: boolean;
  preReserved: boolean;
  reserved: boolean;
  reservedByGuestId: string | null;
  reservedByName: string | null;
  reservedByGroupKey: string | null;
  reservedAt: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
