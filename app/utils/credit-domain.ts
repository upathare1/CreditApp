export type SpendKey = 'restaurantDelivery' | 'travel' | 'travelPortal' | 'groceries' | 'remaining'

export interface SpendingCategory {
  key: SpendKey
  label: string
  icon: string
  helper: string
}

export interface CreditCard {
  id: string
  name: string
  issuer: string
  annualFee: number
  firstYearAnnualFee?: number
  defaultPointValueCents: number
  signupBonus: {
    points: number
    cashValue: number
    biltCashValue: number
    spendRequirement: number
    description: string
  }
  description: string
  earningNote: string
  palette: string
  textClass: string
  accentClass: string
  network: string
  rewards: Record<SpendKey, number>
  highlights: string[]
}

export interface SavedScenario {
  version: 1
  name?: string
  selectedCardId: string
  walletCardIds?: string[]
  walletSignupBonusCardIds?: string[]
  spending: Record<SpendKey, number>
  housingPayment: number
  freedomFlexBonusSpend: number
  includeSignupBonuses: boolean
  pointValues: Record<string, number>
  couponValues?: Record<string, number>
}

export interface CalculationInput {
  selectedCardId: string
  walletCardIds: string[]
  walletSignupBonusCardIds: string[]
  spending: Record<SpendKey, number>
  housingPayment: number
  freedomFlexBonusSpend: number
  includeSignupBonuses: boolean
  pointValues: Record<string, number>
  couponValues: Record<string, number>
}

export interface WalletEvaluation {
  cardIds: string[]
  earnedSignupBonusCardIds: string[]
  monthlyValue: number
  annualValue: number
  annualFees: number
  netAnnualValue: number
  requiredSignupSpend: number
  signupBonusValue: number
}

export interface CreditCalculationResult {
  selectedCard: CreditCard
  isBiltCard: boolean
  isFreedomFlex: boolean
  categoryRows: Array<SpendingCategory & { monthlySpend: number, multiplier: number, monthlyPoints: number }>
  totalMonthlySpend: number
  biltCashDollars: number
  biltHousingPointsCap: number
  biltCashBonusPoints: number
  biltCashSpendToMaxCap: number
  freedomFlexBonusPoints: number
  monthlyRewards: number
  annualRewards: number
  annualRewardsValue: number
  signupBiltCashAnnualHousingCap: number
  signupBiltCashPoints: number
  signupBonusValue: number
  netAnnualValue: number
  selectedFirstYearAnnualFee: number
  walletCards: CreditCard[]
  walletHasFreedomFlex: boolean
  walletAnnualFees: number
  walletCouponValue: number
  walletCategoryRows: Array<SpendingCategory & {
    monthlySpend: number
    monthlyValue: number
    allocations: Array<{
      card: CreditCard
      annualSpend: number
      monthlySpend: number
      multiplier: number
      monthlyPoints: number
      monthlyValue: number
    }>
  }>
  walletBiltSpend: number
  walletBiltCashPoints: number
  walletBiltMonthlyValue: number
  walletFreedomFlexBonusMonthlyValue: number
  walletMonthlyValue: number
  walletAnnualValue: number
  walletNetAnnualValue: number
  walletSignupBonusRows: Array<{
    card: CreditCard
    activated: boolean
    earned: boolean
    allocatedAnnualSpend: number
    requiredSpend: number
    value: number
    biltCashPoints: number
  }>
  walletSignupBonusValue: number
  walletFirstYearNetAnnualValue: number
  optimalWallet?: WalletEvaluation
}

export const spendingCategories: SpendingCategory[] = [
  {
    key: 'restaurantDelivery',
    label: 'Restaurant / Delivery',
    icon: 'i-lucide-utensils',
    helper: 'Dining, takeout, and delivery apps'
  },
  {
    key: 'travel',
    label: 'Travel',
    icon: 'i-lucide-plane',
    helper: 'Hotels, flights, rental cars, and transit'
  },
  {
    key: 'travelPortal',
    label: 'Travel (Card Portal)',
    icon: 'i-lucide-globe',
    helper: 'Travel booked through the issuer portal'
  },
  {
    key: 'groceries',
    label: 'Groceries',
    icon: 'i-lucide-shopping-basket',
    helper: 'Supermarkets and grocery delivery'
  },
  {
    key: 'remaining',
    label: 'Remaining',
    icon: 'i-lucide-wallet-cards',
    helper: 'Everything outside the main categories'
  }
]

