/**
 * 云函数请求
 * 请求的定义方法与一般的请求方法相同
 */
import { call as request } from '@/utils';
import { tcb as TCB } from '@/utils/tcb';

const fetchTodo = () => {
  return request(TCB, 'GET_TODOS');
};

const addTodo = data => {
  return request(TCB, 'ADD_TODOS', data);
};

const updateTodo = data => {
  return request(TCB, 'UPDATE_TODOS', data);
};

const removeTodo = id => {
  return request(TCB, 'REMOVE_TODOS', {
    id
  });
};

const removeCompleted = () => {
  return request(TCB, 'REMOVE_COMPLETED');
};

const changeAllState = value => {
  return request(TCB, 'CHANGE_TODO_STATE', {
    completed: value
  });
};

const uploadFile = ({ path, file }) => {
  return TCB.app.uploadFile({
    cloudPath: path || `test-todos/${Date.now()}`,
    filePath: file
  });
};

const deleteFile = ids => {
  return request(TCB, 'DELETE_FILE', {
    ids
  });
};

export default {
  fetchTodo,
  addTodo,
  updateTodo,
  removeTodo,
  removeCompleted,
  changeAllState,
  uploadFile,
  deleteFile
};
