// 覆盖7个改变Array长度的方法
const ArrayProto = Object.create(Array.prototype)
;['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(method => {
  ArrayProto[method] = function () {
    Array.prototype[method].apply(this, arguments)
    // 触发响应式更新
    console.log(`触发了${method}更新`)
  }
})

// 每个key的响应式处理
// 拦截指定对象中指定key
function defineReactive(obj, key, val) {
  // 递归处理object
  observe(val)

  // 创建Dep
  const dep = new Dep()

  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key)
      // 依赖收集
      Dep.target && dep.addDep(Dep.target)
      return val
    },
    set(newVal) {
      if (val !== newVal) {
        console.log('set', key, newVal)
        // 值为object时, 需要做递归响应式处理
        observe(newVal)
        val = newVal

        // 通知更新
        dep.notify()
      }
    }
  })
}

// 整个对象的响应式处理
// 遍历整个对象，对每个key进行拦截
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  // 创建一个Observer实例, 实现拦截
  new Observer(obj)
}

// 对象新添加的属性需要通过set方法实现响应式
function set(obj, key, val) {
  defineReactive(obj, key, val)
}

// proxy代理函数 将内部属性代理到vue实例上 方便使用
function proxy(vm, key) {
  Object.keys(vm[key]).forEach(k => {
    Object.defineProperty(vm, k, {
      get () {
        return vm[key][k]
      },
      set (val) {
        vm[key][k] = val
      }
    })
  })
}

// 数据拦截
class Observer {
  constructor (val) {
    this.value = val

    // 根据类型执行不同操作
    if (Array.isArray(val)) {
      // array
      val.__proto__ = ArrayProto
      for (let i = 0; i < val.length; i++) {
        observe(val[i])
      }
    } else if (typeof val === 'object') {
      // object
      this.walk()
    }
  }

  walk () {
    for (const key in this.value) {
      defineReactive(this.value, key, this.value[key])
    }
  }
}

class Vue {
  constructor (options) {
    // 1. 保存
    this.$options = options
    this.$data = options.data
    this.$methods = options.methods
    // 2. data响应式处理
    observe(this.$data)
    // 3. 代理 $data
    proxy(this, '$data')
    proxy(this, '$methods')
    // 4. 编译
    new Complile(options.el, this)
  }
}

class Complile {
  // el 宿主元素, vm Vue实例
  constructor (el, vm) {
    this.$el = document.querySelector(el)
    this.$vm = vm

    // 解析模板
    if (this.$el) {
      // 编译
      this.compile(this.$el)
    }
  }

  compile (el) {
    el.childNodes.forEach(node => {
      if (node.nodeType === 1) {
        // console.log('编译元素', node.nodeName)
        this.compileElement(node)
      } else if (this.isInter(node)) {
        // console.log('编译文本', node.textContent, RegExp.$1)
        this.compileText(node)
      }

      // 递归
      if (node.childNodes) {
        this.compile(node)
      }
    })
  }

  // 判断插值表达式
  isInter (node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  // 编译文本
  compileText (node) {
    this.update(node, RegExp.$1, 'text')
  }

  // 编译元素: 分析指令、@事件
  compileElement (node) {
    // 获取属性并遍历
    const nodeAttrs = node.attributes
    
    Array.from(nodeAttrs).forEach(attr => {
      const attrName = attr.name  // xxx
      const exp = attr.value  // yyy
      if (this.isDirective(attrName)) {
        // 指令: v-xxx='yyy'
        const dir = attrName.substring(2)
        // 调用指令方法
        this[dir] && this[dir](node, exp)
      } else if (this.isEvent(attrName)) {
        // 事件: @xxx='yyy'
        const event = attrName.substring(1)
        // 添加事件监听
        this.eventHandler(node, exp, event)
      }
    })
  }

  isDirective (attr) {
    return attr.indexOf('v-') === 0
  }

  isEvent (attr) {
    return attr.indexOf('@') === 0
  }

  eventHandler (node, exp, event) {
    const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp]
    node.addEventListener(event, fn.bind(this.$vm))
  }

  // v-model
  model (node, exp) {
    node.addEventListener('input', (e) => {
      this.$vm[exp] = e.target.value
    })
    this.update(node, exp, 'model')
  }
  modelUpdater (node, val) {
    node.value = val
  }

  // v-text
  text (node, exp) {
    this.update(node, exp, 'text')
  }
  textUpdater (node, val) {
    node.textContent = val
  }

  // v-html
  html (node, exp) {
    this.update(node, exp, 'html')
  }
  htmlUpdater (node, val) {
    node.innerHTML = val
  }

  // 提取update, 初始化和更新函数创建
  update (node, exp, dir) {
    const fn = this[dir + 'Updater']
    // 初始化
    fn && fn(node, this.$vm[exp])

    // 更新
    new Watcher(this.$vm, exp, val => {
      fn && fn(node, val)
    })
  }
}

// Watcher: 与视图依赖1:1
const watchers = []
class Watcher {
  constructor (vm, key, updaterFn) {
    this.vm = vm
    this.key = key
    this.updaterFn = updaterFn

    // 依赖收集触发
    Dep.target = this
    this.vm[this.key]
    Dep.target = null
  }

  update () {
    this.updaterFn.call(this.vm, this.vm[this.key])
  }
}

// Dep: 管理Watcher 与key1:1 与Watcher 1:N
class Dep {
  constructor () {
    this.deps = []
  }

  addDep (watcher) {
    this.deps.push(watcher)
  }

  notify () {
    this.deps.forEach(watcher => watcher.update())
  }
}
