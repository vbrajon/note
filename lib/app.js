import Codemirror from './vue-codemirror.js'
const Tree = {
  name: 'tree',
  props: ['value'],
  template: `<div class="tree">
    <div class="node" :class="[typeof node, { expanded: ($root.expanded || []).includes(key), active: $root.active === key }]" v-for="node, key in value">
      <div class="key" @click="$emit('click', key)">{{ key }}</div>
      <tree :value="node" @click="k => $emit('click', key + '/' + k)" v-if="typeof node === 'object'"></tree>
    </div>
  </div>`,
  mounted() {
    this.$on('click', key => {
      const node = this.value[key]
      if (!node) return
      this.$root.expanded = this.$root.expanded.includes(key) ? this.$root.expanded.filter(k => k !== key) : this.$root.expanded.concat(key)
      if (typeof node !== 'object') return this.$root.active = key
    })
  },
}
const TreeMixin = {
  data() {
    return {
      expanded: [],
      active: null,
    }
  },
  watch: {
    file: {
      handler() {
        this.active = this.file
      },
      immediate: true,
    },
  },
}

const inject = url =>
  new Promise((resolve, reject) => {
    const el = document.createElement(url.includes('.css') ? 'link' : 'script')
    if (url.includes('.css')) el.rel = 'stylesheet'
    el[url.includes('.css') ? 'href' : 'src'] = url
    el.onload = resolve
    el.onerror = reject
    document.head.appendChild(el)
  })
