export function formatKes(amount: number): string {
  return `KES ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}