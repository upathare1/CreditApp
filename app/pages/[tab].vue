<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCreditStore } from '~/stores/credit'

type AppTab = 'calculator' | 'wallet'

const route = useRoute()

definePageMeta({
  validate: route => ['card-value', 'wallet-maximizer'].includes(String(route.params.tab))
})

const activeTab = computed<AppTab>(() => String(route.params.tab) === 'wallet-maximizer' ? 'wallet' : 'calculator')
const fileInput = ref<HTMLInputElement | null>(null)
const savePresetModalOpen = ref(false)
const savePresetName = ref('')
const creditStore = useCreditStore()
const {
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
  walletFirstYearNetAnnualValue
} = storeToRefs(creditStore)
const {
  spendingCategories,
  cards,
  formatCurrency,
  formatNumber,
  formatAnnualFeeLabel,
  autoPickOptimalWallet,
  toggleWalletSignupBonus,
  saveScenario,
  loadScenario,
  toggleWalletCard
} = creditStore

await creditStore.refreshCalculations()

function openScenarioFilePicker() {
  fileInput.value?.click()
}

function openSavePresetDialog() {
  savePresetName.value = presetName.value || 'My Spending Preset'
  savePresetModalOpen.value = true
}

function confirmSavePreset() {
  const name = savePresetName.value.trim()

  if (!name) {
    return
  }

  saveScenario(name)
  savePresetModalOpen.value = false
}
</script>

