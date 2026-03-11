interface PricingParams {
  minimumFare: number;
  ratePerKm: number;
  nightMultiplier: number;
  airportFixedRate: number | null;
  freeWaitingMinutes: number;
  waitingRatePerMin: number;
  extraStopFee: number;
}

interface FareEstimate {
  baseFare: number;
  distanceCharge: number;
  nightSurcharge: number;
  stopsCharge: number;
  waitingCharge: number;
  totalFare: number;
  isNight: boolean;
  isAirport: boolean;
}

function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 0 && hour < 6;
}

/**
 * Calculate fare estimate pre-trip.
 * Formula: MAX(minimumFare, ratePerKm × distance) × nightMultiplier + stops × extraStopFee
 * Airport override: if isAirport → use airportFixedRate instead of distance-based calc
 */
export function calculateFareEstimate(
  pricing: PricingParams,
  distanceKm: number,
  stopsCount: number,
  scheduledAt: Date,
  isAirport: boolean = false
): FareEstimate {
  const night = isNightTime(scheduledAt);

  // Airport fixed rate takes precedence
  if (isAirport && pricing.airportFixedRate) {
    const baseFare = pricing.airportFixedRate;
    const nightSurcharge = night ? baseFare * (pricing.nightMultiplier - 1) : 0;
    const stopsCharge = stopsCount * pricing.extraStopFee;
    return {
      baseFare,
      distanceCharge: 0,
      nightSurcharge,
      stopsCharge,
      waitingCharge: 0,
      totalFare: baseFare + nightSurcharge + stopsCharge,
      isNight: night,
      isAirport: true,
    };
  }

  const distanceCharge = pricing.ratePerKm * distanceKm;
  const baseFare = Math.max(pricing.minimumFare, distanceCharge);
  const nightSurcharge = night ? baseFare * (pricing.nightMultiplier - 1) : 0;
  const stopsCharge = stopsCount * pricing.extraStopFee;
  const totalFare = baseFare + nightSurcharge + stopsCharge;

  return {
    baseFare,
    distanceCharge,
    nightSurcharge,
    stopsCharge,
    waitingCharge: 0,
    totalFare,
    isNight: night,
    isAirport: false,
  };
}

/**
 * Calculate actual fare post-trip (includes waiting charges).
 */
export function calculateActualFare(
  pricing: PricingParams,
  actualDistanceKm: number,
  stopsCount: number,
  scheduledAt: Date,
  waitingMinutes: number,
  isAirport: boolean = false
): FareEstimate {
  const estimate = calculateFareEstimate(
    pricing,
    actualDistanceKm,
    stopsCount,
    scheduledAt,
    isAirport
  );

  const waitingCharge =
    Math.max(0, waitingMinutes - pricing.freeWaitingMinutes) *
    pricing.waitingRatePerMin;

  return {
    ...estimate,
    waitingCharge,
    totalFare: estimate.totalFare + waitingCharge,
  };
}

/**
 * Calculate fare range across multiple orgs for a vehicle class.
 */
export function calculateFareRange(
  pricingRules: PricingParams[],
  distanceKm: number,
  stopsCount: number,
  scheduledAt: Date,
  isAirport: boolean = false
): { min: number; max: number } | null {
  if (pricingRules.length === 0) return null;

  const fares = pricingRules.map(
    (p) =>
      calculateFareEstimate(p, distanceKm, stopsCount, scheduledAt, isAirport)
        .totalFare
  );

  return {
    min: Math.min(...fares),
    max: Math.max(...fares),
  };
}