const download = arr => arr && arr.length && Promise.all(arr.filter(url => !Array.isArray(url)).map(inject)).then(() => download(arr.filter(url => Array.isArray(url)).flat(1)))
const dependencies = [
  // Prettier
  'https://unpkg.com/prettier@1.15.1/standalone.js',
  [
    'https://unpkg.com/prettier@1.15.1/parser-html.js',
    'https://unpkg.com/prettier@1.15.1/parser-angular.js',
    'https://unpkg.com/prettier@1.15.1/parser-babylon.js',
    'https://unpkg.com/prettier@1.15.1/parser-postcss.js',
    'https://unpkg.com/prettier@1.15.1/parser-markdown.js',
    'https://unpkg.com/prettier@1.15.1/parser-yaml.js',
  ],
  // CodeMirror
  'https://unpkg.com/codemirror@5.41.0/lib/codemirror.css',
  'https://unpkg.com/codemirror@5.41.0/lib/codemirror.js',
  [
    'https://unpkg.com/codemirror@5.41.0/theme/monokai.css',
    'https://unpkg.com/codemirror@5.41.0/keymap/sublime.js',
    'https://unpkg.com/codemirror@5.41.0/mode/htmlmixed/htmlmixed.js',
    'https://unpkg.com/codemirror@5.41.0/mode/xml/xml.js',
    'https://unpkg.com/codemirror@5.41.0/mode/javascript/javascript.js',
    'https://unpkg.com/codemirror@5.41.0/mode/css/css.js',
    'https://unpkg.com/codemirror@5.41.0/mode/markdown/markdown.js',
    'https://unpkg.com/codemirror@5.41.0/addon/selection/active-line.js',
    'https://unpkg.com/codemirror@5.41.0/addon/search/search.js',
    'https://unpkg.com/codemirror@5.41.0/addon/search/searchcursor.js',
  ],
  // Git
  'https://unpkg.com/@isomorphic-git/lightning-fs',
  'https://isomorphic-git.org/js/pify.js',
  'https://unpkg.com/isomorphic-git',
  // Vue
  'https://unpkg.com/vue@2.5.17/dist/vue.min.js',
  'https://unpkg.com/marked@0.5.1/marked.min.js',
]
download(dependencies).then(async () => {
  window.PRETTIER_DEBUG = true
  CodeMirror.defineMIME('html', 'htmlmixed')
  CodeMirror.defineMIME('vue', 'htmlmixed')
  CodeMirror.defineMIME('js', 'javascript')
  CodeMirror.defineMIME('json', { name: 'javascript', json: true })
  CodeMirror.defineMIME('ts', { name: 'javascript', typescript: true })
  window.fs = new LightningFS('fs')
  window.pfs = pify(window.fs)
  window.dir = '/dir'
  window.filepath = 'README.md'
  git.plugins.set('fs', window.fs)
  try {
    await pfs.mkdir(dir)
    await git.init({ dir })
  } catch (e) {}
  Promise.chain = ps => ps.reduce((p, t) => p.then(t), Promise.resolve())
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && /s/.test(e.key)) {
      e.preventDefault()
      if (!localStorage.token) return
      Promise.chain([
        git.add({
          dir,
          filepath: localStorage.file,
        }),
        git.commit({
          dir,
          message: 'Update README.md',
          author: {
            name: localStorage.name,
            email: localStorage.email,
          }
        }),
        git.push({
          dir,
          remote: 'origin',
          ref: 'master',
          token: localStorage.token,
        })
      ])
    }
  })

  const files = await git.listFiles({ dir })
  const file = localStorage.file || (files.includes('README.md') ? 'README.md' : null)
  window.log = Vue.prototype.log = console.log.bind(console)
  window.act = Vue.prototype.act = str => ({ active: window.vm && vm.display.includes(str) })
  window.add = Vue.prototype.add = str => vm.display = vm.display.includes(str) ? vm.display : vm.display.concat(str)
  window.del = Vue.prototype.del = str => vm.display = vm.display.filter(d => d !== str)
  window.tog = Vue.prototype.tog = str => vm.display = vm.display.includes(str) ? vm.display.filter(d => d !== str) : vm.display.concat(str)
  window.vm = new Vue({
    el: 'main',
    components: { Codemirror, Tree },
    mixins: [TreeMixin],
    data: {
      text: '',
      mode: 'markdown',
      files,
      file,
      repos: JSON.parse(localStorage.repos || '[]'),
      repo: (localStorage.repo || '').replace('https://github.com/', ''),
      token: localStorage.token || '',
      display: JSON.parse(localStorage.display || '[]'),
    },
    watch: {
      text() {
        pfs.writeFile(dir + '/' + this.file, this.text, 'utf8')
      },
      file: {
        handler() {
          localStorage.file = this.file
          const ext = this.file.split('.').slice(-1)[0]
          pfs
          .readFile(dir + '/' + this.file, { encoding: 'utf8' })
          .then(t => this.text = t)
          .then(_ => this.mode = CodeMirror.mimeModes[ext] ? ext : 'markdown')
        },
        immediate: true,
      },
      repo() {
        if (/^http/.test(this.repo)) localStorage.repo = this.repo
        else localStorage.repo = 'https://github.com/' + this.repo
        this.repo = (localStorage.repo || '').replace('https://github.com/', '')
        window.fs = new LightningFS('fs', { wipe: true })
        window.pfs = pify(window.fs)
        git.plugins.set('fs', window.fs)
        this.files = []
        this.file = null
        this.text = ''
        git.clone({
          dir,
          url: 'https://jcubic.pl/proxy.php?' + localStorage.repo,
          // corsProxy: 'https://cors.isomorphic-git.org',
          // ref: 'master',
          // singleBranch: true,
          // depth: 1,
          token: localStorage.token,
        })
        .then(() => git.listFiles({ dir }))
        .then(files => this.files = files)
        .then(files => this.file = files.includes('README.md') ? 'README.md' : null)
      },
      token() {
        const dl = url => fetch(url + '?access_token=' + this.token).then(r => r.json())
        dl('https://api.github.com/user')
        .then(user => {
          localStorage.token = this.token
          localStorage.name = user.name
          localStorage.email = user.email
          return dl('https://api.github.com/users/' + user.login + '/repos')
        })
        .then(repos => this.repos = repos)
      },
      repos() { localStorage.repos = JSON.stringify(this.repos || []) },
      display() { localStorage.display = JSON.stringify(this.display || []) },
    },
    computed: {
      tree() {
        return this.files.reduce((acc, v) => {
          const path = v.split('/')
          const value = path.pop()
          const target = (path.reduce((a, p) => {
            a[p] = a[p] || {}
            return a[p]
          }, acc) || acc)
          target[value] = value
          return acc
        }, {})
      },
      pretty() {
        const options = {
          parser: this.mode,
          plugins: prettierPlugins,
          printWidth: 240,
          semi: false,
          singleQuote: true,
          trailingComma: 'all',
          htmlWhitespaceSensitivity: 'ignore',
        }
        try {
          return prettier.format(this.text, options)
          // return prettier.format(this.text.replace(/<style>/g, '<!-- prettier-ignore -->\n<style>'), options).replace(/<!-- prettier-ignore -->\n/g, '')
        } catch (e) {
          return e
        }
      },
      preview() {
        if (this.pretty.message && this.mode !== 'markdown') return this.text
        let css = `<link rel="stylesheet" href="/lib/md.css"><base target="_blank" />`
        if (this.pretty.message) return css + '<div class="error">' + this.pretty.message + '</div>' + marked(this.text)
        if (this.mode === 'markdown') return css + marked(this.pretty)
        return this.pretty
      },
    },
  })
})
