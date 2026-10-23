/**
 * HAVLOOK — Seller KYC service boundary.
 *
 * All KYC operations go through the authenticated Spring Boot backend.
 * Supabase secret keys must never be exposed in frontend code.
 */

import { apiRequest, type ApiResult } from "@/lib/api";

export type BusinessType =
  | "PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "LLP"
  | "PRIVATE_LIMITED"
  | "PUBLIC_LIMITED"
  | "ONE_PERSON_COMPANY"
  | "TRUST"
  | "SOCIETY"
  | "OTHER";

export type KycStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type KycDocumentType =
  | "pan"
  | "aadhaar"
  | "gst"
  | "registration"
  | "address";

export interface SellerKycResponse {
  id: number;
  sellerId: number;
  businessType: BusinessType;
  dateOfBirth: string;
  gstNumber?: string | null;
  gstDocumentUrl?: string | null;
  registrationNumber?: string | null;
  registrationDocumentUrl?: string | null;
  ownerName: string;
  panNumber: string;
  panDocumentUrl?: string | null;
  aadhaarNumber?: string | null;
  aadhaarDocumentUrl?: string | null;
  businessAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressDocumentUrl?: string | null;
  status: KycStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SellerKycRequest {
  businessType: BusinessType;
  dateOfBirth: string;
  gstNumber?: string;
  registrationNumber?: string;
  ownerName: string;
  panNumber: string;
  aadhaarNumber?: string;
  businessAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface KycDocumentFiles {
  panDocument?: File | null;
  aadhaarDocument?: File | null;
  gstDocument?: File | null;
  registrationDocument?: File | null;
  addressDocument?: File | null;
}

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrap<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as Envelope<T>;

    if (envelope.data !== undefined && envelope.data !== null) {
      return envelope.data;
    }
  }

  return fallback;
}

const ENDPOINTS = {
  kyc: "/api/v1/sellers/kyc",
  status: "/api/v1/sellers/kyc/status",
  documents: "/api/v1/sellers/kyc/documents",
  signedDocumentUrl: (documentType: KycDocumentType) =>
    `/api/v1/sellers/kyc/documents/${documentType}/signed-url`,
} as const;

/** GET /api/v1/sellers/kyc */
export async function getMyKyc(
  signal?: AbortSignal,
): Promise<ApiResult<SellerKycResponse>> {
  const res = await apiRequest<
    Envelope<SellerKycResponse> | SellerKycResponse
  >(ENDPOINTS.kyc, {
    method: "GET",
    signal,
  });

  if (!res.ok) return res;

  const kyc = unwrap<SellerKycResponse | null>(res.data, null);

  if (!kyc) {
    return {
      ok: false,
      status: res.status,
      message: "Empty KYC response.",
    };
  }

  return { ok: true, status: res.status, data: kyc };
}

/** GET /api/v1/sellers/kyc/status */
export async function getMyKycStatus(
  signal?: AbortSignal,
): Promise<ApiResult<SellerKycResponse>> {
  const res = await apiRequest<
    Envelope<SellerKycResponse> | SellerKycResponse
  >(ENDPOINTS.status, {
    method: "GET",
    signal,
  });

  if (!res.ok) return res;

  const kyc = unwrap<SellerKycResponse | null>(res.data, null);

  if (!kyc) {
    return {
      ok: false,
      status: res.status,
      message: "Empty KYC response.",
    };
  }

  return { ok: true, status: res.status, data: kyc };
}

/** POST /api/v1/sellers/kyc */
export async function submitKyc(
  payload: SellerKycRequest,
  signal?: AbortSignal,
): Promise<ApiResult<SellerKycResponse>> {
  const res = await apiRequest<
    Envelope<SellerKycResponse> | SellerKycResponse
  >(ENDPOINTS.kyc, {
    method: "POST",
    body: payload,
    signal,
  });

  if (!res.ok) return res;

  const kyc = unwrap<SellerKycResponse | null>(res.data, null);

  if (!kyc) {
    return {
      ok: false,
      status: res.status,
      message: "Empty KYC response.",
    };
  }

  return { ok: true, status: res.status, data: kyc };
}

/** PUT /api/v1/sellers/kyc */
export async function updateKyc(
  payload: SellerKycRequest,
  signal?: AbortSignal,
): Promise<ApiResult<SellerKycResponse>> {
  const res = await apiRequest<
    Envelope<SellerKycResponse> | SellerKycResponse
  >(ENDPOINTS.kyc, {
    method: "PUT",
    body: payload,
    signal,
  });

  if (!res.ok) return res;

  const kyc = unwrap<SellerKycResponse | null>(res.data, null);

  if (!kyc) {
    return {
      ok: false,
      status: res.status,
      message: "Empty KYC response.",
    };
  }

  return { ok: true, status: res.status, data: kyc };
}

/**
 * POST /api/v1/sellers/kyc/documents
 * Multipart upload. Backend accepts PDF files up to 2 MB each.
 */
export async function uploadKycDocuments(
  files: KycDocumentFiles,
  signal?: AbortSignal,
): Promise<ApiResult<SellerKycResponse>> {
  const form = new FormData();

  const entries: Array<
    [keyof KycDocumentFiles, File | null | undefined]
  > = [
    ["panDocument", files.panDocument],
    ["aadhaarDocument", files.aadhaarDocument],
    ["gstDocument", files.gstDocument],
    ["registrationDocument", files.registrationDocument],
    ["addressDocument", files.addressDocument],
  ];

  for (const [key, file] of entries) {
    if (file) form.append(key, file);
  }

  const res = await apiRequest<
    Envelope<SellerKycResponse> | SellerKycResponse
  >(ENDPOINTS.documents, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) return res;

  const kyc = unwrap<SellerKycResponse | null>(res.data, null);

  if (!kyc) {
    return {
      ok: false,
      status: res.status,
      message: "Empty KYC response.",
    };
  }

  return { ok: true, status: res.status, data: kyc };
}

/**
 * GET /api/v1/sellers/kyc/documents/{documentType}/signed-url
 *
 * Requests a temporary signed URL from the authenticated backend.
 * The backend resolves the seller from the JWT.
 * Never put Supabase secret keys in frontend code.
 */
export async function getKycDocumentSignedUrl(
  documentType: KycDocumentType,
  signal?: AbortSignal,
): Promise<ApiResult<string>> {
  const res = await apiRequest<Envelope<string> | string>(
    ENDPOINTS.signedDocumentUrl(documentType),
    {
      method: "GET",
      signal,
    },
  );

  if (!res.ok) return res;

  const signedUrl = unwrap<string | null>(res.data, null);

  if (typeof signedUrl !== "string" || !signedUrl.trim()) {
    return {
      ok: false,
      status: res.status,
      message: "The server did not return a signed document URL.",
    };
  }

  return {
    ok: true,
    status: res.status,
    data: signedUrl,
  };
}

export type { ApiResult };
