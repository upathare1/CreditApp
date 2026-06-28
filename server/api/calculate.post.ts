import { cards, spendingCategories, toFiniteNumber, type CalculationInput, type SpendKey } from '../../app/utils/credit-domain'
import { calculateCreditScenario } from '../utils/credit-calculation'

function sanitizeRecord(source: unknown, fallback: Record<string, number>) {
  const next: Record<string, number> = { ...fallback }

  if (!source || typeof source !== 'object') {
    return next
  }

  for (const key of Object.keys(next)) {
    next[key] = Math.max(0, toFiniteNumber((source as Record<string, unknown>)[key], next[key]))
  }

  return next
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<CalculationInput> & { optimizeWallet?: boolean }>(event)
  const defaultSpending = Object.fromEntries(spendingCategories.map(category => [category.key, 0])) as Record<SpendKey, number>
  const defaultPointValues = Object.fromEntries(cards.map(card => [card.id, card.defaultPointValueCents]))
  const defaultCouponValues = Object.fromEntries(cards.map(card => [card.id, 0]))
  const selectedCardId = typeof body.selectedCardId === 'string' && cards.some(card => card.id === body.selectedCardId)
    ? body.selectedCardId
    : cards[0]!.id

  const walletCardIds = Array.isArray(body.walletCardIds)
    ? body.walletCardIds.filter(cardId => typeof cardId === 'string' && cards.some(card => card.id === cardId))
    : []

  const input: CalculationInput = {
    selectedCardId,
    walletCardIds,
    walletSignupBonusCardIds: Array.isArray(body.walletSignupBonusCardIds)
      ? body.walletSignupBonusCardIds.filter(cardId => typeof cardId === 'string' && cards.some(card => card.id === cardId))
      : [],
    spending: sanitizeRecord(body.spending, defaultSpending) as Record<SpendKey, number>,
    housingPayment: Math.max(0, toFiniteNumber(body.housingPayment, 0)),
    freedomFlexBonusSpend: Math.max(0, toFiniteNumber(body.freedomFlexBonusSpend, 0)),
    includeSignupBonuses: body.includeSignupBonuses === true,
    pointValues: sanitizeRecord(body.pointValues, defaultPointValues),
    couponValues: sanitizeRecord(body.couponValues, defaultCouponValues)
  }

  return calculateCreditScenario(input, body.optimizeWallet === true)
})
