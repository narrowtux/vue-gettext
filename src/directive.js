import interpolate from './interpolate'
import translate from './translate'
import { _Vue } from './localVue'


const updateTranslation = (el, binding, vnode) => {

  let attrs = vnode.data.attrs || {}
  let msgid = el.dataset.msgid
  let translateContext = attrs['translate-context']
  let translateN = attrs['translate-n']
  let translatePlural = attrs['translate-plural']
  let isPlural = translateN !== undefined && translatePlural !== undefined

  if (!isPlural && (translateN || translatePlural)) {
    throw new Error('`translate-n` and `translate-plural` attributes must be used together:' + msgid + '.')
  }

  let translation = translate.getTranslation(
    msgid,
    translateN,
    translateContext,
    isPlural ? translatePlural : null,
    el.dataset.currentLanguage
  )

  let msg = interpolate(translation, vnode.context)

  el.innerHTML = msg

}

/**
 * A directive to translate content according to the current language.
 *
 * Use this directive instead of the component if you need to translate HTML content.
 * It's too tricky to support HTML content within the component because we cannot get the raw HTML to use as `msgid`.
 *
 * This directive has a similar interface to the <translate> component, supporting
 * `translate-comment`, `translate-context`, `translate-plural`, `translate-n`.
 *
 * `<p v-translate translate-comment='Good stuff'>This is <strong class='txt-primary'>Sparta</strong>!</p>`
 *
 * If you need interpolation, you must add an expression that outputs binding value that changes with each of the
 * context variable:
 * `<p v-translate="fullName + location">I am %{ fullName } and from %{ location }</p>`
 */
export default {

  bind (el, binding, vnode) {

    // Get the raw HTML and store it in the element's dataset (as advised in Vue's official guide).
    // Note: not trimming the content here as it should be picked up as-is by the extractor.
    let msgid = el.innerHTML
    el.dataset.msgid = msgid

    // Store the current language in the element's dataset.
    el.dataset.currentLanguage = _Vue.config.language

    // Output a info in the console if an interpolation is required but no expression is provided.
    if (!_Vue.config.getTextPluginSilent) {
      let hasInterpolation = msgid.indexOf(interpolate.INTERPOLATION_PREFIX) !== -1
      if (hasInterpolation && !binding.expression) {
        console.info(`No expression is provided for change detection. The translation for this key will be static:\n${msgid}`)
      }
    }

    updateTranslation(el, binding, vnode)

  },

  update (el, binding, vnode) {

    let doUpdate = false

    // Trigger an update if the language has changed.
    if (el.dataset.currentLanguage !== _Vue.config.language) {
      el.dataset.currentLanguage = _Vue.config.language
      doUpdate = true
    }

    // Trigger an update if an optional bound expression has changed.
    if (!doUpdate && binding.expression && (binding.value !== binding.oldValue)) {
      doUpdate = true
    }

    if (doUpdate) {
      updateTranslation(el, binding, vnode)
    }

  },

}
