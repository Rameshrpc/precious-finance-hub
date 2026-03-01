/**
 * Indian-locale formatting utilities
 * All currency uses Intl.NumberFormat('en-IN')
 */

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterDecimals = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format to Indian currency: formatINR(1234567) → "₹12,34,567"
 */
export function formatINR(amount: number, decimals = 0): string {
  if (decimals > 0) return currencyFormatterDecimals.format(amount);
  return currencyFormatter.format(amount);
}

/**
 * Compact Indian format: formatCompact(1234567) → "₹12.3L"
 * ≥1Cr → "₹X.XCr", ≥1L → "₹X.XL", ≥1K → "₹X.XK"
 */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}

/**
 * Weight: formatWeight(35.25) → "35.250g"
 */
export function formatWeight(grams: number, decimals = 3): string {
  return `${grams.toFixed(decimals)}g`;
}

/**
 * Date: formatDate(date) → "DD/MM/YYYY"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Phone: formatPhone("9876543210") → "+91 98765 43210"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length > 10 ? digits.slice(-10) : digits;
  if (num.length !== 10) return phone;
  return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
}

/**
 * Aadhaar mask: maskAadhaar("123456781234") → "XXXX-XXXX-1234"
 */
export function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, "");
  if (digits.length !== 12) return aadhaar;
  return `XXXX-XXXX-${digits.slice(8)}`;
}

/**
 * PAN mask: maskPAN("ABCDE1234F") → "XXXXX1234X"
 */
export function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan;
  return `XXXXX${pan.slice(5, 9)}${pan.charAt(9)}`;
}
