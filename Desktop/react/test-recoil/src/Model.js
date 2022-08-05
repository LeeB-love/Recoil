import Recoil from 'recoil';

export const url = Recoil.atom({
  key: 'url',
  default: '',
});



export const textState = Recoil.atom({
  key: 'textState',
  default: '',
})


/*
  순수함수 저리하기
  - 함수형 프로그래밍에서는 어떤 외부상태에 의존하지 않고 변경시키지도 않는 side effect가 없는 함수를 순수함수라고 한다.
  동일한 인수가 전달되면 언제나 동일한 값을 반환한다.
  외부상태를 변경하지 않는다.

  순수함수와 비순수함수의 차이점

*/
/*
  Selector는 Recoil에서 함수나, 파생된 상태를 나타낸다. 
  atom이나 다른 selector를 입력으로 받아들이는 순수함수이다(주어진 종속성 값 집합에 대해 항상 동일한 값을 반환하는 함수). 
  get함수만 제공되면 Selector는 읽기만 가능한 RecoilValueReadOnly 객체를 반환한다.
  set 함수가 같이 제공되면 Selector는 쓰기가 가능한 RecoilState 객체를 반환한다.
*/

export const charCountState = Recoil.selector({
  key: 'charCountState',
  get: ({get})=>{
    const text = get(textState); // get함수를 통해 atom이나 selector 상태를 받아올 수 있음
    return text.length;
  }
})

export const todoListState = Recoil.atom({
  key: 'todoListState',
  default: [],
})

