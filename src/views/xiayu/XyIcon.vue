<template>
  <svg
    class="xy-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="weight"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="path"
  ></svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: 20 },
  weight: { type: [Number, String], default: 1.7 }
})

const ICONS = {
  dashboard: '<rect x="3.6" y="3.6" width="7" height="7" rx="2"/><rect x="13.4" y="3.6" width="7" height="7" rx="2"/><rect x="3.6" y="13.4" width="7" height="7" rx="2"/><rect x="13.4" y="13.4" width="7" height="7" rx="2"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.4 13.6A5.5 5.5 0 0 1 20.5 18.6"/>',
  user: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5.4 19.6a6.7 6.7 0 0 1 13.2 0"/>',
  calendar: '<rect x="3.6" y="5" width="16.8" height="15" rx="3"/><path d="M3.6 9.4h16.8"/><path d="M8 3.4v3.2M16 3.4v3.2"/>',
  'calendar-check': '<rect x="3.6" y="5" width="16.8" height="15" rx="3"/><path d="M3.6 9.4h16.8"/><path d="M8 3.4v3.2M16 3.4v3.2"/><path d="M8.6 14.6l2.1 2.1 4.1-4.4"/>',
  seat: '<path d="M6.4 11V7.2a2.2 2.2 0 0 1 2.2-2.2h6.8a2.2 2.2 0 0 1 2.2 2.2V11"/><rect x="5" y="11" width="14" height="4.4" rx="1.6"/><path d="M6.6 15.4V19M17.4 15.4V19"/>',
  bag: '<path d="M6.2 8.4h11.6l-1 10.7a1.4 1.4 0 0 1-1.4 1.3H8.6a1.4 1.4 0 0 1-1.4-1.3L6.2 8.4Z"/><path d="M9 8.4V6.8a3 3 0 0 1 6 0v1.6"/>',
  qrcode: '<rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><path d="M14 14h3M20 14v3M14 20h3M20 20v.02M17 17v.02"/>',
  wallet: '<rect x="3.6" y="6" width="16.8" height="13" rx="3"/><path d="M3.6 10.2h16.8"/><path d="M15.6 14.4h1.6"/>',
  shield: '<path d="M12 3.4 5.6 5.9V11c0 4 2.7 7 6.4 8.6 3.7-1.6 6.4-4.6 6.4-8.6V5.9L12 3.4Z"/><path d="M9.4 11.6l1.8 1.8 3.4-3.6"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3.1 2"/>',
  scan: '<path d="M4 8.6V6.2a2.2 2.2 0 0 1 2.2-2.2H8.6M15.4 4h2.4A2.2 2.2 0 0 1 20 6.2v2.4M20 15.4v2.4a2.2 2.2 0 0 1-2.2 2.2H15.4M8.6 20H6.2A2.2 2.2 0 0 1 4 17.8V15.4"/><path d="M3.8 12h16.4"/>',
  crown: '<path d="M4 8.2l3.2 2.8L12 5l4.8 6 3.2-2.8-1.7 10.4H5.7L4 8.2Z"/><path d="M5.9 18.8h12.2"/>',
  truck: '<path d="M3.4 6.6h9.6v9H3.4z"/><path d="M13 9.6h3.6l3.4 3.4v2.6H13z"/><circle cx="7" cy="17.6" r="1.7"/><circle cx="16.6" cy="17.6" r="1.7"/>',
  search: '<circle cx="11" cy="11" r="6.2"/><path d="M20 20l-4.6-4.6"/>',
  bell: '<path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4Z"/><path d="M10 18.4a2 2 0 0 0 4 0"/>',
  download: '<path d="M12 4v10"/><path d="M8 10.4l4 4 4-4"/><path d="M5 19.4h14"/>',
  filter: '<path d="M4 6.4h16l-6.2 7.2v5.2l-3.6 1.4v-6.6L4 6.4Z"/>',
  plus: '<path d="M12 5.6v12.8M5.6 12h12.8"/>',
  minus: '<path d="M5.6 12h12.8"/>',
  check: '<path d="M5 12.6l4.6 4.4L19 7.2"/>',
  close: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8"/>',
  edit: '<path d="M4 20h4l9.6-9.6-4-4L4 16v4Z"/><path d="M13.4 6.6l4 4"/>',
  trash: '<path d="M5 7h14"/><path d="M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7"/><path d="M6.4 7l1 11.4a1.4 1.4 0 0 0 1.4 1.2h6.4a1.4 1.4 0 0 0 1.4-1.2L18.6 7"/>',
  eye: '<path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="2.7"/>',
  'chevron-right': '<path d="M9.6 5.4 16 12l-6.4 6.6"/>',
  'chevron-left': '<path d="M14.4 5.4 8 12l6.4 6.6"/>',
  'chevron-down': '<path d="M5.4 9.5 12 16l6.6-6.5"/>',
  'arrow-up': '<path d="M12 19V5"/><path d="M6.5 10.5 12 5l5.5 5.5"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="M6.5 13.5 12 19l5.5-5.5"/>',
  trend: '<path d="M4 15.5 9.5 10l3.5 3.5L20 6.5"/><path d="M15 6.5h5v5"/>',
  doc: '<rect x="5.2" y="3.4" width="13.6" height="17.2" rx="2.8"/><path d="M8.6 8.2h6.8M8.6 12h6.8M8.6 15.8h4.2"/>',
  fish: '<path d="M4.2 12c2.8-4.1 8-5.4 12.2-3.4 2 1 3.4 2.4 3.9 3.4-0.5 1-1.9 2.4-3.9 3.4C12.2 17.4 7 16.1 4.2 12Z"/><path d="M4.2 12s-1.8-1-1.8-3.2M4.2 12s-1.8 1-1.8 3.2"/><path d="M16.4 10.8v.02"/>',
  location: '<path d="M12 21c4.1-4.5 6.4-7.9 6.4-11A6.4 6.4 0 0 0 5.6 10c0 3.1 2.3 6.5 6.4 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  phone: '<path d="M6.2 4.6h2.9l1.5 3.8-2.1 1.5a11.5 11.5 0 0 0 5 5l1.5-2.1 3.8 1.5v2.9a2 2 0 0 1-2.2 2A15.2 15.2 0 0 1 4.2 6.8 2 2 0 0 1 6.2 4.6Z"/>',
  logout: '<path d="M14 5.4H6.6A1.6 1.6 0 0 0 5 7v10a1.6 1.6 0 0 0 1.6 1.6H14"/><path d="M15.4 8.6 18.8 12l-3.4 3.4"/><path d="M18.8 12H9.2"/>',
  refresh: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19.2 4.4v3.6h-3.6"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5.4"/><path d="M12 7.9v.2"/>',
  warning: '<path d="M12 4 3 19.2h18L12 4Z"/><path d="M12 10.2v4.6M12 17.2v.2"/>',
  moon: '<path d="M20 13.5A7.5 7.5 0 1 1 10.5 4a6 6 0 0 0 9.5 9.5Z"/>',
  gift: '<rect x="4" y="9" width="16" height="4" rx="1.4"/><path d="M5.4 13v6.3a1.3 1.3 0 0 0 1.3 1.3h10.6a1.3 1.3 0 0 0 1.3-1.3V13"/><path d="M12 9v11.6"/><path d="M12 9C11 7 9.4 5.4 8 6.1 6.6 6.8 7.6 9 9.8 9Z"/><path d="M12 9c1-2 2.6-3.6 4-2.9 1.4.7.4 2.9-1.8 2.9Z"/>',
  box: '<path d="M12 3.4 4.4 7.4v9.2L12 20.6l7.6-4V7.4L12 3.4Z"/><path d="M4.4 7.4 12 11.4l7.6-4M12 11.4v9.2"/>',
  ticket: '<path d="M4 8A1.6 1.6 0 0 1 5.6 6.4h12.8A1.6 1.6 0 0 1 20 8v2a2 2 0 0 0 0 4v2a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 16v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6.4v11.2"/>',
  sleep: '<path d="M14 4h5l-5 6h5"/><path d="M4 12h4l-4 5h4"/><path d="M9 17h3l-3 3h3"/>'
}

const path = computed(() => ICONS[props.name] || '')
</script>

<style scoped>
.xy-icon { display: inline-block; stroke: currentColor; flex-shrink: 0; vertical-align: middle; }
</style>