<template>
  <UContainer class="py-6 sm:py-8">
    <div class="mb-5 flex flex-wrap gap-2 border-b border-default pb-3">
      <NuxtLink
        to="/card-value"
        class="rounded-md px-4 py-2 text-sm font-medium transition"
        :class="activeTab === 'calculator' ? 'bg-primary text-inverted' : 'text-muted hover:bg-muted'"
      >
        Card Value Calculator
      </NuxtLink>
      <NuxtLink
        to="/wallet-maximizer"
        class="rounded-md px-4 py-2 text-sm font-medium transition"
        :class="activeTab === 'wallet' ? 'bg-primary text-inverted' : 'text-muted hover:bg-muted'"
      >
        Wallet Maximizer
      </NuxtLink>
    </div>

    <div
      v-if="activeTab === 'calculator'"
      class="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_24rem] xl:items-start"
    >
      <aside class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-normal text-muted">
              Cards
            </p>
            <h1 class="text-xl font-semibold text-highlighted">
              Choose a card
            </h1>
          </div>
          <UBadge variant="soft">
            {{ cards.length }}
          </UBadge>
        </div>

        <div class="grid gap-2">
          <button
            v-for="card in cards"
            :key="card.id"
            type="button"
            class="flex min-h-14 items-center gap-3 rounded-md border px-3 py-2 text-left transition hover:bg-muted"
            :class="selectedCardId === card.id ? 'border-primary bg-primary/10' : 'border-default bg-default'"
            @click="selectedCardId = card.id"
          >
            <span
              class="grid size-9 shrink-0 place-items-center rounded-md bg-gradient-to-br text-xs font-bold shadow-sm"
              :class="[card.palette, card.textClass]"
            >
              {{ card.issuer.slice(0, 1) }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-highlighted">
                {{ card.name }}
              </span>
              <span class="block truncate text-xs text-muted">
                {{ card.issuer }} · {{ formatAnnualFeeLabel(card) }}
              </span>
            </span>
          </button>
        </div>
      </aside>

      <section class="space-y-5">
        <div class="space-y-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-normal text-muted">
              Monthly spend
            </p>
            <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
              Enter Your Spending by Category
            </h2>
          </div>

          <div class="flex flex-col gap-3 rounded-md border border-default bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs text-muted">
                Regular monthly spend
              </p>
              <p class="text-xl font-semibold text-highlighted">
                {{ formatCurrency(totalMonthlySpend) }}
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:items-end">
              <div class="flex flex-wrap gap-2">
                <UButton
                  icon="i-lucide-save"
                  variant="soft"
                  size="sm"
                  @click="openSavePresetDialog"
                >
                  Save Preset
                </UButton>
                <UButton
                  icon="i-lucide-folder-open"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="openScenarioFilePicker"
                >
                  Load Preset
                </UButton>
                <input
                  ref="fileInput"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="loadScenario"
                >
              </div>
              <p
                v-if="scenarioStatus"
                class="text-xs text-muted"
              >
                {{ scenarioStatus }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-2">
          <UCard
            v-for="category in spendingCategories"
            :key="category.key"
            variant="subtle"
          >
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <UIcon
                    :name="category.icon"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <label
                    :for="category.key"
                    class="block text-sm font-medium text-highlighted"
                  >
                    {{ category.label }}
                  </label>
                  <p class="text-xs leading-5 text-muted">
                    {{ category.helper }}
                  </p>
                </div>
                <UBadge variant="soft">
                  {{ selectedCard.rewards[category.key] }}x
                </UBadge>
              </div>

              <UInput
                :id="category.key"
                v-model.number="spending[category.key]"
                type="number"
                min="0"
                step="25"
                icon="i-lucide-dollar-sign"
                size="xl"
              />
            </div>
          </UCard>

          <UCard variant="subtle">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <UIcon
                    name="i-lucide-house"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <label
                    for="housingPayment"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Mortgage / Rent
                  </label>
                  <p class="text-xs leading-5 text-muted">
                    {{ isBiltCard ? 'Used to cap BILT Cash redemption into BILT points' : 'Monthly Mortgage Spend (Points on BILT only)' }}
                  </p>
                </div>
                <UBadge variant="soft">
                  {{ isBiltCard ? 'cap' : '0x' }}
                </UBadge>
              </div>

              <UInput
                id="housingPayment"
                v-model.number="housingPayment"
                type="number"
                min="0"
                step="100"
                icon="i-lucide-dollar-sign"
                size="xl"
              />
            </div>
          </UCard>

          <UCard
            v-if="isFreedomFlex"
            variant="subtle"
          >
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <UIcon
                    name="i-lucide-badge-percent"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <label
                    for="freedomFlexBonusSpend"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Bonus Category
                  </label>
                  <p class="text-xs leading-5 text-muted">
                    Monthly spend in the active quarterly bonus category
                  </p>
                </div>
                <UBadge variant="soft">
                  +4x
                </UBadge>
              </div>

              <UInput
                id="freedomFlexBonusSpend"
                v-model.number="freedomFlexBonusSpend"
                type="number"
                min="0"
                step="25"
                icon="i-lucide-dollar-sign"
                size="xl"
              />
            </div>
          </UCard>
        </div>

        <UCard>
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  Category return
                </h3>
                <p class="text-sm text-muted">
                  Estimated monthly rewards before point valuations or credits.
                </p>
              </div>
              <UBadge
                icon="i-lucide-sparkles"
                variant="soft"
              >
                {{ formatNumber(monthlyRewards) }} points / mo
              </UBadge>
            </div>

            <div class="overflow-hidden rounded-md border border-default">
              <div
                v-for="row in categoryRows"
                :key="row.key"
                class="grid grid-cols-[minmax(0,1fr)_5rem_7rem] items-center gap-3 border-b border-default px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted">
                    {{ row.label }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ formatCurrency(row.monthlySpend) }} monthly spend
                  </p>
                </div>
                <p class="text-sm font-medium text-muted">
                  {{ row.multiplier }}x
                </p>
                <p class="text-right text-sm font-semibold text-highlighted">
                  {{ formatNumber(row.monthlyPoints) }}
                </p>
              </div>
              <div
                v-if="isFreedomFlex"
                class="grid grid-cols-[minmax(0,1fr)_5rem_7rem] items-center gap-3 bg-primary/5 px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted">
                    Freedom Flex bonus category
                  </p>
                  <p class="text-xs text-muted">
                    {{ formatCurrency(freedomFlexBonusSpend) }} monthly bonus-category spend
                  </p>
                </div>
                <p class="text-sm font-medium text-muted">
                  +4x
                </p>
                <p class="text-right text-sm font-semibold text-primary">
                  {{ formatNumber(freedomFlexBonusPoints) }}
                </p>
              </div>
              <div
                v-if="isBiltCard"
                class="grid grid-cols-[minmax(0,1fr)_5rem_7rem] items-center gap-3 bg-primary/5 px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted">
                    BILT Cash housing redemption
                  </p>
                  <p class="text-xs text-muted">
                    Capped at {{ formatNumber(biltHousingPointsCap) }} points by housing payment
                  </p>
                </div>
                <p class="text-sm font-medium text-muted">
                  +4/3x
                </p>
                <p class="text-right text-sm font-semibold text-primary">
                  {{ formatNumber(biltCashBonusPoints) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <aside class="space-y-4">
        <div
          class="relative aspect-[1.586/1] overflow-hidden rounded-lg bg-gradient-to-br p-5 shadow-xl"
          :class="[selectedCard.palette, selectedCard.textClass]"
        >
          <div class="absolute right-5 top-5 h-10 w-14 rounded-md border border-current/25 bg-white/15" />
          <div class="absolute -bottom-16 -right-10 size-40 rounded-full bg-white/10" />
          <div class="absolute -left-12 top-8 size-32 rounded-full bg-black/10" />
          <div class="relative flex h-full flex-col justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-normal opacity-75">
                {{ selectedCard.issuer }}
              </p>
              <p class="mt-3 max-w-52 text-2xl font-bold leading-tight">
                {{ selectedCard.name }}
              </p>
            </div>
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-normal opacity-70">
                  Rewards
                </p>
                <p class="text-sm font-semibold">
                  {{ selectedCard.network }}
                </p>
              </div>
              <span
                class="h-2 w-16 rounded-full"
                :class="selectedCard.accentClass"
              />
            </div>
          </div>
        </div>

        <UCard>
          <div class="space-y-5">
            <div>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-xl font-semibold text-highlighted">
                    {{ selectedCard.name }}
                  </h3>
                  <p class="text-sm text-muted">
                    {{ selectedCard.issuer }}
                  </p>
                </div>
                <UBadge
                  color="neutral"
                  variant="soft"
                >
                  {{ formatAnnualFeeLabel(selectedCard) }}
                </UBadge>
              </div>
              <p class="mt-3 text-sm leading-6 text-muted">
                {{ selectedCard.description }}
              </p>
              <p class="mt-3 rounded-md border border-default bg-muted/30 px-3 py-2 text-xs leading-5 text-muted">
                {{ selectedCard.earningNote }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Annual points
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatNumber(annualRewards) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Net first-year value
                </p>
                <p class="text-xl font-semibold text-primary">
                  {{ formatCurrency(netAnnualValue) }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="w-full rounded-md border px-3 py-3 text-left transition hover:bg-muted"
              :class="includeSignupBonuses ? 'border-primary bg-primary/10' : 'border-default'"
              :aria-pressed="includeSignupBonuses"
              @click="includeSignupBonuses = !includeSignupBonuses"
            >
              <span class="flex items-start gap-3">
                <UIcon
                  :name="includeSignupBonuses ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                  class="mt-0.5 size-5 shrink-0"
                  :class="includeSignupBonuses ? 'text-primary' : 'text-muted'"
                />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-medium text-highlighted">
                    Include signup bonus
                  </span>
                  <span class="block text-xs leading-5 text-muted">
                    Adds the current welcome offer to first-year value.
                  </span>
                </span>
              </span>
            </button>

            <div class="rounded-md border border-default px-3 py-3">
              <div class="space-y-3">
                <div>
                  <p class="text-sm font-medium text-highlighted">
                    Signup bonus
                  </p>
                  <p class="mt-1 text-xs leading-5 text-muted">
                    {{ selectedCard.signupBonus.description }}
                  </p>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-muted">
                      Bonus value
                    </p>
                    <p class="font-semibold text-highlighted">
                      {{ formatCurrency(signupBonusValue) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-muted">
                      Required spend
                    </p>
                    <p class="font-semibold text-highlighted">
                      {{ selectedCard.signupBonus.spendRequirement > 0 ? formatCurrency(selectedCard.signupBonus.spendRequirement) : 'None' }}
                    </p>
                  </div>
                </div>
                <p
                  v-if="selectedCard.signupBonus.biltCashValue > 0"
                  class="text-xs leading-5 text-muted"
                >
                  BILT Cash portion: {{ formatCurrency(selectedCard.signupBonus.biltCashValue) }} converts to {{ formatNumber(signupBiltCashPoints) }} BILT points at $30 per 1,000 points, capped by {{ formatCurrency(signupBiltCashAnnualHousingCap) }} of annual mortgage/rent redemption headroom.
                </p>
              </div>
            </div>

            <div class="rounded-md border border-default px-3 py-3">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <label
                    for="pointValue"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Point value
                  </label>
                  <p class="text-xs text-muted">
                    Used to convert points into estimated dollar value
                  </p>
                </div>
                <div class="flex w-36 items-center gap-2">
                  <UInput
                    id="pointValue"
                    v-model.number="selectedPointValueCents"
                    type="number"
                    min="0"
                    step="0.05"
                    size="md"
                  />
                  <span class="text-xs text-muted">cents</span>
                </div>
              </div>
            </div>

            <div class="rounded-md border border-default px-3 py-3">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <label
                    for="couponValue"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Coupon value
                  </label>
                  <p class="text-xs text-muted">
                    Annual value of benefits and credits you will actually use
                  </p>
                </div>
                <div class="w-36">
                  <UInput
                    id="couponValue"
                    v-model.number="selectedCouponValue"
                    type="number"
                    min="0"
                    step="25"
                    icon="i-lucide-dollar-sign"
                    size="md"
                  />
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-xs text-muted">
                    Ongoing annual value
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ formatCurrency(annualRewardsValue) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted">
                    Signup bonus included
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ includeSignupBonuses ? formatCurrency(signupBonusValue) : formatCurrency(0) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted">
                    Coupon value
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ formatCurrency(selectedCouponValue) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted">
                    First-year fee
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ formatCurrency(selectedFirstYearAnnualFee) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="highlight in selectedCard.highlights"
                :key="highlight"
                variant="soft"
                color="neutral"
              >
                {{ highlight }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <UCard
          v-if="isBiltCard"
          variant="subtle"
        >
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <UIcon
                  name="i-lucide-home"
                  class="size-5"
                />
              </div>
              <div>
                <h3 class="text-base font-semibold text-highlighted">
                  BILT Cash housing boost
                </h3>
                <p class="mt-1 text-sm leading-6 text-muted">
                  BILT cards can turn BILT Cash from everyday purchases into extra points for rent or mortgage payments. The app adds those bonus points until the monthly housing cap is reached.
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Monthly BILT Cash from regular spend
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(biltCashDollars) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Bonus points from BILT Cash
                </p>
                <p class="text-xl font-semibold text-primary">
                  {{ formatNumber(biltCashBonusPoints) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Regular spend needed to max the cap
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(biltCashSpendToMaxCap) }}
                </p>
              </div>
            </div>

            <p class="text-xs leading-5 text-muted">
              Conversion used here: $30 BILT Cash = 1,000 BILT points, which equals 4/3 extra points per dollar of regular spend. The bonus is capped at 1x your monthly mortgage or rent payment.
            </p>
          </div>
        </UCard>
      </aside>
    </div>

    <div
      v-else
      class="grid gap-6 xl:grid-cols-[21rem_minmax(0,1fr)_23rem] xl:items-start"
    >
      <aside class="space-y-3">
        <div>
          <p class="text-xs font-medium uppercase tracking-normal text-muted">
            Wallet
          </p>
          <h1 class="text-xl font-semibold text-highlighted">
            Build Your Wallet
          </h1>
          <p class="mt-1 text-sm leading-6 text-muted">
            Build your wallet manually or let Auto Pick find the best card combination. Activate signup bonuses to include them in first-year optimization.
          </p>
        </div>

        <UCard variant="subtle">
          <div class="space-y-3">
            <UButton
              icon="i-lucide-wand-sparkles"
              block
              :loading="isCalculating"
              @click="autoPickOptimalWallet"
            >
              Auto Pick Best Wallet
            </UButton>
            <p class="text-xs leading-5 text-muted">
              Evaluates rewards, fees, coupon values, activated signup bonuses, and the spending required to earn them.
            </p>
            <p
              v-if="walletOptimizerStatus"
              class="text-xs leading-5 text-primary"
            >
              {{ walletOptimizerStatus }}
            </p>
          </div>
        </UCard>

        <div class="space-y-2">
          <div class="grid grid-cols-[minmax(0,1fr)_5rem] items-end gap-2 px-1">
            <p class="text-xs font-medium text-muted">
              Card
            </p>
            <p class="text-center text-xs font-medium leading-4 text-muted">
              Signup bonus
            </p>
          </div>
          <div
            v-for="card in cards"
            :key="card.id"
            class="grid grid-cols-[minmax(0,1fr)_5rem] gap-2"
          >
            <button
              type="button"
              class="flex min-h-14 min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-left transition hover:bg-muted"
              :class="walletCardIds.includes(card.id) ? 'border-primary bg-primary/10' : 'border-default bg-default'"
              @click="toggleWalletCard(card.id)"
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-md bg-gradient-to-br text-xs font-bold shadow-sm"
                :class="[card.palette, card.textClass]"
              >
                {{ card.issuer.slice(0, 1) }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium leading-5 text-highlighted">
                  {{ card.name }}
                </span>
                <span class="block text-xs leading-4 text-muted">
                  {{ formatAnnualFeeLabel(card) }}
                </span>
              </span>
              <UIcon
                :name="walletCardIds.includes(card.id) ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                class="size-5 shrink-0"
                :class="walletCardIds.includes(card.id) ? 'text-primary' : 'text-muted'"
              />
            </button>
            <button
              type="button"
              class="grid min-h-14 place-items-center rounded-md border transition hover:bg-muted"
              :class="walletSignupBonusCardIds.includes(card.id) ? 'border-primary bg-primary/10 text-primary' : 'border-default bg-default text-muted'"
              :aria-label="`${walletSignupBonusCardIds.includes(card.id) ? 'Exclude' : 'Include'} ${card.name} signup bonus in Auto Pick`"
              :aria-pressed="walletSignupBonusCardIds.includes(card.id)"
              :title="`${walletSignupBonusCardIds.includes(card.id) ? 'Exclude' : 'Include'} signup bonus in Auto Pick`"
              @click="toggleWalletSignupBonus(card.id)"
            >
              <UIcon
                :name="walletSignupBonusCardIds.includes(card.id) ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                class="size-5"
              />
            </button>
          </div>
        </div>
      </aside>

      <section class="space-y-5">
        <div class="space-y-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-normal text-muted">
              Optimization
            </p>
            <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
              Best Card by Spending Category
            </h2>
            <p class="mt-1 text-sm leading-6 text-muted">
              Uses the same spending inputs and point values from the calculator tab.
            </p>
          </div>
        </div>

        <UCard variant="subtle">
          <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-base font-semibold text-highlighted">
                  Spending
                </h3>
                <p class="text-sm text-muted">
                  {{ formatCurrency(totalMonthlySpend) }} monthly spend
                  <span v-if="walletHasFreedomFlex"> - {{ formatCurrency(freedomFlexBonusSpend) }} Freedom Flex bonus spend</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  icon="i-lucide-save"
                  variant="soft"
                  size="sm"
                  @click="openSavePresetDialog"
                >
                  Save Preset
                </UButton>
                <UButton
                  icon="i-lucide-folder-open"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="openScenarioFilePicker"
                >
                  Load Preset
                </UButton>
                <UButton
                  :icon="walletInputsOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="walletInputsOpen = !walletInputsOpen"
                >
                  {{ walletInputsOpen ? 'Hide Inputs' : 'Edit Inputs' }}
                </UButton>
                <input
                  ref="fileInput"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="loadScenario"
                >
              </div>
            </div>

            <p
              v-if="scenarioStatus"
              class="text-xs text-muted"
            >
              {{ scenarioStatus }}
            </p>

            <div
              v-if="walletInputsOpen"
              class="grid gap-3 md:grid-cols-2"
            >
              <UCard
                v-for="category in spendingCategories"
                :key="category.key"
                variant="subtle"
              >
                <div class="space-y-3">
                  <label
                    :for="`wallet-${category.key}`"
                    class="block text-sm font-medium text-highlighted"
                  >
                    {{ category.label }}
                  </label>
                  <UInput
                    :id="`wallet-${category.key}`"
                    v-model.number="spending[category.key]"
                    type="number"
                    min="0"
                    step="25"
                    icon="i-lucide-dollar-sign"
                    size="lg"
                  />
                </div>
              </UCard>

              <UCard variant="subtle">
                <div class="space-y-3">
                  <label
                    for="walletHousingPayment"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Mortgage / Rent
                  </label>
                  <UInput
                    id="walletHousingPayment"
                    v-model.number="housingPayment"
                    type="number"
                    min="0"
                    step="100"
                    icon="i-lucide-dollar-sign"
                    size="lg"
                  />
                </div>
              </UCard>

              <UCard
                v-if="walletHasFreedomFlex"
                variant="subtle"
              >
                <div class="space-y-3">
                  <label
                    for="walletFreedomFlexBonusSpend"
                    class="block text-sm font-medium text-highlighted"
                  >
                    Freedom Flex Bonus Category
                  </label>
                  <UInput
                    id="walletFreedomFlexBonusSpend"
                    v-model.number="freedomFlexBonusSpend"
                    type="number"
                    min="0"
                    step="25"
                    icon="i-lucide-dollar-sign"
                    size="lg"
                  />
                </div>
              </UCard>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  Recommended allocation
                </h3>
                <p class="text-sm text-muted">
                  Annual spending is split where needed to earn worthwhile signup bonuses, then routed for the highest estimated return.
                </p>
              </div>
              <UBadge
                icon="i-lucide-sparkles"
                variant="soft"
              >
                {{ formatCurrency(walletMonthlyValue) }} / mo
              </UBadge>
            </div>

            <div class="overflow-hidden rounded-md border border-default">
              <div
                v-for="row in walletCategoryRows"
                :key="row.key"
                class="border-b border-default px-4 py-4 last:border-b-0"
              >
                <div class="flex min-w-0 items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-highlighted">
                      {{ row.label }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ formatCurrency(row.monthlySpend) }} monthly spend
                    </p>
                  </div>
                  <p class="shrink-0 text-right text-sm font-semibold text-primary">
                    {{ formatCurrency(row.monthlyValue) }}
                  </p>
                </div>

                <div class="mt-3 grid gap-2">
                  <div
                    v-for="allocation in row.allocations"
                    :key="allocation.card.id"
                    class="flex min-w-0 items-start justify-between gap-3 border-t border-default pt-2"
                  >
                    <div class="min-w-0">
                      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p class="min-w-0 break-words text-sm font-medium leading-5 text-highlighted">
                          {{ allocation.card.name }}
                        </p>
                        <UBadge
                          variant="soft"
                          size="sm"
                        >
                          {{ allocation.multiplier }}x
                        </UBadge>
                      </div>
                      <p class="break-words text-xs leading-5 text-muted">
                        {{ formatCurrency(allocation.monthlySpend) }}/mo - {{ allocation.card.issuer }} at {{ pointValues[allocation.card.id] ?? allocation.card.defaultPointValueCents }} cents/point
                      </p>
                    </div>
                    <p class="shrink-0 text-right text-xs font-medium text-muted">
                      {{ formatCurrency(allocation.monthlyValue) }}/mo
                    </p>
                  </div>
                </div>
              </div>
              <div
                v-if="walletBiltMonthlyValue > 0"
                class="border-b border-default bg-primary/5 px-4 py-4"
              >
                <div class="flex min-w-0 items-start justify-between gap-4">
                  <div class="min-w-0 space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      BILT Cash housing boost
                    </p>
                    <p class="break-words text-xs text-muted">
                      From {{ formatCurrency(walletBiltSpend) }} of spend allocated to BILT cards
                    </p>
                    <p class="text-sm text-muted">
                      {{ formatNumber(walletBiltCashPoints) }} bonus points
                    </p>
                  </div>
                  <p class="shrink-0 text-right text-sm font-semibold text-primary">
                    {{ formatCurrency(walletBiltMonthlyValue) }}
                  </p>
                </div>
              </div>
              <div
                v-if="walletFreedomFlexBonusMonthlyValue > 0"
                class="bg-primary/5 px-4 py-4"
              >
                <div class="flex min-w-0 items-start justify-between gap-4">
                  <div class="min-w-0 space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      Freedom Flex bonus category
                    </p>
                    <p class="break-words text-xs text-muted">
                      {{ formatCurrency(freedomFlexBonusSpend) }} monthly bonus-category spend
                    </p>
                    <p class="text-sm text-muted">
                      +4x on selected bonus spend
                    </p>
                  </div>
                  <p class="shrink-0 text-right text-sm font-semibold text-primary">
                    {{ formatCurrency(walletFreedomFlexBonusMonthlyValue) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <aside class="space-y-4">
        <UCard>
          <div class="space-y-4">
            <div>
              <p class="text-xs font-medium uppercase tracking-normal text-muted">
                Wallet value
              </p>
              <h3 class="text-xl font-semibold text-highlighted">
                Optimized annual return
              </h3>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Monthly value
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(walletMonthlyValue) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Annual value
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(walletAnnualValue) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Annual fees
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(walletAnnualFees) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Coupon values
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(walletCouponValue) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Net annual value
                </p>
                <p class="text-xl font-semibold text-primary">
                  {{ formatCurrency(walletNetAnnualValue) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  Signup bonuses
                </p>
                <p class="text-xl font-semibold text-highlighted">
                  {{ formatCurrency(walletSignupBonusValue) }}
                </p>
              </div>
              <div class="rounded-md border border-default px-3 py-3">
                <p class="text-xs text-muted">
                  First-year net
                </p>
                <p class="text-xl font-semibold text-primary">
                  {{ formatCurrency(walletFirstYearNetAnnualValue) }}
                </p>
              </div>
            </div>

            <p class="text-xs leading-5 text-muted">
              Auto Pick uses ongoing rewards, annual fees, coupon values, and any signup bonuses activated in the card picker.
            </p>
          </div>
        </UCard>

        <UCard variant="subtle">
          <div class="space-y-3">
            <div>
              <h3 class="text-base font-semibold text-highlighted">
                Coupon values
              </h3>
              <p class="text-sm leading-6 text-muted">
                Annual value of benefits and credits you expect to use.
              </p>
            </div>

            <div class="grid gap-2">
              <div
                v-for="card in walletCards"
                :key="card.id"
                class="rounded-md border border-default bg-default px-3 py-3"
              >
                <label
                  :for="`wallet-coupon-${card.id}`"
                  class="block text-sm font-medium leading-5 text-highlighted"
                >
                  {{ card.name }}
                </label>
                <div class="mt-2">
                  <UInput
                    :id="`wallet-coupon-${card.id}`"
                    v-model.number="couponValues[card.id]"
                    type="number"
                    min="0"
                    step="25"
                    icon="i-lucide-dollar-sign"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard variant="subtle">
          <div class="space-y-3">
            <div>
              <h3 class="text-base font-semibold text-highlighted">
                Signup bonuses
              </h3>
              <p class="text-sm leading-6 text-muted">
                Activated offers are included only when the optimized allocation can satisfy their annual spending requirement.
              </p>
            </div>

            <div class="grid gap-2">
              <div
                v-for="row in walletSignupBonusRows"
                :key="row.card.id"
                class="rounded-md border px-3 py-3 text-left transition hover:bg-muted"
                :class="row.earned ? 'border-primary bg-primary/10' : 'border-default bg-default'"
              >
                <div class="flex items-start gap-3">
                  <UIcon
                    :name="row.earned ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="mt-0.5 size-5 shrink-0"
                    :class="row.earned ? 'text-primary' : 'text-muted'"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium leading-5 text-highlighted">
                      {{ row.card.name }}
                    </p>
                    <p class="text-xs leading-5 text-muted">
                      {{ row.card.signupBonus.description }}
                    </p>
                    <p
                      v-if="row.activated"
                      class="mt-1 text-xs leading-5 text-muted"
                    >
                      <template v-if="row.requiredSpend > 0">
                        {{ formatCurrency(row.allocatedAnnualSpend) }} allocated annually toward a {{ formatCurrency(row.requiredSpend) }} requirement.
                      </template>
                      <template v-else>
                        No spending requirement.
                      </template>
                    </p>
                    <p
                      v-if="row.earned && row.card.signupBonus.biltCashValue > 0"
                      class="mt-1 text-xs leading-5 text-muted"
                    >
                      BILT Cash converts to {{ formatNumber(row.biltCashPoints) }} points using annual housing headroom.
                    </p>
                  </div>
                  <p class="shrink-0 text-sm font-semibold text-primary">
                    {{ row.earned ? formatCurrency(row.value) : row.activated ? 'Not earned' : 'Not activated' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard variant="subtle">
          <div class="space-y-3">
            <h3 class="text-base font-semibold text-highlighted">
              Notes
            </h3>
            <p class="text-sm leading-6 text-muted">
              Signup spending requirements are modeled across one year. Quarterly limits and issuer-specific eligibility rules are not enforced yet.
            </p>
          </div>
        </UCard>
      </aside>
    </div>
    <UModal
      v-model:open="savePresetModalOpen"
      title="Name this preset"
    >
      <template #body>
        <UFormField label="Preset name">
          <UInput
            v-model="savePresetName"
            placeholder="Monthly household spending"
            icon="i-lucide-tag"
            autofocus
            class="w-full"
            @keyup.enter="confirmSavePreset"
          />
        </UFormField>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="savePresetModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            icon="i-lucide-save"
            :disabled="!savePresetName.trim()"
            @click="confirmSavePreset"
          >
            Save Preset
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
