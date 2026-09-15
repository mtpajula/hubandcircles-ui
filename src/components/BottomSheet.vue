<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SHEET_PEEK_HEIGHT, nextState, type SheetState } from '../data/sheet'

/**
 * Bottom sheet of the mobile map page (UI-SPEC 5.0): the sidebar content over the map with two
 * states, `open` (top at 45 dvh, scrolls inside) and `peek` (handle and title row only). The
 * header is one button: a tap toggles, a drag past the threshold goes in its direction, the
 * keyboard gets `aria-expanded`. The state itself belongs to the page (route query).
 */
defineProps<{ title: string }>()
const state = defineModel<SheetState>('state', { required: true })
const { t } = useI18n()

/** Pixels a pointer must travel before the release counts as a drag instead of a tap. */
const DRAG_THRESHOLD = 24

const drag = ref<{ startY: number; deltaY: number } | null>(null)
/** Set by a pointer release so that the click the browser fires afterwards is ignored. */
let handledByPointer = false

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag.value = { startY: e.clientY, deltaY: 0 }
}
function onPointerMove(e: PointerEvent) {
  if (drag.value) drag.value = { ...drag.value, deltaY: e.clientY - drag.value.startY }
}
function onPointerUp(e: PointerEvent) {
  if (!drag.value) return
  const deltaY = e.clientY - drag.value.startY
  drag.value = null
  handledByPointer = true
  state.value = nextState(state.value, deltaY, DRAG_THRESHOLD)
}
function onPointerCancel() {
  drag.value = null
}
/** Keyboard activation (Enter/Space) reaches here without a pointer sequence. */
function onClick() {
  if (handledByPointer) {
    handledByPointer = false
    return
  }
  state.value = nextState(state.value)
}
/** The sheet follows the finger while dragging; the transition takes over on release. */
const dragStyle = computed(() => {
  const d = drag.value
  if (!d) return undefined
  const offset = state.value === 'open' ? Math.max(0, d.deltaY) : Math.min(0, d.deltaY)
  const rest = state.value === 'peek' ? `100% - ${SHEET_PEEK_HEIGHT}px` : '0px'
  return { transform: `translateY(calc(${rest} + ${offset}px))`, transition: 'none' }
})
</script>

<template>
  <aside class="sheet" :class="state" :style="dragStyle">
    <button
      type="button"
      class="header"
      :aria-expanded="state === 'open'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @click="onClick"
    >
      <span class="grab" aria-hidden="true"><span class="bar"></span></span>
      <span class="title">{{ title }}</span>
      <span class="sr-only">{{ t('sheet.toggle') }}</span>
    </button>
    <div class="content" :class="{ scroll: state === 'open' }">
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.sheet {
  /* Geometry as in src/data/sheet.ts (sheetInset): top at 45 dvh, at least 200 px of map, 64 px peek. */
  --sheet-top: max(45dvh, 200px);
  --sheet-peek-height: 64px;
  position: fixed;
  top: var(--sheet-top);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  background: var(--surface-panel);
  border-radius: 16px 16px 0 0;
  box-shadow: var(--shadow-frame);
  transform: translateY(0);
  transition: transform 200ms ease-out;
}
.sheet.peek {
  transform: translateY(calc(100% - var(--sheet-peek-height)));
}
.header {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: var(--sheet-peek-height);
  margin: 0;
  padding: 0 16px;
  border: 0;
  border-radius: 16px 16px 0 0;
  background: none;
  color: var(--text-strong);
  text-align: left;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.header:focus-visible {
  outline-offset: -3px;
}
.grab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}
.bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-card);
}
.title {
  display: block;
  height: 40px;
  font: 700 15px/36px var(--font-family);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.content.scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
