<script setup>
// setup语法糖，可以省略return，顶层的绑定会被暴露给模板
import { computed, reactive, toRefs, watchEffect } from 'vue';

// Storage
const STORAGE_KEY = 'todos-vue3';
const	todoStorage = {
  fetch: function () {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },
  save: function (todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }
};

// 数据过滤
const filters = {
  all: todos => todos,
  active: todos => todos.filter(todo => !todo.completed),
  completed: todos => todos.filter(todo => todo.completed)
};

// 响应式对象
const state = reactive({
  todos: todoStorage.fetch(),
  newTodo: '',
  beforeEditCache: '',
  editedTodo: null,
  visibility: 'all',
});
// 将一个响应式对象转换为一个普通对象，这个普通对象的每个 property 都是指向源对象相应 property 的 ref。每个单独的 ref 都是使用 toRef() 创建的。
// ref 与其源 property 保持同步：改变源 property 将更新 ref，反之亦然。
const { todos, newTodo, beforeEditCache, editedTodo, visibility } = toRefs(state);

// 自定义指令
const vTodoFocus = (el, binding) => {
  if (binding.value) {
    el.focus();
  }
};

// 计算属性
const filteredTodos = computed(() => {
  return filters[state.visibility](state.todos);
});
const remaining = computed(() => {
  return filters['active'](state.todos).length;
});
const allDone = computed({
  get: function () {
    return remaining === 0;
  },
  set: function (value) {
    state.todos.forEach(todo => { todo.completed = value });
  }
});

// 监视器 响应式地追踪其依赖
watchEffect(() => {
  todoStorage.save(state.todos)
});

// 方法
function addTodo() {
  const value = state.newTodo.trim();
  if(!value) return;
  state.todos.push({
    id: new Date().getTime(),
    title: value,
    completed: false
  });
  state.newTodo = '';
}

function editTodo(todo) {
  state.beforeEditCache = todo.title;
  state.editedTodo = todo;
}

function doneEdit(todo) {
  // if the user exits without changing the todo, restore it
  if(!state.editedTodo) return;
  todo.title = todo.title.trim();
  state.editedTodo = null;
  // If the todo is empty, remove it
  if (!todo.title) {
    removeTodo(todo);
  }
}

// 退出编辑状态
function cancelEdit(todo) {
  state.editedTodo = null;
  todo.title = state.beforeEditCache;
}

function removeTodo(todo) {
  state.todos.splice(state.todos.indexOf(todo), 1);
}

function removeCompleted() {
  // 若定义时使用 todos = reactive([]) ，在此处无法直接赋值，因为todos是一个proxy响应式数组，不能直接赋值
  // 参阅 https://blog.51cto.com/u_15049782/4295376
  state.todos = filters['active'](state.todos);
}
</script>

<template>
  <main class="todo-app">
    <header class="todo-header">
      <h1>todos</h1>
      <input class="new-todo" autofocus autocomplete="off" placeholder="输入你要做的事，回车键添加" v-model="newTodo" @keydown.enter="addTodo" />
    </header>
    <section class="todo-main" v-show="todos.length">
      <input id="toggle-all" class="toggle-all" type="checkbox" v-model="allDone" />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li class="todo-item" v-for="todo in filteredTodos" :key="todo.id" :class="{ completed: todo.completed, editing: todo == editedTodo }">
          <div class="view">
            <input class="toggle" type="checkbox" v-model="todo.completed" />
            <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo" @blur="doneEdit(todo)" @keydown.enter="doneEdit(todo)" @keydown.esc="cancelEdit(todo)" />
        </li>
      </ul>
    </section>
    <footer class="todo-footer" v-show="todos.length">
      <span class="todo-count"> <strong v-text="remaining"></strong> 项剩余 </span>
      <ul class="filters">
        <li><a :class="{ selected: visibility == 'all' }" @click="visibility = 'all'">所有</a></li>
        <li><a :class="{ selected: visibility == 'active' }" @click="visibility = 'active'">进行中</a></li>
        <li><a :class="{ selected: visibility == 'completed' }" @click="visibility = 'completed'">已完成</a></li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">清除已完成项</button>
    </footer>
  </main>
</template>

<style>
.hidden {
  display: none;
}

.todo-app {
  background: #fff;
  margin: 130px auto 40px;
  position: relative;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
}

.todo-app input::input-placeholder,
.todo-app input::-webkit-input-placeholder,
.todo-app input::-moz-placeholder {
  font-style: italic;
  font-weight: 300;
  color: #e6e6e6;
}

.todo-app h1 {
  position: absolute;
  top: -155px;
  width: 100%;
  font-size: 100px;
  font-weight: 100;
  text-align: center;
  color: rgba(175, 47, 47, 0.15);
  -webkit-text-rendering: optimizeLegibility;
  -moz-text-rendering: optimizeLegibility;
  text-rendering: optimizeLegibility;
}

