// Array响应式实现

// 如果使用上述对象的响应式实现
// const arr = [1, 2]
// observe(arr)
// arr[0] // get方法触发 √
// arr.push(2) // 无法变成响应式
// 替换数组原型中7个方法
const orginalProto = Array.prototype;
const arrayProto = Object.create(orginalProto);
['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'].forEach(method => {
  arrayProto[method] = function () {
    // 原始操作
    orginalProto[method].apply(this, arguments)
    // 额外操作
    // 通知更新
    console.log('数组执行' + method + '操作')
  }
})
const arr = [1, 2]
observe(arr)
arr[0] // get方法触发 √
arr.push(2) // 无法变成响应式

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

  // 判断传入类型
  if (Array.isArray(obj)) {
    // 覆盖原型, 替换7个变更操作
    obj.__proto__ = arrayProto;
    // 对数组内部元素执行响应化
    for (let i = 0; i < obj.length; i++) {
      observe(obj[i])
    }
  } else {
    for (const key in obj) {
      defineReactive(obj, key, obj[key])
    }
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


