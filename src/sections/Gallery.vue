<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mediaEntry, mediaPath } from '../data/media'
import { dataPath } from '../data/paths'
import type { GallerySection, PublishedRoute } from '../types/route'

/**
 * Gallery section (UI-SPEC 4.2 item 8): a grid of the 400 px variants; a click opens the 1600 px
 * variant in a native `<dialog>` with the author and licence from `route.media`. Entries without
 * built media are left out (P11). Thumbnails load lazily.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ section: GallerySection; route: PublishedRoute }>()
const { t } = useI18n()

const images = computed(() =>
  props.section.media.flatMap((key) => {
    const entry = mediaEntry(props.route, key)
    const small = mediaPath(props.route, key, '400')
    if (!entry || !small) return []
    return [
      {
        key,
        small: dataPath(small),
        large: dataPath(mediaPath(props.route, key, '1600') ?? small),
        credit: t('gallery.credit', { author: entry.author, license: entry.license }),
      },
    ]
  }),
)

const dialog = ref<HTMLDialogElement | null>(null)
const current = ref<(typeof images.value)[number] | null>(null)

function open(image: (typeof images.value)[number]): void {
  current.value = image
  dialog.value?.showModal()
}
function close(): void {
  dialog.value?.close()
}
/** A click on the backdrop (the dialog element itself, not its content) closes. */
function onDialogClick(e: MouseEvent): void {
  if (e.target === dialog.value) close()
}
</script>

<template>
  <section v-if="images.length" class="gallery">
    <h2 class="eyebrow">{{ t('gallery.title') }}</h2>
    <ul class="grid">
      <li v-for="(image, i) in images" :key="image.key">
        <button
          type="button"
          class="thumb"
          :aria-label="t('gallery.open', { n: i + 1 })"
          @click="open(image)"
        >
          <img :src="image.small" alt="" loading="lazy" width="400" height="300" />
        </button>
      </li>
    </ul>
    <dialog ref="dialog" class="lightbox" @click="onDialogClick" @close="current = null">
      <figure v-if="current" class="figure">
        <img :src="current.large" alt="" />
        <figcaption class="caption">{{ current.credit }}</figcaption>
      </figure>
      <button type="button" class="close" @click="close">{{ t('gallery.close') }}</button>
    </dialog>
  </section>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.eyebrow {
  margin: 0;
  font: var(--text-eyebrow);
  letter-spacing: var(--text-eyebrow-spacing);
  text-transform: uppercase;
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--gap-8);
  margin: 0;
  padding: 0;
  list-style: none;
}
.thumb {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--radius-image);
  overflow: hidden;
  background: var(--surface-placeholder);
  cursor: zoom-in;
}
.thumb img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.lightbox {
  max-width: min(96vw, 1600px);
  max-height: 96vh;
  padding: 0;
  border: 0;
  border-radius: var(--radius-panel);
  background: var(--color-ink);
  color: var(--color-white);
}
.lightbox::backdrop {
  background: rgba(28, 43, 58, 0.8);
}
.figure {
  margin: 0;
}
.figure img {
  display: block;
  max-width: 96vw;
  max-height: calc(96vh - 40px);
  object-fit: contain;
}
.caption {
  padding: 8px 12px;
  font: var(--text-caption-lg);
}
.close {
  position: absolute;
  top: 8px;
  right: 8px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  background: var(--color-white);
  color: var(--color-ink);
  font: 600 13px/1 var(--font-family);
  cursor: pointer;
}
</style>
