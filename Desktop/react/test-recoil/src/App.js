import { useRecoilState, useRecoilValue } from 'recoil';
import {textState, charCountState} from './Model';
import RecoilTest from './RecoilTest1';

function App() {
  const [text, setText] = useRecoilState(textState);
  
  const CharacterCount = ()=>{
    const count = useRecoilValue(charCountState);
    return <p>{count}</p>
  }

  const onChange = ({target:{value}})=>{
    setText(value);
  }
  return (
    <div className="App">
      <input type="text" value={text} onChange={onChange} />
      <p>{text}</p>
      <hr />
      <RecoilTest/>
      <hr />
      <div>Character Count : {CharacterCount()}</div>
    </div>
  );
}

export default App;
