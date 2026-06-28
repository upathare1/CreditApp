import { defineStore } from 'pinia'
import {
  cards,
  defaultCard,
  getFirstYearAnnualFee,
  spendingCategories,
  toFiniteNumber,
  type CalculationInput,
  type CreditCalculationResult,
  type SavedScenario,
  type SpendKey
} from '~/utils/credit-domain'

export const useCreditStore = defineStore('credit', () => {
  const walletInputsOpen = ref(false)
  const selectedCardId = ref(defaultCard.id)
  const walletCardIds = ref<string[]>([
    'chase-sapphire-preferred',
    'chase-freedom-unlimited',
    'bilt-blue',
    'capitalone-savor'
  ])
  const walletSignupBonusCardIds = ref<string[]>([])
  const pointValues = reactive<Record<string, number>>(
    Object.fromEntries(cards.map(card => [card.id, card.defaultPointValueCents]))
  )
  const couponValues = reactive<Record<string, number>>(
    Object.fromEntries(cards.map(card => [card.id, 0]))
  )
  const spending = reactive<Record<SpendKey, number>>({
    restaurantDelivery: 450,
    travel: 250,
    travelPortal: 300,
    groceries: 650,
    remaining: 900
  })
  const housingPayment = ref(2500)
  const freedomFlexBonusSpend = ref(0)
  const includeSignupBonuses = ref(false)
  const presetName = ref('')
  const scenarioStatus = ref('')
  const walletOptimizerStatus = ref('')
  const isCalculating = ref(false)
  const calculation = ref<CreditCalculationResult | null>(null)

  const selectedCard = computed(() => calculation.value?.selectedCard ?? cards.find(card => card.id === selectedCardId.value) ?? defaultCard)
  const selectedPointValueCents = computed({
    get: () => pointValues[selectedCardId.value] ?? selectedCard.value.defaultPointValueCents,
    set: (value: number) => {
      pointValues[selectedCardId.value] = Number.isFinite(value) ? value : selectedCard.value.defaultPointValueCents
    }
  })
  const selectedCouponValue = computed({
    get: () => couponValues[selectedCardId.value] ?? 0,
    set: (value: number) => {
      couponValues[selectedCardId.value] = Number.isFinite(value) ? Math.max(0, value) : 0
    }
  })

  const calculationInput = computed<CalculationInput>(() => ({
    selectedCardId: selectedCardId.value,
    walletCardIds: [...walletCardIds.value],
    walletSignupBonusCardIds: [...walletSignupBonusCardIds.value],
    spending: { ...spending },
    housingPayment: housingPayment.value,
    freedomFlexBonusSpend: freedomFlexBonusSpend.value,
    includeSignupBonuses: includeSignupBonuses.value,
    pointValues: { ...pointValues },
    couponValues: { ...couponValues }
  }))

  const isBiltCard = computed(() => calculation.value?.isBiltCard ?? selectedCard.value.issuer === 'BILT')
  const isFreedomFlex = computed(() => calculation.value?.isFreedomFlex ?? selectedCard.value.id === 'chase-freedom-flex')
  const categoryRows = computed(() => calculation.value?.categoryRows ?? [])
  const totalMonthlySpend = computed(() => calculation.value?.totalMonthlySpend ?? 0)
  const biltCashDollars = computed(() => calculation.value?.biltCashDollars ?? 0)
  const biltHousingPointsCap = computed(() => calculation.value?.biltHousingPointsCap ?? 0)
  const biltCashBonusPoints = computed(() => calculation.value?.biltCashBonusPoints ?? 0)
  const biltCashSpendToMaxCap = computed(() => calculation.value?.biltCashSpendToMaxCap ?? 0)
  const freedomFlexBonusPoints = computed(() => calculation.value?.freedomFlexBonusPoints ?? 0)
  const monthlyRewards = computed(() => calculation.value?.monthlyRewards ?? 0)
  const annualRewards = computed(() => calculation.value?.annualRewards ?? 0)
  const annualRewardsValue = computed(() => calculation.value?.annualRewardsValue ?? 0)
  const signupBiltCashAnnualHousingCap = computed(() => calculation.value?.signupBiltCashAnnualHousingCap ?? 0)
  const signupBiltCashPoints = computed(() => calculation.value?.signupBiltCashPoints ?? 0)
  const signupBonusValue = computed(() => calculation.value?.signupBonusValue ?? 0)
  const netAnnualValue = computed(() => calculation.value?.netAnnualValue ?? 0)
  const selectedFirstYearAnnualFee = computed(() => calculation.value?.selectedFirstYearAnnualFee ?? getFirstYearAnnualFee(selectedCard.value))
  const walletCards = computed(() => calculation.value?.walletCards ?? cards.filter(card => walletCardIds.value.includes(card.id)))
  const walletHasFreedomFlex = computed(() => calculation.value?.walletHasFreedomFlex ?? walletCardIds.value.includes('chase-freedom-flex'))
  const walletAnnualFees = computed(() => calculation.value?.walletAnnualFees ?? 0)
  const walletCouponValue = computed(() => calculation.value?.walletCouponValue ?? 0)
  const walletCategoryRows = computed(() => calculation.value?.walletCategoryRows ?? [])
  const walletBiltSpend = computed(() => calculation.value?.walletBiltSpend ?? 0)
  const walletBiltCashPoints = computed(() => calculation.value?.walletBiltCashPoints ?? 0)
  const walletBiltMonthlyValue = computed(() => calculation.value?.walletBiltMonthlyValue ?? 0)
  const walletFreedomFlexBonusMonthlyValue = computed(() => calculation.value?.walletFreedomFlexBonusMonthlyValue ?? 0)
  const walletMonthlyValue = computed(() => calculation.value?.walletMonthlyValue ?? 0)
  const walletAnnualValue = computed(() => calculation.value?.walletAnnualValue ?? 0)
  const walletNetAnnualValue = computed(() => calculation.value?.walletNetAnnualValue ?? 0)
  const walletSignupBonusRows = computed(() => calculation.value?.walletSignupBonusRows ?? [])
  const walletSignupBonusValue = computed(() => calculation.value?.walletSignupBonusValue ?? 0)
  const walletFirstYearNetAnnualValue = computed(() => calculation.value?.walletFirstYearNetAnnualValue ?? 0)
  const optimalWallet = computed(() => calculation.value?.optimalWallet ?? {
    cardIds: [defaultCard.id],
    earnedSignupBonusCardIds: [],
    monthlyValue: 0,
    annualValue: 0,
    annualFees: 0,
    netAnnualValue: 0,
    requiredSignupSpend: 0,
    signupBonusValue: 0
  })

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
  const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  })

  let requestId = 0
  let refreshTimer: ReturnType<typeof setTimeout> | undefined

  async function refreshCalculations(optimizeWallet = false) {
    const currentRequest = requestId + 1

    requestId = currentRequest
    isCalculating.value = true

    try {
      const result = await $fetch<CreditCalculationResult>('/api/calculate', {
        method: 'POST',
        body: {
          ...calculationInput.value,
          optimizeWallet
        }
      })

      if (currentRequest === requestId) {
        calculation.value = result
      }

      return result
    } finally {
      if (currentRequest === requestId) {
        isCalculating.value = false
      }
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    refreshTimer = setTimeout(() => {
      void refreshCalculations()
    }, 120)
  }

  if (import.meta.client) {
    watch(calculationInput, scheduleRefresh, { deep: true })
  }

  function formatCurrency(value: number) {
    return currencyFormatter.format(value)
  }

  function formatNumber(value: number) {
    return numberFormatter.format(value)
  }

  function formatAnnualFeeLabel(card: typeof cards[number]) {
    const baseFee = card.annualFee === 0 ? 'No annual fee' : `${formatCurrency(card.annualFee)} fee`

    if (card.firstYearAnnualFee !== undefined && card.firstYearAnnualFee !== card.annualFee) {
      return `${baseFee}; ${formatCurrency(card.firstYearAnnualFee)} first year`
    }

    return baseFee
  }

  async function autoPickOptimalWallet() {
    const result = await refreshCalculations(true)
    const nextWallet = result?.optimalWallet ?? optimalWallet.value

    walletCardIds.value = nextWallet.cardIds
    const valueLabel = nextWallet.earnedSignupBonusCardIds.length > 0 ? 'first-year net value' : 'net annual value'
    walletOptimizerStatus.value = `Auto-picked ${nextWallet.cardIds.length} cards for ${formatCurrency(nextWallet.netAnnualValue)} ${valueLabel}.`
  }

  function toggleWalletSignupBonus(cardId: string) {
    if (walletSignupBonusCardIds.value.includes(cardId)) {
      walletSignupBonusCardIds.value = walletSignupBonusCardIds.value.filter(id => id !== cardId)
      return
    }

    walletSignupBonusCardIds.value = [...walletSignupBonusCardIds.value, cardId]
  }

  function buildSavedScenario(name: string): SavedScenario {
    return {
      version: 1,
      name,
      selectedCardId: selectedCardId.value,
      walletCardIds: [...walletCardIds.value],
      walletSignupBonusCardIds: [...walletSignupBonusCardIds.value],
      spending: { ...spending },
      housingPayment: housingPayment.value,
      freedomFlexBonusSpend: freedomFlexBonusSpend.value,
      includeSignupBonuses: includeSignupBonuses.value,
      pointValues: { ...pointValues },
      couponValues: { ...couponValues }
    }
  }

  function saveScenario(name: string) {
    const normalizedName = name.trim() || 'Credit Card Preset'
    const filenameName = normalizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'preset'
    const data = JSON.stringify(buildSavedScenario(normalizedName), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    presetName.value = normalizedName
    link.href = url
    link.download = `credit-card-${filenameName}-${date}.json`
    link.click()
    URL.revokeObjectURL(url)

    scenarioStatus.value = `Saved "${normalizedName}".`
  }

  function applySavedScenario(data: Partial<SavedScenario>) {
    if (typeof data.name === 'string' && data.name.trim()) {
      presetName.value = data.name.trim()
    }

    if (typeof data.selectedCardId === 'string' && cards.some(card => card.id === data.selectedCardId)) {
      selectedCardId.value = data.selectedCardId
    }

    if (data.spending && typeof data.spending === 'object') {
      for (const category of spendingCategories) {
        spending[category.key] = Math.max(0, toFiniteNumber(data.spending[category.key], spending[category.key]))
      }
    }

    if (Array.isArray(data.walletCardIds)) {
      const nextWalletCardIds = data.walletCardIds.filter(cardId => cards.some(card => card.id === cardId))

      if (nextWalletCardIds.length > 0) {
        walletCardIds.value = nextWalletCardIds
      }
    }

    if (Array.isArray(data.walletSignupBonusCardIds)) {
      walletSignupBonusCardIds.value = data.walletSignupBonusCardIds.filter(cardId => cards.some(card => card.id === cardId))
    }

    housingPayment.value = Math.max(0, toFiniteNumber(data.housingPayment, housingPayment.value))
    freedomFlexBonusSpend.value = Math.max(0, toFiniteNumber(data.freedomFlexBonusSpend, freedomFlexBonusSpend.value))

    if (typeof data.includeSignupBonuses === 'boolean') {
      includeSignupBonuses.value = data.includeSignupBonuses
    }

    if (data.pointValues && typeof data.pointValues === 'object') {
      for (const card of cards) {
        pointValues[card.id] = Math.max(0, toFiniteNumber(data.pointValues[card.id], pointValues[card.id]))
      }
    }

    if (data.couponValues && typeof data.couponValues === 'object') {
      for (const card of cards) {
        couponValues[card.id] = Math.max(0, toFiniteNumber(data.couponValues[card.id], couponValues[card.id]))
      }
    }

    void refreshCalculations()
  }

  async function loadScenario(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text) as Partial<SavedScenario>
      const loadedName = typeof data.name === 'string' ? data.name.trim() : ''

      applySavedScenario(data)
      presetName.value = loadedName || file.name.replace(/\.json$/i, '')
      scenarioStatus.value = loadedName ? `Loaded "${loadedName}".` : `Loaded ${file.name}.`
    } catch {
      scenarioStatus.value = 'Could not load that JSON file.'
    } finally {
      input.value = ''
    }
  }

  function toggleWalletCard(cardId: string) {
    if (walletCardIds.value.includes(cardId)) {
      walletCardIds.value = walletCardIds.value.filter(id => id !== cardId)
      return
    }

    walletCardIds.value = [...walletCardIds.value, cardId]
  }

  return {
    spendingCategories,
    cards,
    walletInputsOpen,
    selectedCardId,
    walletCardIds,
    walletSignupBonusCardIds,
    pointValues,
    couponValues,
    spending,
    housingPayment,
    freedomFlexBonusSpend,
    includeSignupBonuses,
    presetName,
    isCalculating,
    selectedCard,
    isBiltCard,
    isFreedomFlex,
    categoryRows,
    totalMonthlySpend,
    biltCashDollars,
    biltHousingPointsCap,
    biltCashBonusPoints,
    biltCashSpendToMaxCap,
    freedomFlexBonusPoints,
    monthlyRewards,
    annualRewards,
    selectedPointValueCents,
    selectedCouponValue,
    annualRewardsValue,
    signupBiltCashAnnualHousingCap,
    signupBiltCashPoints,
    signupBonusValue,
    netAnnualValue,
    selectedFirstYearAnnualFee,
    scenarioStatus,
    walletOptimizerStatus,
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
    walletFirstYearNetAnnualValue,
    optimalWallet,
    refreshCalculations,
    formatCurrency,
    formatNumber,
    formatAnnualFeeLabel,
    autoPickOptimalWallet,
    toggleWalletSignupBonus,
    saveScenario,
    loadScenario,
    toggleWalletCard
  }
})
