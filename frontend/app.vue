<template>
  <div class="min-h-screen flex flex-col bg-transparent font-sans text-brand-700">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})

useHead({
  htmlAttrs: computed(() => head.value.htmlAttrs),
  link: computed(() => head.value.link),
  meta: computed(() => head.value.meta)
})
</script>