.new-todo,
.edit {
  position: relative;
  margin: 0;
  width: 100%;
  font-size: 24px;
  font-family: inherit;
  font-weight: inherit;
  line-height: 1.4em;
  border: 0;
  color: inherit;
  padding: 6px;
  border: 1px solid #999;
  box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.new-todo {
  padding: 16px 16px 16px 60px;
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: inset 0 -2px 1px rgba(0, 0, 0, 0.03);
}

.todo-main {
  position: relative;
  z-index: 2;
  border-top: 1px solid #e6e6e6;
}

.toggle-all {
  text-align: center;
  border: none; /* Mobile Safari */
  opacity: 0;
  position: absolute;
}

.toggle-all + label {
  width: 60px;
  height: 34px;
  font-size: 0;
  position: absolute;
  top: -52px;
  left: -13px;
  -webkit-transform: rotate(90deg);
  transform: rotate(90deg);
}

.toggle-all + label:before {
  content: '❯';
  font-size: 22px;
  color: #e6e6e6;
  padding: 10px 27px 10px 27px;
}

.toggle-all:checked + label:before {
  color: #737373;
}

.todo-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.todo-list li {
  position: relative;
  font-size: 24px;
  border-bottom: 1px solid #ededed;
}

.todo-list li:last-child {
  border-bottom: none;
}

.todo-list li.editing {
  border-bottom: none;
  padding: 0;
}

.todo-list li.editing .edit {
  display: block;
  width: 506px;
  padding: 12px 16px;
  margin: 0 0 0 43px;
}

.todo-list li.editing .view {
  display: none;
}

.todo-list li .toggle {
  text-align: center;
  width: 40px;
  /* auto, since non-WebKit browsers doesn't support input styling */
  height: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 10;
  margin: auto 0;
  border: none; /* Mobile Safari */
  -webkit-appearance: none;
  appearance: none;
}

.todo-list li .toggle {
  opacity: 0;
}

.todo-list li .toggle + label {
  /*
		Firefox requires `#` to be escaped - https://bugzilla.mozilla.org/show_bug.cgi?id=922433
		IE and Edge requires *everything* to be escaped to render, so we do that instead of just the `#` - https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7157459/
	*/
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center left;
}

.todo-list li .toggle:checked + label {
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E');
}

.todo-list li label {
  word-break: break-all;
  padding: 15px 15px 15px 60px;
  display: block;
  line-height: 1.2;
  transition: color 0.4s;
}

.todo-list li.completed label {
  color: #d9d9d9;
  text-decoration: line-through;
}

.todo-list li .destroy {
  display: none;
  position: absolute;
  top: 0;
  right: 10px;
  bottom: 0;
  width: 40px;
  height: 40px;
  margin: auto 0;
  font-size: 30px;
  color: #cc9a9a;
  margin-bottom: 11px;
  transition: color 0.2s ease-out;
}

.todo-list li .destroy:hover {
  color: #af5b5e;
}

.todo-list li .destroy:after {
  content: '×';
}

.todo-list li:hover .destroy {
  display: block;
}

.todo-list li .edit {
  display: none;
}

.todo-list li.editing:last-child {
  margin-bottom: -1px;
}

.todo-footer {
  color: #777;
  padding: 10px 15px;
  height: 40px;
  text-align: center;
  border-top: 1px solid #e6e6e6;
}

.todo-footer:before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 50px;
  overflow: hidden;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2), 0 8px 0 -3px #f6f6f6, 0 9px 1px -3px rgba(0, 0, 0, 0.2), 0 16px 0 -6px #f6f6f6, 0 17px 2px -6px rgba(0, 0, 0, 0.2);
}

.todo-count {
  float: left;
  text-align: left;
}

.todo-count strong {
  font-weight: 300;
}

.filters {
  margin: 0;
  padding: 0;
  list-style: none;
  position: absolute;
  right: 0;
  left: 0;
}

.filters li {
  display: inline;
}

.filters li a {
  color: inherit;
  margin: 3px;
  padding: 3px 7px;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 3px;
}

.filters li a:hover {
  border-color: hsla(160, 100%, 37%, 1);
  cursor: pointer;
}

.filters li a.selected {
  background-color: hsla(160, 100%, 37%, 1);
  color: #fff;
}

.clear-completed,
html .clear-completed:active {
  float: right;
  position: relative;
  line-height: 20px;
  text-decoration: none;
  cursor: pointer;
}

.clear-completed:hover {
  text-decoration: underline;
}

/*
	Hack to remove background from Mobile Safari.
	Can't use it globally since it destroys checkboxes in Firefox
*/
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .toggle-all,
  .todo-list li .toggle {
    background: none;
  }

  .todo-list li .toggle {
    height: 40px;
  }
}

@media (max-width: 430px) {
  .todo-footer {
    height: 50px;
  }

  .filters {
    bottom: 10px;
  }
}
</style>
