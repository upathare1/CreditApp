import {
  cards,
  defaultCard,
  getFirstYearAnnualFee,
  spendingCategories,
  type CalculationInput,
  type CreditCard,
  type SpendingCategory
} from '../../app/utils/credit-domain'

interface WalletEvaluation {
  cardIds: string[]
  earnedSignupBonusCardIds: string[]
  monthlyValue: number
  annualValue: number
  annualFees: number
  netAnnualValue: number
  requiredSignupSpend: number
  signupBonusValue: number
}

interface FlowEdge {
  to: number
  reverseIndex: number
  capacity: number
  initialCapacity: number
  cost: number
}

interface WalletAllocation {
  feasible: boolean
  categoryRows: Array<SpendingCategory & {
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
  cardAnnualSpend: Record<string, number>
  biltSpend: number
  biltCashPoints: number
  biltMonthlyValue: number
  monthlyValue: number
  annualValue: number
}

interface WalletStrategy extends WalletEvaluation {
  cards: CreditCard[]
  couponValue: number
  allocation: WalletAllocation
  signupBonuses: ReturnType<typeof calculateWalletSignupBonuses>
}

function addFlowEdge(graph: FlowEdge[][], from: number, to: number, capacity: number, cost: number) {
  const forward: FlowEdge = {
    to,
    reverseIndex: graph[to]!.length,
    capacity,
    initialCapacity: capacity,
    cost
  }
  const reverse: FlowEdge = {
    to: from,
    reverseIndex: graph[from]!.length,
    capacity: 0,
    initialCapacity: 0,
    cost: -cost
  }

  graph[from]!.push(forward)
  graph[to]!.push(reverse)

  return forward
}

function sendMinCostFlow(graph: FlowEdge[][], source: number, sink: number, requestedFlow: number) {
  const epsilon = 0.000001
  let totalFlow = 0

  while (totalFlow < requestedFlow - epsilon) {
    const distances = Array.from({ length: graph.length }, () => Number.POSITIVE_INFINITY)
    const previousNodes = Array.from({ length: graph.length }, () => -1)
    const previousEdges = Array.from({ length: graph.length }, () => -1)

    distances[source] = 0

    for (let pass = 0; pass < graph.length - 1; pass += 1) {
      let changed = false

      for (let node = 0; node < graph.length; node += 1) {
        if (!Number.isFinite(distances[node])) {
          continue
        }

        for (let edgeIndex = 0; edgeIndex < graph[node]!.length; edgeIndex += 1) {
          const edge = graph[node]![edgeIndex]!
          const nextDistance = distances[node]! + edge.cost

          if (edge.capacity > epsilon && nextDistance < distances[edge.to]! - epsilon) {
            distances[edge.to] = nextDistance
            previousNodes[edge.to] = node
            previousEdges[edge.to] = edgeIndex
            changed = true
          }
        }
      }

      if (!changed) {
        break
      }
    }

    if (previousNodes[sink] === -1) {
      break
    }

    let addedFlow = requestedFlow - totalFlow

    for (let node = sink; node !== source; node = previousNodes[node]!) {
      const previousNode = previousNodes[node]!
      const edge = graph[previousNode]![previousEdges[node]!]!

      addedFlow = Math.min(addedFlow, edge.capacity)
    }

    for (let node = sink; node !== source; node = previousNodes[node]!) {
      const previousNode = previousNodes[node]!
      const edge = graph[previousNode]![previousEdges[node]!]!
      const reverse = graph[edge.to]![edge.reverseIndex]!

      edge.capacity -= addedFlow
      reverse.capacity += addedFlow
    }

    totalFlow += addedFlow
  }

  return totalFlow
}

function getEdgeFlow(edge: FlowEdge) {
  return edge.initialCapacity - edge.capacity
}

function createEmptyWalletAllocation(input: CalculationInput): WalletAllocation {
  return {
    feasible: true,
    categoryRows: spendingCategories.map(category => ({
      ...category,
      monthlySpend: input.spending[category.key],
      monthlyValue: 0,
      allocations: []
    })),
    cardAnnualSpend: {},
    biltSpend: 0,
    biltCashPoints: 0,
    biltMonthlyValue: 0,
    monthlyValue: 0,
    annualValue: 0
  }
}

function optimizeWalletAllocation(candidateCards: CreditCard[], input: CalculationInput, earnedSignupBonusCardIds: string[] = []) {
  const totalAnnualSpend = spendingCategories.reduce((total, category) => total + input.spending[category.key] * 12, 0)
  const requiredSignupSpend = candidateCards.reduce((total, card) => {
    return earnedSignupBonusCardIds.includes(card.id) ? total + card.signupBonus.spendRequirement : total
  }, 0)

  if (candidateCards.length === 0 || totalAnnualSpend === 0) {
    const empty = createEmptyWalletAllocation(input)

    return { ...empty, feasible: requiredSignupSpend === 0 }
  }

  if (requiredSignupSpend > totalAnnualSpend + 0.000001) {
    return { ...createEmptyWalletAllocation(input), feasible: false }
  }

  const source = 0
  const categoryStart = 1
  const cardStart = categoryStart + spendingCategories.length
  const biltAggregator = cardStart + candidateCards.length
  const sink = biltAggregator + 1
  const graph = Array.from({ length: sink + 1 }, () => [] as FlowEdge[])
  const allocationEdges: Array<{
    category: SpendingCategory
    card: CreditCard
    edge: FlowEdge
  }> = []
  const requiredEdges: Array<{ requirement: number, edge: FlowEdge }> = []
  const requirementPriority = 1000

  spendingCategories.forEach((category, categoryIndex) => {
    const annualSpend = input.spending[category.key] * 12
    const categoryNode = categoryStart + categoryIndex

    addFlowEdge(graph, source, categoryNode, annualSpend, 0)

    candidateCards.forEach((card, cardIndex) => {
      const cardNode = cardStart + cardIndex
      const pointValueCents = input.pointValues[card.id] ?? card.defaultPointValueCents
      const valuePerDollar = card.rewards[category.key] * pointValueCents / 100
      const edge = addFlowEdge(graph, categoryNode, cardNode, annualSpend, -valuePerDollar)

      allocationEdges.push({ category, card, edge })
    })
  })

  candidateCards.forEach((card, cardIndex) => {
    const cardNode = cardStart + cardIndex
    const destination = card.issuer === 'BILT' ? biltAggregator : sink
    const requirement = earnedSignupBonusCardIds.includes(card.id) ? card.signupBonus.spendRequirement : 0

    if (requirement > 0) {
      const edge = addFlowEdge(graph, cardNode, destination, requirement, -requirementPriority)

      requiredEdges.push({ requirement, edge })
    }

    addFlowEdge(graph, cardNode, destination, totalAnnualSpend, 0)
  })

  const biltCard = candidateCards.find(card => card.issuer === 'BILT')
  const biltPointValueCents = biltCard
    ? input.pointValues[biltCard.id] ?? biltCard.defaultPointValueCents
    : 1.25
  const biltBonusValuePerDollar = 0.04 / 30 * 1000 * biltPointValueCents / 100
  const annualBiltSpendCap = input.housingPayment * 0.75 * 12

  addFlowEdge(graph, biltAggregator, sink, annualBiltSpendCap, -biltBonusValuePerDollar)
  addFlowEdge(graph, biltAggregator, sink, totalAnnualSpend, 0)

  const deliveredFlow = sendMinCostFlow(graph, source, sink, totalAnnualSpend)
  const requirementsMet = requiredEdges.every(({ requirement, edge }) => getEdgeFlow(edge) >= requirement - 0.000001)

  if (deliveredFlow < totalAnnualSpend - 0.000001 || !requirementsMet) {
    return { ...createEmptyWalletAllocation(input), feasible: false }
  }

  const cardAnnualSpend = Object.fromEntries(candidateCards.map(card => [card.id, 0]))
  const categoryRows = spendingCategories.map((category) => {
    const allocations = allocationEdges
      .filter(item => item.category.key === category.key)
      .map(({ card, edge }) => {
        const annualSpend = getEdgeFlow(edge)
        const monthlySpend = annualSpend / 12
        const multiplier = card.rewards[category.key]
        const pointValueCents = input.pointValues[card.id] ?? card.defaultPointValueCents
        const monthlyValue = monthlySpend * multiplier * pointValueCents / 100

        cardAnnualSpend[card.id] = (cardAnnualSpend[card.id] ?? 0) + annualSpend

        return {
          card,
          annualSpend,
          monthlySpend,
          multiplier,
          monthlyPoints: monthlySpend * multiplier,
          monthlyValue
        }
      })
      .filter(allocation => allocation.annualSpend > 0.000001)
      .sort((a, b) => b.annualSpend - a.annualSpend || a.card.name.localeCompare(b.card.name))

    return {
      ...category,
      monthlySpend: input.spending[category.key],
      monthlyValue: allocations.reduce((total, allocation) => total + allocation.monthlyValue, 0),
      allocations
    }
  })
  const annualBiltSpend = candidateCards.reduce((total, card) => {
    return card.issuer === 'BILT' ? total + (cardAnnualSpend[card.id] ?? 0) : total
  }, 0)
  const annualBiltCashPoints = Math.min(annualBiltSpend * 0.04 / 30 * 1000, input.housingPayment * 12)
  const annualBiltValue = biltCard ? annualBiltCashPoints * biltPointValueCents / 100 : 0
  const baseAnnualValue = categoryRows.reduce((total, row) => total + row.monthlyValue * 12, 0)
  const freedomFlexCard = candidateCards.find(card => card.id === 'chase-freedom-flex')
  const annualFreedomFlexValue = freedomFlexCard
    ? input.freedomFlexBonusSpend * 12 * 4 * (input.pointValues[freedomFlexCard.id] ?? freedomFlexCard.defaultPointValueCents) / 100
    : 0
  const annualValue = baseAnnualValue + annualBiltValue + annualFreedomFlexValue

  return {
    feasible: true,
    categoryRows,
    cardAnnualSpend,
    biltSpend: annualBiltSpend / 12,
    biltCashPoints: annualBiltCashPoints / 12,
    biltMonthlyValue: annualBiltValue / 12,
    monthlyValue: annualValue / 12,
    annualValue
  }
}

function calculateWalletSignupBonuses(
  candidateCards: CreditCard[],
  input: CalculationInput,
  earnedSignupBonusCardIds: string[],
  cardAnnualSpend: Record<string, number>
) {
  let remainingBiltCashPointCap = input.housingPayment * 12
  const biltCashPointsByCard = new Map<string, number>()

  candidateCards
    .filter(card => earnedSignupBonusCardIds.includes(card.id) && card.signupBonus.biltCashValue > 0)
    .sort((a, b) => {
      const aValue = input.pointValues[a.id] ?? a.defaultPointValueCents
      const bValue = input.pointValues[b.id] ?? b.defaultPointValueCents

      return bValue - aValue
    })
    .forEach((card) => {
      const biltCashPoints = Math.min(card.signupBonus.biltCashValue / 30 * 1000, remainingBiltCashPointCap)

      biltCashPointsByCard.set(card.id, biltCashPoints)
      remainingBiltCashPointCap = Math.max(0, remainingBiltCashPointCap - biltCashPoints)
    })

  const rows = candidateCards.map((card) => {
    const activated = input.walletSignupBonusCardIds.includes(card.id)
    const earned = earnedSignupBonusCardIds.includes(card.id)
    const pointValueCents = input.pointValues[card.id] ?? card.defaultPointValueCents
    const baseValue = earned ? card.signupBonus.cashValue + card.signupBonus.points * pointValueCents / 100 : 0
    const biltCashPoints = biltCashPointsByCard.get(card.id) ?? 0

    return {
      card,
      activated,
      earned,
      allocatedAnnualSpend: cardAnnualSpend[card.id] ?? 0,
      requiredSpend: card.signupBonus.spendRequirement,
      value: baseValue + biltCashPoints * pointValueCents / 100,
      biltCashPoints
    }
  })
  const value = rows.reduce((total, row) => total + row.value, 0)
  const firstYearFeeSavings = candidateCards.reduce((total, card) => {
    if (!earnedSignupBonusCardIds.includes(card.id)) {
      return total
    }

    return total + Math.max(0, card.annualFee - getFirstYearAnnualFee(card))
  }, 0)

  return { rows, value, firstYearFeeSavings }
}

function evaluateWallet(cardIds: string[], input: CalculationInput): WalletStrategy {
  const candidateCards = cards.filter(card => cardIds.includes(card.id))

  if (candidateCards.length === 0) {
    return {
      cardIds,
      earnedSignupBonusCardIds: [],
      monthlyValue: 0,
      annualValue: 0,
      annualFees: 0,
      netAnnualValue: Number.NEGATIVE_INFINITY,
      requiredSignupSpend: 0,
      signupBonusValue: 0,
      cards: candidateCards,
      couponValue: 0,
      allocation: createEmptyWalletAllocation(input),
      signupBonuses: calculateWalletSignupBonuses(candidateCards, input, [], {})
    }
  }

  const annualFees = candidateCards.reduce((total, card) => total + card.annualFee, 0)
  const couponValue = candidateCards.reduce((total, card) => total + (input.couponValues[card.id] ?? 0), 0)
  const activatedCards = candidateCards.filter(card => input.walletSignupBonusCardIds.includes(card.id))
  const bonusCombinationCount = 2 ** activatedCards.length
  let bestStrategy: WalletStrategy | undefined

  for (let mask = 0; mask < bonusCombinationCount; mask += 1) {
    const earnedSignupBonusCardIds = activatedCards
      .filter((_, index) => (mask & (1 << index)) !== 0)
      .map(card => card.id)
    const requiredSignupSpend = activatedCards.reduce((total, card, index) => {
      return (mask & (1 << index)) !== 0 ? total + card.signupBonus.spendRequirement : total
    }, 0)
    const allocation = optimizeWalletAllocation(candidateCards, input, earnedSignupBonusCardIds)

    if (!allocation.feasible) {
      continue
    }

    const signupBonuses = calculateWalletSignupBonuses(candidateCards, input, earnedSignupBonusCardIds, allocation.cardAnnualSpend)
    const netAnnualValue = allocation.annualValue + couponValue - annualFees + signupBonuses.value + signupBonuses.firstYearFeeSavings
    const candidate = {
      cardIds,
      earnedSignupBonusCardIds,
      monthlyValue: allocation.monthlyValue,
      annualValue: allocation.annualValue,
      annualFees,
      netAnnualValue,
      requiredSignupSpend,
      signupBonusValue: signupBonuses.value,
      cards: candidateCards,
      couponValue,
      allocation,
      signupBonuses
    }

    if (!bestStrategy || candidate.netAnnualValue > bestStrategy.netAnnualValue + 0.000001) {
      bestStrategy = candidate
    }
  }

  return bestStrategy!
}

function findOptimalWallet(input: CalculationInput) {
  let bestWallet = evaluateWallet([defaultCard.id], input)
  const walletCount = 2 ** cards.length

  for (let mask = 1; mask < walletCount; mask += 1) {
    const cardIds = cards
      .filter((_, index) => (mask & (1 << index)) !== 0)
      .map(card => card.id)
    const candidate = evaluateWallet(cardIds, input)
    const isBetterValue = candidate.netAnnualValue > bestWallet.netAnnualValue
    const isTieWithFewerCards = candidate.netAnnualValue === bestWallet.netAnnualValue && candidate.cardIds.length < bestWallet.cardIds.length

    if (isBetterValue || isTieWithFewerCards) {
      bestWallet = candidate
    }
  }

  return {
    cardIds: bestWallet.cardIds,
    earnedSignupBonusCardIds: bestWallet.earnedSignupBonusCardIds,
    monthlyValue: bestWallet.monthlyValue,
    annualValue: bestWallet.annualValue,
    annualFees: bestWallet.annualFees,
    netAnnualValue: bestWallet.netAnnualValue,
    requiredSignupSpend: bestWallet.requiredSignupSpend,
    signupBonusValue: bestWallet.signupBonusValue
  }
}

export function calculateCreditScenario(input: CalculationInput, includeOptimalWallet = true) {
  const selectedCard = cards.find(card => card.id === input.selectedCardId) ?? defaultCard
  const isBiltCard = selectedCard.issuer === 'BILT'
  const isFreedomFlex = selectedCard.id === 'chase-freedom-flex'
  const selectedPointValueCents = input.pointValues[selectedCard.id] ?? selectedCard.defaultPointValueCents
  const selectedCouponValue = input.couponValues[selectedCard.id] ?? 0
  const categoryRows = spendingCategories.map((category) => {
    const monthlySpend = input.spending[category.key]
    const multiplier = selectedCard.rewards[category.key]
    const monthlyPoints = monthlySpend * multiplier

    return {
      ...category,
      monthlySpend,
      multiplier,
      monthlyPoints
    }
  })
  const totalMonthlySpend = Object.values(input.spending).reduce((total, value) => total + value, 0)
  const biltCashDollars = isBiltCard ? totalMonthlySpend * 0.04 : 0
  const biltCashBonusPoints = Math.min(biltCashDollars / 30 * 1000, isBiltCard ? input.housingPayment : 0)
  const freedomFlexBonusPoints = isFreedomFlex ? input.freedomFlexBonusSpend * 4 : 0
  const baseMonthlyRewards = categoryRows.reduce((total, row) => total + row.monthlyPoints, 0)
  const monthlyRewards = baseMonthlyRewards + biltCashBonusPoints + freedomFlexBonusPoints
  const annualRewards = monthlyRewards * 12
  const annualRewardsValue = annualRewards * selectedPointValueCents / 100
  const signupBiltCashAnnualHousingCap = input.housingPayment * 12
  const signupBiltCashPoints = Math.min(selectedCard.signupBonus.biltCashValue / 30 * 1000, signupBiltCashAnnualHousingCap)
  const signupBiltCashValue = signupBiltCashPoints * selectedPointValueCents / 100
  const signupBonusValue = selectedCard.signupBonus.cashValue + selectedCard.signupBonus.points * selectedPointValueCents / 100 + signupBiltCashValue
  const firstYearGrossValue = annualRewardsValue + (input.includeSignupBonuses ? signupBonusValue : 0)
  const selectedFirstYearAnnualFee = getFirstYearAnnualFee(selectedCard)
  const netAnnualValue = firstYearGrossValue + selectedCouponValue - selectedFirstYearAnnualFee
  const walletStrategy = evaluateWallet(input.walletCardIds, input)
  const walletCards = walletStrategy.cards
  const walletHasFreedomFlex = input.walletCardIds.includes('chase-freedom-flex')
  const walletAllocation = walletStrategy.allocation
  const walletCategoryRows = walletAllocation.categoryRows
  const walletBiltSpend = walletAllocation.biltSpend
  const walletBiltCashPoints = walletAllocation.biltCashPoints
  const walletBiltMonthlyValue = walletAllocation.biltMonthlyValue
  const flexCard = walletCards.find(card => card.id === 'chase-freedom-flex')
  const walletFreedomFlexBonusMonthlyValue = flexCard
    ? input.freedomFlexBonusSpend * 4 * (input.pointValues[flexCard.id] ?? flexCard.defaultPointValueCents) / 100
    : 0
  const walletMonthlyValue = walletAllocation.monthlyValue
  const walletAnnualValue = walletAllocation.annualValue
  const walletAnnualFees = walletStrategy.annualFees
  const walletCouponValue = walletStrategy.couponValue
  const walletNetAnnualValue = walletAnnualValue + walletCouponValue - walletAnnualFees
  const walletSignupBonuses = walletStrategy.signupBonuses
  const walletSignupBonusRows = walletSignupBonuses.rows
  const walletSignupBonusValue = walletSignupBonuses.value
  const optimalWallet = includeOptimalWallet ? findOptimalWallet(input) : undefined

  return {
    selectedCard,
    isBiltCard,
    isFreedomFlex,
    categoryRows,
    totalMonthlySpend,
    biltCashDollars,
    biltHousingPointsCap: isBiltCard ? input.housingPayment : 0,
    biltCashBonusPoints,
    biltCashSpendToMaxCap: input.housingPayment * 0.75,
    freedomFlexBonusPoints,
    monthlyRewards,
    annualRewards,
    annualRewardsValue,
    signupBiltCashAnnualHousingCap,
    signupBiltCashPoints,
    signupBonusValue,
    netAnnualValue,
    selectedFirstYearAnnualFee,
    walletCards,
    walletHasFreedomFlex,
    walletAnnualFees,
    walletCouponValue,
    walletCategoryRows,
    walletBiltSpend,
    walletBiltCashPoints,
    walletBiltMonthlyValue,
    walletFreedomFlexBonusMonthlyValue,
    walletMonthlyValue,
    walletAnnualValue,
    walletNetAnnualValue,
    walletSignupBonusRows,
    walletSignupBonusValue,
    walletFirstYearNetAnnualValue: walletStrategy.netAnnualValue,
    optimalWallet
  }
}

export type CreditCalculationResult = ReturnType<typeof calculateCreditScenario>
