// Object响应式实现

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
  for (const key in obj) {
    defineReactive(obj, key, obj[key])
  }
}

// 对象新添加的属性需要通过set方法实现响应式
function set(obj, key, val) {
  defineReactive(obj, key, val)
}

const obj = {
  name: '',
  sex: {
    man: 1,
    woman: 1
  }
}

observe(obj)

// 非响应式
// obj.sex.age = 1
// obj.age // get方法未触发 ×
// 响应式
set(obj, 'age', 18)
obj.age // get方法触发 √


// Array响应式实现

// 如果使用上述对象的响应式实现
const arr = [1, 2]
observe(arr)
arr[0] // get方法触发 √
arr.push(2) // 无法变成响应式

