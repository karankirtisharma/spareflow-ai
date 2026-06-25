export function formatINR(value: number): string {
  if (value >= 100000) {
    const lakhs = value / 100000;
    // Show 2 decimal places if needed
    return `₹${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}
