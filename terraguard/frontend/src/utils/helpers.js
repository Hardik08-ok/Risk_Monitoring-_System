// Risk level helpers
export function getRiskColor(level) {
  const map = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#d97706', LOW: '#65a30d', MINIMAL: '#16a34a' };
  return map[level] || '#6b7280';
}
export function getRiskBg(level) {
  const map = { CRITICAL: 'rgba(220,38,38,0.15)', HIGH: 'rgba(234,88,12,0.15)', MODERATE: 'rgba(217,119,6,0.15)', LOW: 'rgba(101,163,13,0.12)', MINIMAL: 'rgba(22,163,74,0.12)' };
  return map[level] || 'rgba(107,114,128,0.1)';
}
export function getRiskIcon(level) {
  const map = { CRITICAL: '🔴', HIGH: '🟠', MODERATE: '🟡', LOW: '🟢', MINIMAL: '✅' };
  return map[level] || '⚪';
}
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function getScoreGradient(score) {
  if (score >= 80) return 'linear-gradient(90deg, #dc2626, #ef4444)';
  if (score >= 65) return 'linear-gradient(90deg, #ea580c, #f97316)';
  if (score >= 45) return 'linear-gradient(90deg, #d97706, #fbbf24)';
  if (score >= 25) return 'linear-gradient(90deg, #65a30d, #84cc16)';
  return 'linear-gradient(90deg, #16a34a, #22c55e)';
}
