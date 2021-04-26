class Vue {
  constructor (options) {
    this.$options = options
    this.$data = options.data
    // 1. 数据响应式
    this.observe(this.$data)
    // 2. 代理$data
    this.proxy(this, '$data')
    // 3. 编译
    this.$el = document.querySelector(options.el)
    this.compile(this.$el)
  }

  textNode (node) {
    console.log(RegExp.$1)
    node.textContent = this[RegExp.$1]
  }

  needCompileText (node) {
    console.log(node.nodeType)
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  isDirective (dir) {
    return dir.startsWith('v-')
  }

  getDirName (dir) {
    return dir.substring(2)
  }

  compile(element) {
    element.childNodes && element.childNodes.forEach(node => {
      if (node.nodeType === 1) {
        // ELEMENT_NODE
        this.compile(node)
        Array.from(node.attributes).forEach(attr => {
          if (this.isDirective(attr.nodeName)) {
            console.log(this.getDirName(attr.nodeName), attr.nodeValue)
          }
        })
      } else if (this.needCompileText(node)) {
        // TEXT_NODE
        this.textNode(node)
      }
    })
  }

  proxy (target, name) {
    Object.keys(target[name]).forEach(key => {
      Object.defineProperty(target, key, {
        get () {
          return target[name][key]
        },
        set(val) {
          target[name][key] = val
          return target[name][key]
        }
      })
    })
  }

  observe (obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    Object.keys(obj).forEach(key => {
      this.reactivity(obj, key, obj[key])
    })
  }

  reactivity (obj, key, value) {
    // 递归响应式
    this.observe(value)
    Object.defineProperty(obj, key, {
      get: () => {
        console.log('get', key)
        return value
      },
      set: val => {
        if (val !== value) {
          console.log('set', key, val)
          value = val
          // 递归响应式
          this.observe(value)
        }
        return value
      }
    })
  }
}