<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#0f172a' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'alternate icon', type: 'image/x-icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Credit Card Comparison'
const description = 'Compare credit card rewards, fees, and effective value across everyday spending categories.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col">
      <UHeader class="shrink-0">
        <template #left>
          <NuxtLink to="/">
            <span class="flex items-center gap-2 text-sm font-semibold text-highlighted">
              <UIcon
                name="i-lucide-credit-card"
                class="size-5 text-primary"
              />
              Credit Card Comparison
            </span>
          </NuxtLink>
        </template>

        <template #right>
          <UColorModeButton />
        </template>
      </UHeader>

      <main class="min-h-0 flex-1">
        <NuxtPage />
      </main>

      <footer class="shrink-0 border-t border-default py-3">
        <UContainer>
          <p class="text-center text-sm text-muted">
            Copyright &copy; {{ new Date().getFullYear() }} Upamanyu Pathare. Licensed under the GNU Affero General Public License v3.0.
            <a
              href="https://github.com/upathare1/CreditApp"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary hover:underline"
            >
              Source code on GitHub.
            </a>
          </p>
          <p class="mx-auto mt-1 max-w-4xl text-center text-xs leading-5 text-muted">
            Comparisons are estimates for planning purposes only. Reward rates, fees, credits, and issuer terms can change.
          </p>
        </UContainer>
      </footer>
    </div>
  </UApp>
</template>
