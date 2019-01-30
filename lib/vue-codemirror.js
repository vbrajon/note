export default {
  name: 'codemirror',
  template: `<div class="vue-codemirror" :class="{ merge }">
    <div ref="mergeview" v-if="merge"></div>
    <textarea ref="textarea" :placeholder="placeholder" v-else></textarea>
  </div>`,
  data() {
    return {
      content: '',
      codemirror: null,
      cminstance: null,
      globalOptions: {
        tabSize: 2,
        lineNumbers: true,
        styleActiveLine: true,
        showCursorWhenSelecting: true,
        theme: 'monokai',
        keyMap: 'sublime',

        extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      },
      globalEvents: {}
    }
  },
  props: {
    code: String,
    value: String,
    marker: Function,
    unseenLines: Array,
    placeholder: {
      type: String,
      default: ''
    },
    merge: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      default: () => ({})
    },
    events: {
      type: Array,
      default: () => ([])
    },
  },
  watch: {
    options: {
      deep: true,
      handler(options, oldOptions) {
        for (const key in options) {
          this.cminstance.setOption(key, options[key])
        }
      }
    },
    merge(newVal) {
      this.$nextTick(this.switchMerge)
    },
    code(newVal, oldVal) {
      this.handerCodeChange(newVal, oldVal)
    },
    value(newVal, oldVal) {
      this.handerCodeChange(newVal, oldVal)
    }
  },
  methods: {
    initialize() {
      const cmOptions = Object.assign({}, this.globalOptions, this.options)
      if (this.merge) {
        this.codemirror = CodeMirror.MergeView(this.$refs.mergeview, cmOptions)
        this.cminstance = this.codemirror.edit
      } else {
        this.codemirror = CodeMirror.fromTextArea(this.$refs.textarea, cmOptions)
        this.cminstance = this.codemirror
        this.cminstance.setValue(this.code || this.value || this.content)
      }
      this.cminstance.on('change', cm => {
        this.content = cm.getValue()
        if (this.$emit) {
          this.$emit('input', this.content)
        }
      })

      // 所有有效事件（驼峰命名）+ 去重
      const tmpEvents = {}
      const allEvents = [
        'scroll',
        'changes',
        'beforeChange',
        'cursorActivity',
        'keyHandled',
        'inputRead',
        'electricInput',
        'beforeSelectionChange',
        'viewportChange',
        'swapDoc',
        'gutterClick',
        'gutterContextMenu',
        'focus',
        'blur',
        'refresh',
        'optionChange',
        'scrollCursorIntoView',
        'update'
      ]
      .concat(this.events)
      .concat(this.globalEvents)
      // .filter(e => (!tmpEvents[e] && (tmpEvents[e] = true)))
      .forEach(event => {
        // 循环事件，并兼容 run-time 事件命名
        this.cminstance.on(event, (...args) => {
          // console.log('当有事件触发了', event, args)
          this.$emit(event, ...args)
          const lowerCaseEvent = event.replace(/([A-Z])/g, '-$1').toLowerCase()
          if (lowerCaseEvent !== event) {
            this.$emit(lowerCaseEvent, ...args)
          }
        })
      })

      this.$emit('ready', this.codemirror)
      this.unseenLineMarkers()

      // prevents funky dynamic rendering
      this.refresh()
    },
    refresh() {
      this.$nextTick(() => {
        this.cminstance.refresh()
      })
    },
    destroy() {
      // garbage cleanup
      const element = this.cminstance.doc.cm.getWrapperElement()
      element && element.remove && element.remove()
    },
    handerCodeChange(newVal, oldVal) {
      const cm_value = this.cminstance.getValue()
      if (newVal !== cm_value) {
        const scrollInfo = this.cminstance.getScrollInfo()
        this.cminstance.setValue(newVal)
        this.content = newVal
        this.cminstance.scrollTo(scrollInfo.left, scrollInfo.top)
      }
      this.unseenLineMarkers()
    },
    unseenLineMarkers() {
      if (this.unseenLines !== undefined && this.marker !== undefined) {
        this.unseenLines.forEach(line => {
          const info = this.cminstance.lineInfo(line)
          this.cminstance.setGutterMarker(line, 'breakpoints', info.gutterMarkers ? null : this.marker())
        })
      }
    },
    switchMerge() {
      // Save current values
      const history = this.cminstance.doc.history
      const cleanGeneration = this.cminstance.doc.cleanGeneration
      this.options.value = this.cminstance.getValue()

      this.destroy()
      this.initialize()

      // Restore values
      this.cminstance.doc.history = history
      this.cminstance.doc.cleanGeneration = cleanGeneration
    }
  },
  mounted() {
    this.initialize()
  },
  beforeDestroy() {
    this.destroy()
  }
}
