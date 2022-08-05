import Recoil from 'recoil';
import * as Model from './Model';
import TodoItem from './TodoItem';
import TodoItemCreator from './TodoItemCreator';


const TodoList = ()=>{
  const todoList = Recoil.useRecoilValue(Model.todoListState);
  //useRecoilvalue 하면 state 값을 읽어올 수 있고, useRecoilState하면 useState처럼 읽고 쓸 수 있음.
  return (
    <div>
      <TodoItemCreator/>
      {todoList.map((item,index)=><TodoItem key={index} item={item} id={index}/>)}
    </div>
  )
}

export default TodoList;