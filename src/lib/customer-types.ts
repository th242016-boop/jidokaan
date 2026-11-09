/** Client-safe contracts for the admin member directory. */
export type SignupDevice = "pc" | "mobile" | "tablet" | "unknown";

export type MemberAttribution = {
  device: SignupDevice;
  source: string;
  medium: string;
  campaign: string;
  keyword: string;
  landing: string;
  referrerHost: string;
  capturedAt: string;
};

export type StoreMember = {
  id: string;
  name: string;
  /** Empty when the provider did not supply a real contact email. */
  email: string;
  emailUnavailable: boolean;
  phone: string;
  verified: boolean;
  createdAt: string;
  providers: string[];
  providerIds: string[];
  /** null means no signup attribution was recorded; do not infer old history. */
  attribution: MemberAttribution | null;
};

export type MemberFilters = {
  page?: number | string;
  pageSize?: number | string;
  q?: string;
  searchField?: string;
  provider?: string;
  device?: string;
  source?: string;
  from?: string;
  to?: string;
};

export type MemberListResponse = {
  members: StoreMember[];
  total: number;
  allTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filterOptions: { sources: string[] };
};
