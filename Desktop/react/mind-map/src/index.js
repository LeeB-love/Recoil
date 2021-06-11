import React, {useState, useEffect} from 'react';
import { RecoilRoot, atom, selector, useRecoilState, useRecoilValue, } from 'recoil';

import ReactDOM from 'react-dom';
import cloneDeep from 'lodash/cloneDeep';
import './index.css';
// import App from './App';



let nodeNum = 0;
let last = Date.now();


const Canvas = ()=>{

  let canvasRef = React.createRef();
  let spanRef = React.createRef();
  let inputRef = React.createRef();
  let canvas;
  let ctx;

  const [mPoint, setMPoint] = useRecoilState(mousePointState);
  const [node, setNode] = useRecoilState(nodeState);
  const [text, setText] = useRecoilState(textState);
  const [actNode, setActNode] = useRecoilState(activeNode);
  const [input, setInput] = useRecoilState(inputState);
  const [enterCnt, setEnterCnt] = useState();


  //텍스트 작성
  const drawText = (ctx, msg, x, y, font, color)=>{
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = "transparent"
    ctx.font = '16px Arial sans-serif'
    ctx.fillText(msg, x+20, y+47);
  }
 

  // rounded rect 그리기
  const drawRoundRect = (ctx, x, y, width, height, color)=>{
    var rectX = x;
    var rectY = y;
    var rectWidth = width;
    var rectHeight = height;
    var cornerRadius = height-1;

    ctx.lineJoin = "round";
    ctx.lineWidth =cornerRadius;

    ctx.beginPath();
    // 색 설정
    ctx.strokeStyle = color;
    // ctx.fillStyle = color; 

    
    let roundRect = new Path2D();
    roundRect.rect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);

    return roundRect;
  }



  //노드 그리기
  const createNode = (ctx, x, y, pN)=>{
    // node ID
    nodeNum += 1;
    
    //부모노드 없으면 0으로 넣어버리기
    if(typeof pN === 'undefined'){
      pN = 0;
    }

    //도형 생성
    let firstNode = drawRoundRect(ctx, x, y, 200, 70, '#B6E3E9');
   

    let createdNode = {
      num: nodeNum, 
      path: firstNode,
      location: { x: x, y: y, width: 200, height: 70 }, 
      bbox: { x1: x, y1: y, x2: x+200, y2: y+70 }, 
      E: [pN, nodeNum]
    };

    let arr = cloneDeep(node);
    arr.push(createdNode);
    arr = updateBbox(arr, arr[0]);

    // updatedNode = [...tmp, createdNode] 

    // setNode(old =>{
    //   let tmp = old.map(el => (el.num === pN ? {...el, bbox: {...el.bbox, x2: x+200, y2: y+70 }} : el));
    //   return ([...tmp, createdNode])
    // });

    ctx.globalCompositeOperation = 'destination-over'
    
    ctx.font = '30px serif'
    ctx.stroke(firstNode);

    return arr;
  }


  //그림자 생성
  const drawShadow = (ctx, x, y, color, blur)=>{
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor= color;
    ctx.shadowOffsetX = x;
    ctx.shadowOffsetY = y;
    ctx.shadowBlur = blur;
  }


  //최상위 노드 생성
  const handleCanvasDblclick = (e)=>{
    if(node[0]){
      return;
    }
    let updatedNode = createNode(ctx, e.offsetX, e.offsetY);
    setNode(updatedNode);
  }


  //마우스 올린 노드 위치 찾기
  const searchNodeLoca = (x, y)=>{
    if(node.length===0){
      return;
    }
    for(let i=0; i<node.length; i++){
      let loca = node[i].location;
      if((x>loca.x && x<loca.x+loca.width)&&(y>loca.y && y<loca.y+loca.height)){
        return node[i];
      }
    }
  }

  const [txt, setTxt] = useState();
  const createInput = (t, l, w, node)=>{

    const inputStyle = {
      position: "absolute",
      top: t+25,
      left: l+18,
      width: w
    }

    return(
      <div>
        <input type="text" style={inputStyle} ref={inputRef} onChange={e=>{
            setTxt(e.target.value);
            }} 
            onKeyDown={e=>{
              if(e.key === 'Tab'){
                e.preventDefault();
                // e.stopPropagation();
              }
            }}
            value={node ? node.text : undefined} 
            autoFocus/>
      </div>
    )
  }



  //노드 활성화
  const changeNodeToAct = (ctx, node, index)=>{

    //actNode ID 설정
    setActNode(node.num);
    setEnterCnt(1);

    //선택된 노드에 input 삽입
    const textInput = createInput(node.location.y, node.location.x, node.location.width-53, node);
    setInput({box : textInput});
    
    ctx.clearRect(node.location.x, node.location.y, node.location.width, node.location.height);
    
    //====(임시) bbox 영역 확인용 ========
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#F781F3"
    ctx.strokeRect(node.bbox.x1, node.bbox.y1, node.bbox.x2-node.bbox.x1, node.bbox.y2-node.bbox.y1);
    //=====================================

    let path = node.path;
    ctx.globalCompositeOperation = 'source-over';
    // 그림자 추가
    // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
    ctx.lineWidth = node.location.height-1;
    //노드색상 변경
    ctx.strokeStyle = "#FADEE1"
    //그리기
    ctx.stroke(path);
    
    if(typeof node.text !== 'undefined'){
      drawText(ctx, node.text,node.location.x, node.location.y-5);
    }
    
  }

  // actNode 지정된 상태에서 enter 치면 들어오는 곳 ==> 왜 두 번 들어옴?
  // #### 아무것도 안쓰고 enter 치면 undefined 들어오는거 고치기
  // const changeNodeToAct2 = (ctx)=>{
  //   let nodeArr = cloneDeep(node);
  //   console.log(nodeArr);

  //   //actNode 찾아내서
  //   const index = nodeArr.findIndex(obj => obj.num === actNode);
  //   let actN = nodeArr[index];

  //   // txt 길이가 node 넓이보다 클 때,
  //   if(txtWidth>=actN.location.width-53){
  //     console.log("텍스트 길이가 노드 넓이보다 큼", txtWidth, actN.location.width);

  //     //텍스트 길이가 노드 넓이보다 크면, 기존 도형을 지운다.
  //     ctx.clearRect(actN.location.x, actN.location.y, actN.location.width, actN.location.height);

  //     // 텍스트 길이에 맞춰 새 도형 그리기
  //     let newNode = drawRoundRect(ctx, actN.location.x, actN.location.y, txtWidth+53, actN.location.height, '#FADEE1');
  //     ctx.stroke(newNode);

  //     // 기존 도형이 저장되어 있던 node에서 기존도형을 지우고 새 도형으로 업데이트 시킨다.
  //     actN.location.width = txtWidth+53; 
  //     actN.path = newNode;
  //     actN.bbox.x1 = actN.location.x;
  //     actN.bbox.y1 = actN.location.y;
  //     actN.bbox.x2 = actN.location.x+txtWidth+53;
  //     actN.bbox.y2 = actN.location.y+actN.location.height;
  //     console.log(actN.bbox);
      
  //     //다시 썼을 때 위치조정
  //     nodeArr = updateBbox2(nodeArr, actN);
  //     nodeArr = redrawNodes(ctx, nodeArr);
  //     /*
  //       텍스트 추가한 노드도 바운딩 박스 업데이트,
  //       연결되어있는 다른 노드들도 바운딩 박스 업데이트 => updateBbox(nodeArr, node, exnodeNum, exnodeBbox, distanceMoved)
  //       그 뒤에 다 지우고 처음부터 새로 그리기 => redrawNodes(ctx, nodeArr)
      
  //     */
  //   }

  //   //txt 길이가 node 넓이보다 작을 때,
  //   if(txtWidth <= actN.location.width-53){
  //     console.log("텍스트 길이가 노드 넓이보다 작음", txtWidth, actN.location.width);

  //      //텍스트 길이가 노드 넓이보다 작으면, 기존 도형을 지운다.
  //      console.log("actN.location.x, actN.location.y, actN.location.width, actN.location.height", actN.location.x, actN.location.y, actN.location.width, actN.location.height)
  //      ctx.clearRect(actN.location.x, actN.location.y, actN.location.width, actN.location.height);

  //      // 텍스트 길이에 맞춰 새 도형 그리기
  //      let newNode = drawRoundRect(ctx, actN.location.x, actN.location.y, txtWidth+53, actN.location.height, '#FADEE1');
  //      ctx.stroke(newNode);
 
  //      // 기존 도형이 저장되어 있던 node에서 기존도형을 지우고 새 도형으로 업데이트 시킨다.
  //      actN.location.width = txtWidth+53; 
  //      actN.path = newNode;
  //      actN.bbox.x1 = actN.location.x;
  //      actN.bbox.y1 = actN.location.y;
  //      actN.bbox.x2 = actN.location.x+txtWidth+53;
  //      actN.bbox.y2 = actN.location.y+actN.location.height;

  //      nodeArr = updateBbox2(nodeArr, actN);
  //      nodeArr = redrawNodes(ctx, nodeArr);
  //   }

  //   //drawText하기
  //   //drawText(ctx, txt, nodeArr[index].location.x, nodeArr[index].location.y-5);
    
  //   //node 정보 업데이트

  //   //nodeArr[index].text = txt;
  //   setNode(nodeArr);
  //   setEnterCnt(1);
  // }


   // 바운딩 박스 업데이트 시키기 (x 축) => nodeArr : 변경시킬 노드들, node : 현재 걸려있는 노드, exnodeEX : 이전 노드의 X좌표 끝 지점.
   const updateBbox2 = (nodeArr, node)=>{

    // 한 번 체킹된 노드 다시 체크하지 않도록 true로 변경
    node.check = true;
    let nodeEndX = node.location.x + node.location.width;
    
    //자식 노드 검색
    const foundChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check !== true));
    // 자식 노드가 있나?
    if(foundChildN){
      //자식 노드의 location을 현재 노드의 node의 x축 끝지점 보다 200만큼 더 떨어져있게 설정한다.
      foundChildN.location.x = nodeEndX + 100;
      // bbox 재설정
      foundChildN.bbox.x1 = nodeEndX + 100;
      foundChildN.bbox.x2 = nodeEndX + 100 + foundChildN.location.width;

      //자식노드로 이동
      return updateBbox2(nodeArr, foundChildN)
    }

    // 없으면 더 이상 내려갈 곳이 없으니 부모 노드로 올라가기
    else{
      //부모노드 찾기
      const foundParentsN = nodeArr.find(obj => (obj.num === node.E[0]));

      if(foundParentsN){
        //부모노드의 bbox 조정
        if(foundParentsN.bbox.x2<=node.bbox.x2){
          foundParentsN.bbox.x2 = node.bbox.x2;
        }     
      
        //올라가기
        foundParentsN.check = false;
        return updateBbox2(nodeArr, foundParentsN);
      }
      else{ // 없으면 최초노드임
        let arr = nodeArr.map(obj => ({...obj , check : false}));
        return arr;
      }    
    }
  }


  //노드 비활성화   ===> 텍스트가 들어갈 때 마다 노드 정보가 업데이트되는 것보다 비활성화 되는 시점에 업데이트하는 것이 낫겠어요....
  const changeNodeToInact = (ctx, node)=>{
    ctx.clearRect(node.location.x, node.location.y, node.location.width, node.location.height);
    let path = node.path;
    ctx.lineWidth = node.location.height-1;
    ctx.strokeStyle = '#B6E3E9';
    ctx.stroke(path);
    if(typeof node.text !== 'undefined'){
      drawText(ctx, node.text, node.location.x, node.location.y-5);
    }
    setActNode(0);

    setInput({box:null})
  }



  // //대충 캔버스 상에서 마우스 움직일 때 벌어지는 일들...
  // const handleMouseMove = (e)=>{
  //   let x = e.offsetX;
  //   let y = e.offsetY;
    
  //   //커서가 올려진 노드
  //   let node = searchNodeLoca(x, y);
  //   if(node){
  //     setMPoint({x: x, y: y, node: node});
  //   }
  // }


  const handleOnClick = (e)=>{
    let node1 = searchNodeLoca(e.offsetX, e.offsetY);

    if(node1 !== undefined){
      if(actNode !== 0){
        return;
      }
      changeNodeToAct(ctx, node1);
      setEnterCnt(1);
    }
    else{
      if(actNode == 0){
        return;
      }
      const index = node.findIndex(obj => obj.num === actNode);
      changeNodeToInact(ctx, node[index]);
    }
  }


  // const handleKeyPress = (e)=>{
  //   if(actNode !== 0){
  //     //선택되어있는 노드가 있으면, 뭐가 선택되어있는 것인지 node 배열에서 해당 노드를 찾아낸다. 텍스트의 길이가 
  //     const index = node.findIndex(obj => obj.num === actNode);

  //     if(text.width >= 135){
  //       // 텍스트 길이가 140이 넘으면 기존 도형을 지우고
  //       ctx.clearRect(node[index].location.x, node[index].location.y, node[index].location.width, node[index].location.height);    

  //       // 새 도형을 그리기
  //         let loca = node[index].location;

  //         let newNode = drawRoundRect(ctx, loca.x, loca.y, loca.width+(ctx.measureText(text.msg+e.key).width-text.width), 70, '#FADEE1')
  //         // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
  //         ctx.stroke(newNode);
          

  //       // 기존 도형이 저장되어있던 node에서 기존 도형을 삭제하고 새 도형을 넣어서 업데이트.
        
  //       const node1 = node.slice();
  //       // node1[index].location.width = 100;

  //       if(node1.length == 1){
  //         node1.pop();
  //         node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})
  //       }
  //       else{
  //         node1.splice(index,1);
  //         node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})

  //         // let a;
  //         // let as = [1,2,3];
  //         // as = [...as,4]; => [1,2,3,4]
  //         // [a,...as] = as;
  //       }
        
        
  //       setNode(node1);
  //       setMPoint(mPoint=>({...mPoint, node: node[index]}))  
  //     }

      
  //     drawText(ctx, text.msg+e.key, node[index].location.x, node[index].location.y)
  //     setText(text=>({msg: text.msg+e.key, width: ctx.measureText(text.msg+e.key).width}));
  //   }
  // }


  //기준이 되는 도형(위치 px, py, pw, ph)과 w, h 만큼 떨어져있음
  const drawEdge = (ctx, px, py, pw, ph, w, h)=>{
    ctx.beginPath();
    ctx.strokeStyle = '#ABABAB';
    ctx.lineWidth = 2;

    //시작점 : 부모노드 꼬리
    ctx.moveTo(px+pw, py+ph/2);
    //호 그리기 변곡점x, 변곡점 y, 끝점x, 끝점 y
    ctx.quadraticCurveTo(px+pw, (py+h)+ph/2, px+pw+w, (py+h)+ph/2)
    ctx.lineTo(px+pw+w, (py+h)+ph/2)
    ctx.stroke();
  }



  const createChildNode = (ctx, w, h)=>{
    if(actNode === 0){
      return;
    }
  
    //부모노드 index 검색
    const index = node.findIndex(obj => obj.num === actNode);
    let px = node[index].location.x;
    let py = node[index].location.y;
    let pw = node[index].location.width;
    let ph = node[index].location.height;


    //도형
    let node1 = createNode(ctx, px+pw+w, py+h, node[index].num);
    //부모노드 비활성화
    changeNodeToInact(ctx, node[index]);
    //활성화된 노드 바꾸기
    changeNodeToAct(ctx, node1[node1.length-1]);
    //링크 그리기
    drawEdge(ctx, px, py, pw, ph, w, h);
    console.log(node1[node1.length-1]);
    setNode(node1);
  }


  // 바운딩 박스 업데이트 시키기 (y 축)
  const updateBbox = (nodeArr, node, exnodeNum, exnodeBbox, distanceMoved)=>{
    console.log("updateBbox")

    node.check = true;
    const foundChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check !== true));

    //자식노드 있으면 자식노드 쪽으로 가기
    if(foundChildN){

      if(typeof distanceMoved !== 'undefined'){
        foundChildN.location.y += distanceMoved;
        foundChildN.bbox.y1 +=  distanceMoved;
        foundChildN.bbox.y2 +=  distanceMoved;
      }

      const isFirstChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check === true));
      if(typeof exnodeBbox !== 'undefined'){
        // 좌우로 움직이는건 조건에 걸리면 안됨. 상하로 찾는 것만 걸려야 함. => 첫째 빼기 
        if((foundChildN.location.y < exnodeBbox.y2) && isFirstChildN){
          // foundChildN이 자식노드 갖고 있는 애면 자식노드 전체 다... 옮겨줘야 합니다 ㅜㅠㅜ
          let yDistance = exnodeBbox.y2 + 50-foundChildN.location.y
          
          foundChildN.location.y = exnodeBbox.y2 + 50;
          foundChildN.bbox.y1 = exnodeBbox.y2 + 50;
          foundChildN.bbox.y2 = exnodeBbox.y2 + 50 + foundChildN.location.height;
          return updateBbox(nodeArr, foundChildN, node.num, node.bbox, yDistance)
        }
      }
      
      if(distanceMoved){
        //야.. 본인이 움직여졌으면 움직인만큼 자슥한테 넘겨조라....
        return updateBbox(nodeArr, foundChildN, node.num,  node.bbox, distanceMoved);
      }
      else{
        //안움직였으면 말구
        return updateBbox(nodeArr, foundChildN, node.num,  node.bbox);
      } 
    }

    // 없으면 올라가기...... 올라갈 때 bbox 조정
    else{
      // 부모노드 찾기
      const foundParentsN = nodeArr.find(obj => obj.num === node.E[0]);
      if(foundParentsN){

        if((foundParentsN.bbox.x2<= node.bbox.x2) && (foundParentsN.bbox.y2 <=  node.bbox.y2)){
          foundParentsN.bbox.x2 =  node.bbox.x2;
          foundParentsN.bbox.y2 =  node.bbox.y2;
        }
        // 2) x만 부모노드 bbox보다 클 때
        else if((foundParentsN.bbox.x2<= node.bbox.x2) && (foundParentsN.bbox.y2 >=  node.bbox.y2)){
          foundParentsN.bbox.x2 =  node.bbox.x2;
        }
        // 3) y만 부모노드 bbox 보다 클 때
        else if((foundParentsN.bbox.x2>= node.bbox.x2) && (foundParentsN.bbox.y2 <=  node.bbox.y2)){
          foundParentsN.bbox.y2 =  node.bbox.y2;
        }

        foundParentsN.check = false;
        return updateBbox(nodeArr, foundParentsN, node.num, node.bbox);
      }

      // 없으면 최초노드
      else{
        let arr = nodeArr.map(obj => ({...obj , check : false}));
        return arr;
      }
    }
  }

  
  //다 지우고 처음부터 새로 그리기
  const redrawNodes = (ctx, node)=>{
    //처음부터 끝까지 다 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 노드 정보 토대로 다시 그리기 => actNode면, 다르게 그릴 것
    for(let i=0; i<node.length; i++){
      //노드 그리고
      if(node[i].num === actNode){
        let updateNode = drawRoundRect(ctx, node[i].location.x, node[i].location.y, node[i].location.width, node[i].location.height, '#FADEE1') 
        node[i].path = updateNode;
        ctx.stroke(updateNode);

        // 텍스트 출력
        if(typeof node[i].text !== 'undefined'){
          drawText(ctx, node[i].text, node[i].location.x, node[i].location.y-5);
        }
      }
      else{
        let updateNode = drawRoundRect(ctx, node[i].location.x, node[i].location.y, node[i].location.width, node[i].location.height, '#B6E3E9') 
        node[i].path = updateNode;
        ctx.stroke(updateNode);

        // 텍스트 출력
        if(typeof node[i].text !== 'undefined'){
          drawText(ctx, node[i].text, node[i].location.x, node[i].location.y-5);
        }
      }
    
    
      //이어져 있는 부모노드 확인
      const p = node.findIndex(obj => obj.num === node[i].E[0]);

      if(p !== -1 ){
        drawEdge(ctx, node[p].location.x, node[p].location.y, node[p].location.width, node[p].location.height, 100, node[i].location.y - node[p].location.y);
      }
    }

    return node;
  }


  const createSiblingNode = (ctx, w, h)=>{
    if(actNode === 1){
      return;
    }

    //actNode의 index
    const index = node.findIndex(obj => obj.num === actNode);
    //actNode의 부모 node index
    const pIndex = node.findIndex(obj => obj.num === node[index].E[0]);
    //자식노드 몇 개 딸려있는지 확인
    //const arr = node.filter(tmp => tmp.E[0] === node[pIndex].num);

    //그리고 부모의 위치를 알아내
    let px = node[pIndex].location.x;
    let sy = node[index].location.y;
    let py = node[pIndex].location.y;
    let pw = node[pIndex].location.width;
    let ph = node[pIndex].location.height;

    //그 다음 새로운 노드를 만들기
    //도형 만들고
    let node1 = createNode(ctx, px+pw+w, sy+h, node[pIndex].num);

    //위치 조정된거 있으면 지우고 다시그리기
    node1 = redrawNodes(ctx, node1);

    setNode(node1);

    //형제노드 비활성화
    changeNodeToInact(ctx, node[index]);
    //활성화된 노드 바꾸기
    changeNodeToAct(ctx, node1[node1.length-1]);
  }

  

  const handleKeyUp = (e)=>{
    e.preventDefault();
  
    if(e.key == 'Tab'){
      //자식 노드 만드는거(context, 부모노드로부터 x축으로 200만큼 떨어져있음, 부모노드로부터 y축으로 -20만큼 떨어져있음)
      createChildNode(ctx, 100, 0);
    }
    else if(e.key == 'Enter'){

      // //=====한글 문제 해결방안
      // const now = Date.now();
      // const dt = now - last;
 
      // if(100 > dt ){   
      //   e.preventDefault();
      //   e.stopPropagation();
      //   return
      // }
      // last = now;
      // //======한글 문제 해결방안

        if(actNode === 1){
          createChildNode(ctx, 100, 0);
        }
        else{
          createSiblingNode(ctx, 100, 100);
        }
    }
  }

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");

    canvas.addEventListener('dblclick',handleCanvasDblclick);
    //canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleOnClick);    
    //document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      canvas.removeEventListener('dblclick',handleCanvasDblclick);
      //canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleOnClick);    
      //document.removeEventListener('keypress', handleKeyPress);
    }
  }, [actNode, node, spanRef.current]);





  // useEffect(() => {
  //   console.log(node);
    
  //   const arr = [];
    
  //   for(let i=0; i<node.length; i++){
  //     const textInput = createInput(node[i].location.y, node[i].location.x, i);
  //     arr.push(textInput);
  //   }
  //   setInput([...arr]);
    
  // }, [node])

  const spanStyle = {
    position: "absolute",
    display: 'inline-block',
    top: 20,
    left: 600,
  }

  
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");

    // txtWidth에 현재 작성되고 있는 텍스트의 길이 (getBoundingClientRect로 얻은 width)를 업데이트 한다.
    //draw/setnode/bbox/redraw => 변경
    if(actNode){
      let nodeArr = cloneDeep(node);
      let newNode;

      const txtWidth = spanRef.current.getBoundingClientRect().width;

      const index = nodeArr.findIndex(obj => obj.num === actNode);
      // setNode(ns=>ns.map((n,i)=>i===index ? {...n, text : txt} : n))
      let actN = nodeArr[index];
      actN.text = txt;

      //txt길이가 node 넓이보다 큼
      if(txtWidth >= actN.location.width-53){
        
        //기존 도형 지우기
        ctx.clearRect(actN.location.x, actN.location.y, actN.location.width, actN.location.height);
        
        if(txtWidth<=15){
          newNode = drawRoundRect(ctx, actN.location.x, actN.location.y, 53, actN.location.height, "#FADEE1");
          ctx.stroke(newNode);
        }
        else{          
          //텍스트 길이에 맞춰 새 도형 그림
          newNode = drawRoundRect(ctx, actN.location.x, actN.location.y, txtWidth+53, actN.location.height, "#FADEE1");
          ctx.stroke(newNode);
        }
        


        //기존 도형의 정보 업데이트
        actN.location.width = txtWidth+53; 
        actN.path = newNode;
        actN.bbox.x1 = actN.location.x;
        actN.bbox.y1 = actN.location.y;
        actN.bbox.x2 = actN.location.x+txtWidth+53;
        actN.bbox.y2 = actN.location.y+actN.location.height;

        //다른 노드 위치조정
        nodeArr = updateBbox2(nodeArr, actN);
        nodeArr = redrawNodes(ctx, nodeArr);
      }

      //txt 길이가 node 넓이보다 쟈금
      if(txtWidth <= actN.location.width-53){
        
        ctx.clearRect(actN.location.x, actN.location.y, actN.location.width, actN.location.height);
        let newNode = drawRoundRect(ctx, actN.location.x, actN.location.y, txtWidth+53, actN.location.height, '#FADEE1');
        ctx.stroke(newNode);

        // 기존 도형이 저장되어 있던 node에서 기존도형을 지우고 새 도형으로 업데이트 시킨다.
        actN.location.width = txtWidth+53; 
        actN.path = newNode;
        actN.bbox.x1 = actN.location.x;
        actN.bbox.y1 = actN.location.y;
        actN.bbox.x2 = actN.location.x+txtWidth+53;
        actN.bbox.y2 = actN.location.y+actN.location.height;

        nodeArr = updateBbox2(nodeArr, actN);
        nodeArr = redrawNodes(ctx, nodeArr);
      }

      if(typeof txt !== 'undefined'){
        drawText(ctx, txt, nodeArr[index].location.x, nodeArr[index].location.y-5);
      }
      setNode(nodeArr);
      const textInput = createInput(actN.location.y, actN.location.x, txtWidth);
      setInput({box : textInput});
    }
  }, [txt])


  return(
    <div>
      <canvas ref={canvasRef} className="canvas-board" width='16000' height='10000'></canvas>
      <span style={spanStyle} ref={spanRef} className='span'>{txt}</span>
      {/* 선택된 노드가 있으면 input창 출력 */}
      {input.box}
    </div>
  )
}


