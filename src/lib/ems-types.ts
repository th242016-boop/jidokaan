export type EmsPackageState =
  | "preparing"
  | "registration_unknown"
  | "registration_failed"
  | "awaiting_dropoff"
  | "in_transit"
  | "delivered"
  | "customs_delay"
  | "delivery_failed"
  | "returned";
export type EmsRecipient = {
  englishConfirmed: boolean;
  name: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  email: string;
  phone: string;
  countryCallingCode: string;
  areaCode: string;
  phone1: string;
  phone2: string;
  taxId: string;
  vatId: string;
};
export type EmsItem = {
  sourceItemIndex: number;
  descriptionEn: string;
  hsCode: string;
  originCountry: string;
  quantity: number;
  declaredValue: number;
  currency: string;
  netWeightGrams: number | null;
};
export type EmsTrackingEvidence = {
  provider: "koreapost";
  tracking: string;
  checkedAt: string;
  verified: true;
  state: "in_transit" | "delivered" | "customs_delay" | "delivery_failed" | "returned" | "unknown";
  deliveredAt?: string;
  events: Array<{ occurredAt: string; status: string; location: string; detail: string }>;
  rawStatus: string;
};
export type EmsPackage = {
  id: string;
  state: EmsPackageState;
  grossWeightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  items: EmsItem[];
  tracking?: string;
  registrationReference?: string;
  registeredAt?: string;
  handedOverAt?: string;
  deliveredAt?: string;
  registrationNote?: string;
  /** Existing physical posting confirmed by admin; timestamps record that confirmation. */
  postingRecordSource?: "admin_confirmation";
  trackingCheck?: {
    checkedAt: string;
    outcome: "ok" | "unavailable" | "unknown";
    message?: string;
    evidence?: EmsTrackingEvidence;
  };
};
export type EmsAudit = {
  at: string;
  action: string;
  packageId?: string;
  message: string;
  operationId: string;
  fingerprint?: string;
};
export type EmsFulfillment = {
  version: number;
  method: "ems_counter_dropoff";
  createdAt: string;
  updatedAt: string;
  recipient: EmsRecipient;
  packages: EmsPackage[];
  audit: EmsAudit[];
};
export type EmsIssue = { field: string; message: string; packageId?: string };
export type EmsCapabilities = {
  registration: { enabled: false; mode: "manual"; reason: string };
  tracking: { enabled: boolean; reason: string };
  smartRegistrationUrl: string;
  officialFormatUrl: string;
};
export type EmsAction =
  | { action: "save"; recipient: EmsRecipient; packages: EmsPackage[] }
  | {
      action: "register";
      packageId: string;
      tracking: string;
      reference: string;
      confirmed: boolean;
    }
  | {
      action: "record_posted";
      packageId: string;
      tracking: string;
      reference?: string;
      confirmed: boolean;
    }
  | { action: "uncertain" | "failed"; packageId: string; note: string }
  | {
      action: "reconcile";
      packageId: string;
      outcome: "not_registered" | "registered";
      reference: string;
      tracking?: string;
      confirmed: boolean;
    }
  | { action: "handover"; packageIds: string[]; confirmed: boolean };
export const EMS_STATE_LABEL: Record<EmsPackageState, string> = {
  preparing: "EMS 정보 확인",
  registration_unknown: "접수 여부 확인 필요",
  registration_failed: "접수 실패",
  awaiting_dropoff: "우체국 제출 대기",
  in_transit: "배송중",
  delivered: "배송완료",
  customs_delay: "통관 지연",
  delivery_failed: "배달 실패",
  returned: "반송",
};
