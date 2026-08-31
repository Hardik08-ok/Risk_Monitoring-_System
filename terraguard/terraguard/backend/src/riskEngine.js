/**
 * TerraGuard AI - Predictive Risk Engine v2.0
 * Multi-variate risk calculation fusing:
 *   - Real-time Rainfall & Soil Moisture
 *   - Terrain & Slope Gradients
 *   - Satellite Imagery Analysis
 *   - Historical Landslide Records
 *   - Active Field Reports
 */

const WEIGHTS = {
  rainfall: 0.30,
  soilMoisture: 0.25,
  slopeGradient: 0.20,
  historicalIndex: 0.15,
  fieldReports: 0.10,
};

/**
 * Normalize a value to 0-100 scale
 */
function normalize(value, min, max) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * Calculate rainfall risk component
 * Threshold: >80mm/day = critical
 */
function rainfallRisk(mmPerDay) {
  return normalize(mmPerDay, 0, 150);
}

/**
 * Calculate soil moisture risk
 * Threshold: >75% saturation = high risk
 */
function soilMoistureRisk(percentSaturation) {
  return normalize(percentSaturation, 20, 100);
}

/**
 * Calculate slope gradient risk
 * Threshold: >35° slope = critical
 */
function slopeRisk(angleDegrees) {
  return normalize(angleDegrees, 5, 60);
}

/**
 * Historical cluster index risk (0-100 passed directly)
 */
function historicalRisk(index) {
  return Math.min(100, Math.max(0, index));
}

/**
 * Field report density risk
 * fieldReports: number of reports in last 6h in sector
 */
function fieldReportRisk(reportCount) {
  return normalize(reportCount, 0, 20);
}

/**
 * Master risk score calculator
 */
function calculateRiskScore(params) {
  const {
    rainfall = 0,
    soilMoisture = 0,
    slopeGradient = 0,
    historicalIndex = 0,
    fieldReportCount = 0,
  } = params;

  const components = {
    rainfall: rainfallRisk(rainfall),
    soilMoisture: soilMoistureRisk(soilMoisture),
    slopeGradient: slopeRisk(slopeGradient),
    historicalIndex: historicalRisk(historicalIndex),
    fieldReports: fieldReportRisk(fieldReportCount),
  };

  const score = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (components[key] * weight);
  }, 0);

  const riskScore = Math.round(score);

  return {
    score: riskScore,
    level: getRiskLevel(riskScore),
    alertStatus: riskScore > 70 ? 'ACTIVE' : riskScore > 45 ? 'WATCH' : 'NORMAL',
    components,
    weights: WEIGHTS,
    timestamp: new Date().toISOString(),
  };
}

function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 65) return 'HIGH';
  if (score >= 45) return 'MODERATE';
  if (score >= 25) return 'LOW';
  return 'MINIMAL';
}

function getRiskColor(level) {
  const colors = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MODERATE: '#d97706',
    LOW: '#65a30d',
    MINIMAL: '#16a34a',
  };
  return colors[level] || '#6b7280';
}

module.exports = { calculateRiskScore, getRiskLevel, getRiskColor };