export const cards: CreditCard[] = [
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 75000,
      cashValue: 0,
      biltCashValue: 0,
      spendRequirement: 5000,
      description: '75,000 bonus points after $5,000 in purchases in the first 3 months.'
    },
    description: 'A flexible travel starter card with strong dining rewards, portal travel value, and transferable Ultimate Rewards points.',
    earningNote: 'Uses fixed Ultimate Rewards rates: 5x Chase Travel, 3x dining and online grocery, 2x general travel, 1x everything else.',
    palette: 'from-sky-950 via-blue-800 to-cyan-600',
    textClass: 'text-white',
    accentClass: 'bg-cyan-300/90',
    network: 'Visa Signature',
    rewards: {
      restaurantDelivery: 3,
      travel: 2,
      travelPortal: 5,
      groceries: 3,
      remaining: 1
    },
    highlights: ['Travel starter', 'Transfer partners', 'Dining rewards']
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 125000,
      cashValue: 0,
      biltCashValue: 0,
      spendRequirement: 6000,
      description: '125,000 bonus points after $6,000 in purchases in the first 3 months.'
    },
    description: 'A premium travel card aimed at frequent travelers who can use lounge access, travel credits, and elevated redemption value.',
    earningNote: 'Uses current public rates: 8x Chase Travel, 4x direct flights and hotels, 3x dining, 1x everything else.',
    palette: 'from-zinc-950 via-slate-800 to-sky-700',
    textClass: 'text-white',
    accentClass: 'bg-sky-300/90',
    network: 'Visa Infinite',
    rewards: {
      restaurantDelivery: 3,
      travel: 4,
      travelPortal: 8,
      groceries: 1,
      remaining: 1
    },
    highlights: ['Premium travel', 'Lounge access', 'Annual credits']
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 0,
      cashValue: 200,
      biltCashValue: 0,
      spendRequirement: 500,
      description: '$200 bonus after $500 in purchases in the first 3 months.'
    },
    description: 'A no-annual-fee Chase card built around simple 1.5% everyday earning with elevated dining and Chase Travel rewards.',
    earningNote: 'Uses current public rates: 5x Chase Travel, 3x dining, and 1.5x on groceries, general travel, and remaining purchases.',
    palette: 'from-slate-950 via-blue-700 to-cyan-500',
    textClass: 'text-white',
    accentClass: 'bg-cyan-200/90',
    network: 'Visa Signature',
    rewards: {
      restaurantDelivery: 3,
      travel: 1.5,
      travelPortal: 5,
      groceries: 1.5,
      remaining: 1.5
    },
    highlights: ['No annual fee', '1.5x everywhere', 'Chase Travel bonus']
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    annualFee: 0,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 0,
      cashValue: 200,
      biltCashValue: 0,
      spendRequirement: 500,
      description: '$200 bonus after $500 in purchases in the first 3 months.'
    },
    description: 'A no-annual-fee Chase card with rotating quarterly 5% categories, strong dining rewards, and Chase Travel bonuses.',
    earningNote: 'Uses current public rates: 5x Chase Travel, 3x dining, and 1x on groceries, general travel, and remaining purchases. The simplified bonus category field adds +4x on the amount entered there.',
    palette: 'from-indigo-950 via-blue-800 to-sky-500',
    textClass: 'text-white',
    accentClass: 'bg-sky-200/90',
    network: 'World Elite Mastercard',
    rewards: {
      restaurantDelivery: 3,
      travel: 1,
      travelPortal: 5,
      groceries: 1,
      remaining: 1
    },
    highlights: ['Rotating bonus category', 'No annual fee', 'Dining rewards']
  },
  {
    id: 'united-explorer',
    name: 'United Explorer',
    issuer: 'United / Chase',
    annualFee: 150,
    firstYearAnnualFee: 0,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 25000,
      cashValue: 400,
      biltCashValue: 0,
      spendRequirement: 3000,
      description: '$400 statement credit after first purchase plus 25,000 bonus miles after $3,000 in purchases in the first 3 months.'
    },
    description: 'An airline-focused card for United flyers who want free checked bag value, priority boarding, and MileagePlus earning.',
    earningNote: 'Models United and direct-hotel travel at 2x, eligible United purchases through United channels at 3x, dining at 2x, and other purchases at 1x.',
    palette: 'from-blue-950 via-indigo-800 to-amber-500',
    textClass: 'text-white',
    accentClass: 'bg-amber-300/90',
    network: 'Visa Signature',
    rewards: {
      restaurantDelivery: 2,
      travel: 2,
      travelPortal: 3,
      groceries: 1,
      remaining: 1
    },
    highlights: ['United perks', 'Checked bag value', 'MileagePlus miles']
  },
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'American Express',
    annualFee: 895,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 175000,
      cashValue: 0,
      biltCashValue: 0,
      spendRequirement: 12000,
      description: '175,000 Membership Rewards points after $12,000 in purchases in the first 6 months.'
    },
    description: 'A premium travel card centered on airport lounge access, luxury travel benefits, statement credits, and Membership Rewards points.',
    earningNote: 'Simplified for this calculator as 5x on both direct and Amex Travel purchases, with 1x on dining, groceries, and other purchases.',
    palette: 'from-zinc-950 via-slate-700 to-cyan-700',
    textClass: 'text-white',
    accentClass: 'bg-cyan-200/90',
    network: 'American Express',
    rewards: {
      restaurantDelivery: 1,
      travel: 5,
      travelPortal: 5,
      groceries: 1,
      remaining: 1
    },
    highlights: ['Premium travel', 'Airport lounges', 'Membership Rewards']
  },
  {
    id: 'amex-gold',
    name: 'Amex Gold',
    issuer: 'American Express',
    annualFee: 325,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 100000,
      cashValue: 0,
      biltCashValue: 0,
      spendRequirement: 6000,
      description: '100,000 Membership Rewards points after $6,000 in purchases in the first 6 months.'
    },
    description: 'A food-focused rewards card with elevated earning at restaurants and U.S. supermarkets plus Membership Rewards travel options.',
    earningNote: 'Simplified for this calculator as 4x at restaurants and U.S. supermarkets, 3x on both direct and Amex Travel purchases, and 1x elsewhere. Restaurant and supermarket annual caps are not modeled.',
    palette: 'from-amber-700 via-yellow-500 to-rose-500',
    textClass: 'text-slate-950',
    accentClass: 'bg-slate-950/80',
    network: 'American Express',
    rewards: {
      restaurantDelivery: 4,
      travel: 3,
      travelPortal: 3,
      groceries: 4,
      remaining: 1
    },
    highlights: ['Dining rewards', 'U.S. supermarkets', 'Membership Rewards']
  },
  {
    id: 'bilt-obsidian',
    name: 'BILT Obsidian',
    issuer: 'BILT',
    annualFee: 95,
    defaultPointValueCents: 1.25,
    signupBonus: {
      points: 0,
      cashValue: 0,
      biltCashValue: 200,
      spendRequirement: 0,
      description: '$200 in BILT Cash on or about account opening, convertible to BILT points against housing payments.'
    },
    description: 'A mid-tier BILT card for rent-focused rewards, everyday earning, and travel transfer flexibility.',
    earningNote: 'Models the default Obsidian choice category plus the BILT Cash housing redemption boost: 3x dining, 2x direct travel, 1x groceries and other purchases, with 4/3 extra points from regular spend capped at 1x monthly rent or mortgage.',
    palette: 'from-neutral-950 via-stone-800 to-neutral-700',
    textClass: 'text-white',
    accentClass: 'bg-white/80',
    network: 'World Elite Mastercard',
    rewards: {
      restaurantDelivery: 3,
      travel: 2,
      travelPortal: 2,
      groceries: 1,
      remaining: 1
    },
    highlights: ['Rent ecosystem', 'Transfer partners', 'Dining value']
  },
  {
    id: 'bilt-palladium',
    name: 'BILT Palladium',
    issuer: 'BILT',
    annualFee: 495,
    defaultPointValueCents: 1.25,
    signupBonus: {
      points: 50000,
      cashValue: 0,
      biltCashValue: 300,
      spendRequirement: 4000,
      description: '50,000 BILT points plus $300 in BILT Cash; points require $4,000 in everyday spend within 90 days. BILT Cash is convertible to BILT points against housing payments.'
    },
    description: 'The top-tier BILT card for renters and homeowners who want stronger everyday earning, travel benefits, and housing payment flexibility.',
    earningNote: 'Uses Palladium fixed everyday earning plus the BILT Cash housing redemption boost: 2x on eligible non-housing purchases, with 4/3 extra points from regular spend capped at 1x monthly rent or mortgage.',
    palette: 'from-slate-200 via-zinc-100 to-stone-300',
    textClass: 'text-slate-950',
    accentClass: 'bg-slate-700/80',
    network: 'World Legend Mastercard',
    rewards: {
      restaurantDelivery: 2,
      travel: 2,
      travelPortal: 2,
      groceries: 2,
      remaining: 2
    },
    highlights: ['Rent rewards', 'No annual fee', 'Flexible points']
  },
  {
    id: 'bilt-blue',
    name: 'BILT Blue',
    issuer: 'BILT',
    annualFee: 0,
    defaultPointValueCents: 1.25,
    signupBonus: {
      points: 0,
      cashValue: 0,
      biltCashValue: 100,
      spendRequirement: 0,
      description: '$100 in BILT Cash on or about account opening, convertible to BILT points against housing payments.'
    },
    description: 'An entry BILT card for earning transferable points on rent and core everyday categories without an annual fee.',
    earningNote: 'Uses Blue fixed everyday earning plus the BILT Cash housing redemption boost: 1x on eligible non-housing purchases, with 4/3 extra points from regular spend capped at 1x monthly rent or mortgage.',
    palette: 'from-blue-800 via-cyan-600 to-teal-400',
    textClass: 'text-white',
    accentClass: 'bg-white/85',
    network: 'Mastercard',
    rewards: {
      restaurantDelivery: 1,
      travel: 1,
      travelPortal: 1,
      groceries: 1,
      remaining: 1
    },
    highlights: ['No annual fee', 'Rent points', 'Everyday earning']
  },
  {
    id: 'capitalone-savor',
    name: 'CapitalOne Savor',
    issuer: 'Capital One',
    annualFee: 0,
    defaultPointValueCents: 1,
    signupBonus: {
      points: 0,
      cashValue: 200,
      biltCashValue: 0,
      spendRequirement: 500,
      description: '$200 cash bonus after $500 in purchases in the first 3 months.'
    },
    description: 'A food and entertainment card built around dining, groceries, streaming, and simple cash-back style rewards.',
    earningNote: 'Uses current Savor cash-back rates as point-equivalent multipliers: 5% Capital One Travel hotels, vacation rentals, and rental cars; 3% dining and groceries; 1% other purchases.',
    palette: 'from-red-800 via-rose-600 to-orange-400',
    textClass: 'text-white',
    accentClass: 'bg-orange-200/90',
    network: 'Mastercard',
    rewards: {
      restaurantDelivery: 3,
      travel: 1,
      travelPortal: 5,
      groceries: 3,
      remaining: 1
    },
    highlights: ['Dining focus', 'Grocery rewards', 'Cash back']
  }
]

export const defaultCard = cards[0] as CreditCard

export function getFirstYearAnnualFee(card: CreditCard) {
  return card.firstYearAnnualFee ?? card.annualFee
}

export function toFiniteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