const Main = ()=>{
  return(
    <div className='container'>
    <div className='menubar'> 
      <h1>마인드맵</h1>
      <div className='btn_group'>
        <button className='btn-newfile'>새 파일</button>
        <button className='btn-save'>저장하기</button>
        <button className='btn-open'>불러오기</button>
      </div>
    </div>
    <div>
      <input type="text" hidden/>
      <Canvas/>
    </div>
    </div>
  )
}

const App = ()=>{
  return(
    <RecoilRoot>
      <Main/>
    </RecoilRoot>
  )
}

let mousePointState = atom({
  key: 'mousePoint',
  default: { x: 0, y: 0, node: undefined }
})

let textState = atom({
  key: 'textState',
  default: {msg: '', width: 0}
})

let nodeState = atom({
  key: 'node',
  default: []
})

let activeNode = atom({
  key: 'activeNode',
  default: 0
})

let inputState = atom({
  key: 'inputState',
  default: {box: null}
})


ReactDOM.render(
    <App />,
  document.getElementById('root')
);

/*
  Atom : 고유한 키값과 기본값 가짐 - 키값을 사용해서 컴포넌트에서 Atom을 사용할 수 있음. 기본값 == 초기값
  const shippingState = atom({
    key: "shippingState",  ==> unique ID : 다른 atom이나 selector에서 사용되는 ID
    default: "seoul", ===> 기본값
  })
*/
/*
  useRecoilState() : 컴포넌트가 atom을 읽고 쓰게 하려면 useRecoilState(사용할 atom ID)를 사용하면 됨.
  const [shipping, setShipping] = useRecoilState(shippingState);

  배열의 첫번째 요소에 상태값이 들어가고 두번째 요소에 상태를 변경할 수 있는 함수가 들어간다는 것은 useState와 같지만, 
  차이점은 변경된 상태가 자동으로 전역으로 공유되는 것. useRecoilState를 사용한 Atom의 상태는 이 상태를 사용하고 있는
  다른 컴포넌트와 자동으로 공유 됨.
*/
/*
  useRecoilValue<T>(state: RecoilValue<T>) : 컴포넌트가 상태를 읽어오기만 한다. 상태를 변경하는 함수 없이 Atom 값만 받음
*/
/*
  Selector : Atom이나 다른 selector를 이용해서 새로운 데이터를 전달해줄 수 있음. 
  const totalState = selector({
    key: 'totalState',  ==> 고유 ID
    get: ({get}) => {     ==> 반환 값
      const shipping = get(shippingState);
      const cart = get(cartState);
      const subtotal = cart.reduce((acc, { name, price }) => acc + price, 0);
      const shippingTotal = destinations[shipping];
      return {
        subtotal,
        shipping: shippingTotalm,
        total: subtotal + shippingTotal,
      };
    },
  })
  사용할 컴포넌트에선 useRecoilValue를 이용해서 get에서 리턴되는 값을 받으면 됨. selector의 값은 읽기전용만 가능하다.
*/
