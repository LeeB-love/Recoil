import { useRecoilState } from 'recoil';
import * as Model from './Model';

// eslint-disable-next-line import/no-anonymous-default-export
export default ()=>{
  const [textState] = useRecoilState(Model.textState);
  return (
    <div>
      {textState}
    </div>
  )
}