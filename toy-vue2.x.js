// 每个key的响应式处理
// 拦截指定对象中指定key
function defineReactive(obj, key, val) {
  // 递归处理object
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key)
      return val
    },
    set(newVal) {
      if (val !== newVal) {
        console.log('set', key, newVal)
        // 值为object时, 需要做递归响应式处理
        observe(newVal)
        val = newVal
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
    // 2. data响应式处理
    observe(this.$data)
    // 3. 代理 $data
    proxy(this, '$data')
  }
}