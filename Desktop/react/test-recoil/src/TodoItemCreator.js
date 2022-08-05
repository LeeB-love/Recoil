import Recoil from 'recoil';
import * as Model from './Model';
import { useState } from "react";

const TodoItemCreator = ()=>{
  const [inputValue, setInputValue] = useState('');
  const setTodoList = Recoil.useSetRecoilState(Model.todoListState);
   //useRecoilvalue 하면 state 값을 읽어올 수 있고, useRecoilState하면 useState처럼 읽고 쓸 수 있음. useSetRecoilState하면 쓰는 함수 불러옴

  const onChange = ({target:{value}})=>{
    setInputValue(value);
  }

  const addItem = ()=>{
    setTodoList(list =>[
      ...list,
      {
        text: inputValue,
        isComplete: false,
      }
    ]);
    setInputValue('');
  }


  return (
    <div>
      <input type="text" value={inputValue} onChange={onChange}/>
      <button onClick={addItem}>Add</button>
    </div>
  )
}

export default TodoItemCreator;