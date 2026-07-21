/**
 * fetch-helpers.ts — server-side fetchers for the two verified live APIs. TEMPLATE.
 *
 * ⚠️ SERVER ONLY. These read secret keys from env — never import into a client
 * component. Call from route handlers / Server Components / scripts.
 *
 * Env (.env.local):
 *   FCA_API_EMAIL           registration email for the FCA Register API
 *   FCA_API_KEY             key from your FCA developer profile
 *   COMPANIES_HOUSE_API_KEY REST API key from developer.company-information.service.gov.uk
 */

/* ================================================================== *
 * FCA Financial Services Register API
 * Base: https://register.fca.org.uk/services/V0.1/
 * Auth headers: X-Auth-Email + X-Auth-Key
 * Rate limit: 50 requests / 10s (free, no SLA)
 * ================================================================== */

const FCA_BASE = "https://register.fca.org.uk/services/V0.1";

function fcaHeaders(): HeadersInit {
  const email = process.env.FCA_API_EMAIL;
  const key = process.env.FCA_API_KEY;
  if (!email || !key) throw new Error("FCA_API_EMAIL / FCA_API_KEY not set");
  return { "X-Auth-Email": email, "X-Auth-Key": key, Accept: "application/json" };
}

async function fcaGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${FCA_BASE}${path}`, {
    headers: fcaHeaders(),
    // FCA data changes slowly; cache 5 min to stay under the rate limit during a demo.
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`FCA ${path} -> ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Search firms / individuals / funds by name. */
export function fcaSearch(query: string, type: "firm" | "individual" | "fund" = "firm") {
  return fcaGet(`/Search?q=${encodeURIComponent(query)}&type=${type}`);
}

/** Core firm record by Firm Reference Number. */
export const fcaGetFirm = (frn: string | number) => fcaGet(`/Firm/${frn}`);
/** Regulated activities the firm is permitted to carry out. */
export const fcaGetPermissions = (frn: string | number) => fcaGet(`/Firm/${frn}/Permissions`);
/** Approved persons at the firm. */
export const fcaGetIndividuals = (frn: string | number) => fcaGet(`/Firm/${frn}/Individuals`);
/** Trading / other names. */
export const fcaGetNames = (frn: string | number) => fcaGet(`/Firm/${frn}/Names`);
/** Disciplinary history. */
export const fcaGetDisciplinary = (frn: string | number) => fcaGet(`/Firm/${frn}/DisciplinaryHistory`);
/** Address. */
export const fcaGetAddress = (frn: string | number) => fcaGet(`/Firm/${frn}/Address`);
/** Individual record + controlled functions by Individual Reference Number. */
export const fcaGetIndividual = (irn: string | number) => fcaGet(`/Individuals/${irn}`);
export const fcaGetControlledFunctions = (irn: string | number) => fcaGet(`/Individuals/${irn}/CF`);

/* ================================================================== *
 * Companies House REST API
 * Base: https://api.company-information.service.gov.uk
 * Auth: HTTP Basic — API key as username, empty password.
 * ================================================================== */

const CH_BASE = "https://api.company-information.service.gov.uk";

function chHeaders(): HeadersInit {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new Error("COMPANIES_HOUSE_API_KEY not set");
  // Basic auth: base64("<key>:")
  const token = Buffer.from(`${key}:`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json" };
}

async function chGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${CH_BASE}${path}`, {
    headers: chHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`CH ${path} -> ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Search companies by name/number. */
export function chSearchCompanies(query: string, itemsPerPage = 20) {
  return chGet(`/search/companies?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}`);
}
/** Full company profile by company number. */
export const chGetCompany = (companyNumber: string) => chGet(`/company/${companyNumber}`);
/** Officers (directors / secretaries). */
export const chGetOfficers = (companyNumber: string) => chGet(`/company/${companyNumber}/officers`);
/** People with significant control. */
export const chGetPSC = (companyNumber: string) =>
  chGet(`/company/${companyNumber}/persons-with-significant-control`);
/** Filing history. */
export const chGetFilingHistory = (companyNumber: string) =>
  chGet(`/company/${companyNumber}/filing-history`);

/* ================================================================== *
 * Convenience: cross-reference an FCA firm with its Companies House record.
 * FCA firm records often carry a Companies House number; this stitches them.
 * ================================================================== */

export async function fcaFirmWithCompaniesHouse(frn: string | number) {
  const firm = (await fcaGetFirm(frn)) as { Data?: Array<{ "Companies House Number"?: string }> };
  const chNumber = firm?.Data?.[0]?.["Companies House Number"];
  const company = chNumber ? await chGetCompany(chNumber).catch(() => null) : null;
  return { firm, company };
}
