import React, {useState, useEffect} from 'react';
import { RecoilRoot, atom, selector, useRecoilState, useRecoilValue, } from 'recoil';

import ReactDOM from 'react-dom';
import cloneDeep from 'lodash/cloneDeep';
import './index.css';
import { update } from 'lodash';
// import App from './App';



let nodeNum = 0;
let last = Date.now();
let isMouseDown = false;
let returnPoint = false;
let isMouseMove = false;
let offsetX = 0;
let offsetY = 0;


const Canvas = ()=>{

  let canvasRef = React.createRef();
  let canvas2Ref = React.createRef();
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
    let rootNode = createNode(ctx, e.offsetX, e.offsetY);
    changeNodeToAct(ctx, rootNode[0]);

    setNode(rootNode);
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


  //선택된 노드랑 이어져 있는 선 하이라이팅
  const drawActNodesEdge = (nodeArr, aNode, aNodePN)=>{
    aNode.check = true;
    
    const cn = nodeArr.find(obj => (obj.E[0] === aNode.num) && (obj.check !== true));
    if(cn){
      //자식노드로 이동
      return drawActNodesEdge(nodeArr, cn, aNodePN);
    }
    else{ //부모 노드로 올라가기
      const pn = nodeArr.find(obj => (obj.num === aNode.E[0]))
      if(pn){
        drawEdge(ctx, pn.location.x, pn.location.y, pn.location.width, pn.location.height, 
          aNode.location.x-pn.location.x, aNode.location.y-pn.location.y, '#FDAFAB');
          
          if(pn.num === aNodePN){
            return;
          }
          else{
            pn.check = false;
            return drawActNodesEdge(nodeArr, pn, aNodePN);
          }
      }
    }
  }


  //노드 활성화
  const changeNodeToAct = (ctx, aNode, nodes)=>{
    console.log("chageNodeToAct", aNode.num);

    //actNode ID 설정
    setActNode(aNode.num);

    //선택된 노드에 input 삽입
    const textInput = createInput(aNode.location.y, aNode.location.x, aNode.location.width-53, aNode);
    setInput({box : textInput});
    
    ctx.clearRect(aNode.location.x, aNode.location.y, aNode.location.width, aNode.location.height);
    
    //====(임시) bbox 영역 확인용 ========
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#F781F3"
    ctx.strokeRect(aNode.bbox.x1, aNode.bbox.y1, aNode.bbox.x2-aNode.bbox.x1, aNode.bbox.y2-aNode.bbox.y1);
    //=====================================

    let path = aNode.path;
    ctx.globalCompositeOperation = 'source-over';
    // 그림자 추가
    // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
    ctx.lineWidth = aNode.location.height-1;
    //노드색상 변경
    ctx.strokeStyle = "#FADEE1"
    //그리기
    ctx.stroke(path);
    
    if(typeof aNode.text !== 'undefined'){
      drawText(ctx, aNode.text,aNode.location.x, aNode.location.y-5);
    }

    // if(node.length!==0){
    //   if(typeof nodes == 'undefined'){
    //     let nodeArr = cloneDeep(node);
    //     let index = nodeArr.findIndex(obj => (obj.num === aNode.num))
    //     drawActNodesEdge(nodeArr, nodeArr[index], aNode.E[0]);
    //   }
    //   else{
    //     let index = nodes.findIndex(obj => (obj.num === aNode.num))
    //     drawActNodesEdge(nodes, nodes[index], aNode.E[0]);
    //   }
      
    // }
    
    
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


  const handleKeyPress = (e)=>{
    if(actNode !== 0){
      //선택되어있는 노드가 있으면, 뭐가 선택되어있는 것인지 node 배열에서 해당 노드를 찾아낸다. 텍스트의 길이가 
      const index = node.findIndex(obj => obj.num === actNode);

      if(text.width >= 135){
        // 텍스트 길이가 140이 넘으면 기존 도형을 지우고
        ctx.clearRect(node[index].location.x, node[index].location.y, node[index].location.width, node[index].location.height);    

        // 새 도형을 그리기
          let loca = node[index].location;

          let newNode = drawRoundRect(ctx, loca.x, loca.y, loca.width+(ctx.measureText(text.msg+e.key).width-text.width), 70, '#FADEE1')
          // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
          ctx.stroke(newNode);
          

        // 기존 도형이 저장되어있던 node에서 기존 도형을 삭제하고 새 도형을 넣어서 업데이트.
        
        const node1 = node.slice();
        // node1[index].location.width = 100;

        if(node1.length == 1){
          node1.pop();
          node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})
        }
        else{
          node1.splice(index,1);
          node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})

          // let a;
          // let as = [1,2,3];
          // as = [...as,4]; => [1,2,3,4]
          // [a,...as] = as;
        }
        
        
        setNode(node1);
        setMPoint(mPoint=>({...mPoint, node: node[index]}))  
      }

      
      drawText(ctx, text.msg+e.key, node[index].location.x, node[index].location.y)
      setText(text=>({msg: text.msg+e.key, width: ctx.measureText(text.msg+e.key).width}));
    }
  }


  //기준이 되는 도형(위치 px, py, pw, ph)과 w, h 만큼 떨어져있음
  const drawEdge = (ctx, px, py, pw, ph, w, h, color)=>{
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    //시작점 : 부모노드 꼬리
    ctx.moveTo(px+pw, py+ph/2);
    //호 그리기 변곡점x, 변곡점 y, 끝점x, 끝점 y
    //ctx.quadraticCurveTo(px+pw, (py+h)+ph/2, px+pw+w, (py+h)+ph/2);
    ctx.quadraticCurveTo(px+pw, (py+h)+ph/2, px+pw+w, (py+h)+ph/2);
    ctx.stroke();
  }


// 부모노드에서 자식노드 만들었을 때 생기는 이상한 오류 고치기 - 첫째 빼고는 다 이상하네욤
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
    changeNodeToAct(ctx, node1[node1.length-1], node1);
    //링크 그리기
    drawEdge(ctx, px, py, pw, ph, w, h, '#ABABAB');
    console.log(node1[node1.length-1]);
    setNode(node1);
  }


  // 바운딩 박스 업데이트 시키기 (y 축)

  const updateBbox = (nodeArr, node, exnodeBbox, distanceMoved)=>{
    console.log(node.num)

    node.check = true;
    let nodeEndX = node.location.x + node.location.width;
    
    //증말 짜증나 ㅡㅡ 
    const foundChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check !== true));


    //자식노드 있으면 자식노드 쪽으로 이동
    if(foundChildN){

      if(typeof distanceMoved !== 'undefined'){
        foundChildN.location.y += distanceMoved;
        foundChildN.bbox.y1 +=  distanceMoved;
        foundChildN.bbox.y2 +=  distanceMoved;
      }

      // x축 업데이트
      foundChildN.location.x = nodeEndX + 100;  // 자식 노드의 location을 현재 노드의 node의 x축 끝지점 보다 100만큼 더 떨어져있게 설정한다.
      foundChildN.bbox.x1 = nodeEndX + 100;     // 자식노드 bbox 중 x1 업데이트
      foundChildN.bbox.x2 = nodeEndX + 100 + foundChildN.location.width; // 자식노드 bbox 중 x2 업데이트

      const isFirstChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check === true));
      // 좌우로 움직이는건 조건에 걸리면 안됨. 상하로 찾는 것만 걸려야 함.
      if(isFirstChildN){
        if(typeof exnodeBbox !== 'undefined'){
          let yDistance = exnodeBbox.y2 + 50-foundChildN.location.y
        
          foundChildN.location.y = exnodeBbox.y2 + 50;
          foundChildN.bbox.y1 = exnodeBbox.y2 + 50;
          foundChildN.bbox.y2 = exnodeBbox.y2 + 50 + foundChildN.location.height;
          return updateBbox(nodeArr, foundChildN, node.bbox, yDistance);
        }
      }
      else{
        foundChildN.location.y = node.location.y; //자식노드 y 위치 옮기기
        foundChildN.bbox.y1 = node.location.y; //자식노드 bbox 중 y1 업데이트
        foundChildN.bbox.y2 = node.location.y + foundChildN.location.height; // 자식노드 bbox 중 y2 업데이트
      }
      
      if(distanceMoved){
        return updateBbox(nodeArr, foundChildN, node.bbox, distanceMoved);
      }
      else{
        return updateBbox(nodeArr, foundChildN, node.bbox);
      } 
    }

    // 없으면 올라가기...... 올라갈 때 bbox 조정
    else{
      // 부모노드 찾기
      const foundParentsN = nodeArr.find(obj => obj.num === node.E[0]);
      if(foundParentsN&& foundParentsN.E[0]!== 0){  //  << 자유이동 시 사용하는 코드
        

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
        return updateBbox(nodeArr, foundParentsN, node.bbox);
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
        drawEdge(ctx, node[p].location.x, node[p].location.y, node[p].location.width, node[p].location.height, node[i].location.x - node[p].location.x -node[i].location.width, node[i].location.y - node[p].location.y, '#ABABAB');
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
    changeNodeToAct(ctx, node1[node1.length-1], node1);
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

  // 바운딩 박스 업데이트 시키기 (x 축) => nodeArr : 변경시킬 노드들, node : 현재 걸려있는 노드, exnodeEX : 이전 노드의 X좌표 끝 지점.
  const updateBbox3 = (nodeArr, node, exnodeBbox, distanceMoved)=>{
    console.log(node.num);

    // 한 번 체킹된 노드 다시 체크하지 않도록 true로 변경
    node.check = true;
    // 현재 노드의 x축 끝
    let nodeEndX = node.location.x + node.location.width;
    
    //자식 노드 검색
    const foundChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check !== true));

    if(foundChildN){     // 자식 노드가 있다면,  - 자식노드의 위치와 bbox를 조정한다.(bbox는 일단 자식 노드 위치에 따라 단수로 조정하고 복수노드 bbox 조정은 부모노드로 올라갈 때 하는 것으로)

      if(typeof distanceMoved !== 'undefined'){   // 앞선 노드가 y축으로 움직인 거리 有
        foundChildN.location.y += distanceMoved; // 다음 자식노드의 위치도 y축으로 그만큼 움직여줘야함
        foundChildN.bbox.y1 += distanceMoved;
        foundChildN.bbox.y2 += distanceMoved;
      }
      
      // x축 업데이트
      foundChildN.location.x = nodeEndX + 100;  // 자식 노드의 location을 현재 노드의 node의 x축 끝지점 보다 100만큼 더 떨어져있게 설정한다.
      foundChildN.bbox.x1 = nodeEndX + 100;     // 자식노드 bbox 중 x1 업데이트
      foundChildN.bbox.x2 = nodeEndX + 100 + foundChildN.location.width; // 자식노드 bbox 중 x2 업데이트


      // y축 업데이트
      const firstBornN = nodeArr.find(obj => (obj.E[0] === node.num)&&(obj.check === true));  // 자식노드 여러개인지 확인용 - 여러 개면 둘째부터는 y축 조절해야하기 때문
      if(typeof exnodeBbox !== 'undefined'){  // 이전 노드의 bbox가 들어오면

        if(firstBornN){   // 첫째가 존재하면,
          let yDistance = exnodeBbox.y2 + 50-foundChildN.location.y;      // 자식노드가 y축으로 움직인 거리 - 자식노드의 자식노드도 움직여줘야하기 때문에 움직인 거리 물려주기
          foundChildN.location.y = exnodeBbox.y2 + 50;   //자식노드 y 위치 옮기기
          foundChildN.bbox.y1 = exnodeBbox.y2 + 50;      //자식노드 bbox 중 y1 업데이트
          foundChildN.bbox.y2 = exnodeBbox.y2 + 50 + foundChildN.location.height; // 자식노드 bbox 중 y2 업데이트

          return updateBbox3(nodeArr, foundChildN, node.bbox, yDistance);
        }
        else{      // 이미 check된 자식노드가 없다면, 퍼스트본 ==> 현재 노드랑 나란히 있게 만들면 됨
          foundChildN.location.y = node.location.y; //자식노드 y 위치 옮기기
          foundChildN.bbox.y1 = node.location.y; //자식노드 bbox 중 y1 업데이트
          foundChildN.bbox.y2 = node.location.y + foundChildN.location.height; // 자식노드 bbox 중 y2 업데이트
        }
      }

      if(distanceMoved){   // 자식에서 다시 부모로 올라간 뒤 다른 자식으로 내려갈 때, 자식으로부터 받아온 distanceMoved (y축으로 움직인 거리) 가 있으면, 다른 자식한테 넘겨주기
        return updateBbox3(nodeArr, foundChildN, node.bbox, distanceMoved);
      }
      else{
        return updateBbox3(nodeArr, foundChildN, node.bbox)   //자식노드로 이동
      } 
    }

    else{    // 단말 - 자식노드 없음
    
      const foundParentsN = nodeArr.find(obj => (obj.num === node.E[0]));      //부모노드 찾기

      if(foundParentsN){      // 부모 노드로 올라가기 - 복수노드로 이루어진 bbox 업데이트

        // 1) 부모노드의 bbox 범위가 늘어나야 할 때 
        if((foundParentsN.bbox.x2<= node.bbox.x2) && (foundParentsN.bbox.y2 <=  node.bbox.y2)){        // 현재노드의 x2, y2 둘 다 부모노드 bbox 보다 큼 
          foundParentsN.bbox.x2 =  node.bbox.x2;
          foundParentsN.bbox.y2 =  node.bbox.y2;
        }
        else if((foundParentsN.bbox.x2<= node.bbox.x2) && (foundParentsN.bbox.y2 >=  node.bbox.y2)){   // x만 부모노드 bbox보다 큼
          foundParentsN.bbox.x2 =  node.bbox.x2;
        }
        else if((foundParentsN.bbox.x2>= node.bbox.x2) && (foundParentsN.bbox.y2 <=  node.bbox.y2)){   // y만 부모노드 bbox 보다 큼
          foundParentsN.bbox.y2 =  node.bbox.y2;
        }

        // 2) 부모노드의 bbox 범위가 줄어들어야 할 때
      
        //올라가기
        foundParentsN.check = false;
        return updateBbox3(nodeArr, foundParentsN);
      }
      else{ // 부모노드가 없으면 루트
        let arr = nodeArr.map(obj => ({...obj , check : false}));
        return arr;
      }
    }
  }


  // //노드 떼어서 갖다 붙이기
  // useEffect(() => {
  //   canvas = canvasRef.current;
  //   ctx = canvas.getContext("2d");

  //   let n;
  //   let mn;

  //   const onMouseDown = (e)=>{
  //     offsetX = e.offsetX;
  //     offsetY = e.offsetY;
  //     n = searchNodeLoca(e.offsetX, e.offsetY);
  //     // 만약에 노드 위면, isMouseDown을 true로 바꾸고, 이벤트 발생
  //     if(n){
  //       isMouseDown = true;
  //     }
  //     // 아니면, 노드 비활성화시키기
  //     else{
  //       if(actNode == 0){
  //         return;
  //       }
  //       const index = node.findIndex(obj => obj.num === actNode);
  //       changeNodeToInact(ctx, node[index]);
  //     }
  //   }

  //   const onMouseMove = (e)=>{
  //     // actNode 위로 마우스 올리면 커서 모양 변화
      
  //     //actNode 드래그 할 때 
  //     if(isMouseDown){
  //       //움직이는 흔적 그리기 : canvas2 지웠다가 다시 그리기 (반투명하게)
  //       if(!((offsetX-10<=e.offsetX && e.offsetX<=offsetX+10) && (offsetY-10<=e.offsetY && e.offsetY<=offsetY+10))){
  //         isMouseMove = true;
  //       }
        
  //       mn = searchNodeLoca(e.offsetX, e.offsetY);
  //       //만약 마우스의 x, y좌표가 선택된 노드의 bbox 안이라면 return;
  //       if((e.offsetX>n.bbox.x1 && e.offsetX<n.bbox.x2)&&(e.offsetY>n.bbox.y1 && e.offsetY<n.bbox.y2)){
  //         returnPoint = true;
  //       }
  //       else{
  //         returnPoint = false;
  //         if(mn){
  //           //console.log("mn: ", mn); 
  //           // 이동노드를 클릭&드래그 한 상태에서 마우스 위치가 병합 당할 노드 안으로 들어가면 해당 노드 actNode화 (붉게 변화)
  //         }
  //         else{
  //           // actNode 된 노드 원복
  //         }
  //       }
  //     }
  //   }

  //   const changeArrayOrder = function(list, targetIdx, moveValue) {
  //     if (list.length < 0) return;

  //     // 이동할 index 값을 변수에 선언
  //     const newPosition = targetIdx + moveValue;
  //     // 이동할 값이 0보다 작거나 최대값을 벗어나는 경우 종료
  //     if (newPosition < 0 || newPosition >= list.length) return;
  //     // 임의의 변수를 하나 만들고 배열 값 저장
  //     const tempList = JSON.parse(JSON.stringify(list));
  //     // 옮길 대상을 target 변수에 저장하기
  //     const target = tempList.splice(targetIdx, 1)[0];
  //     // 새로운 위치에 옮길 대상을 추가하기
  //     tempList.splice(newPosition, 0, target);
  //     return tempList;
  //   };

  //   const onMouseUp = (e)=>{
  //     if(isMouseMove){
  //       console.log("isMouseMove", isMouseMove);
  //       e.preventDefault();
  //       e.stopPropagation();
  //     }

  //     isMouseDown = false;
  //     if(returnPoint){
  //       return;
  //     }
      
  //     console.log("onMouseUp/ 움직여진 node : ", n)
  //     console.log("onMouseUp/ 병합될 node : ", mn);
  //     let nodeArr = cloneDeep(node);
      
  //     //마우스 업을 한 위치가 어떠한 노드의 박스영역 안이면
  //     if(typeof mn !== 'undefined' && typeof n !== 'undefined'){
  //       // 움직인 node와 딸려있는 식구들 전부 위에서 찾은 노드의 자식 노드로 합류
  //       console.log("노드 박스 안에서 mouseUp")
          
  //       let index = nodeArr.findIndex(obj => obj.num === n.num);  
  //       nodeArr = changeArrayOrder(nodeArr, index, nodeArr.length-1-index);
  //       n = nodeArr[nodeArr.length-1]
  //       n.E[0] = mn.num;

  //       //다른 노드 위치 조정
  //       nodeArr = updateBbox(nodeArr, nodeArr[0]);
  //       nodeArr = redrawNodes(ctx, nodeArr);
  //       setNode(nodeArr);
  //     }
  //     // 아니면 그냥 이동
  //     else if((typeof mn === 'undefined' && typeof n!== 'undefined' )&&(!(n.location.x<=e.offsetX && e.offsetX<=n.location.x+n.location.txtWidth) && (n.location.y <=e.offsetY&& e.offsetY<=n.location.y+n.location.height))){
  //       console.log("이동할 지점", e.offsetX, e.offsetY, n.num);
  //       let index = nodeArr.findIndex(obj => obj.num === n.num);
        
    
  //       if(n.num === 1 || n.E[0] === 1){  // 이동되는 n이 루트일 때 => 전체 다시 그리기 (노드간 벌어진 간격 유지)
  //         n = nodeArr[index];
  //         // 움직인 노드 location x, y 값 수정
  //         n.location.x = e.offsetX;
  //         n.location.y = e.offsetY;
  //         n.bbox.x1 = e.offsetX;
  //         n.bbox.y1 = e.offsetY;
  //       }
  //       else{        // 이동되는 n이 깊이 2이상인 노드일 때 => 깊이 1로 분리
  //         n = nodeArr[index]
  //         n.E[0] = 1;
  //       }
  //       // bbox 수정 - updateBbox : 움직인 노드부터 돌기
  //       nodeArr = updateBbox(nodeArr, nodeArr[index]);
  //       nodeArr = redrawNodes(ctx, nodeArr);
        
  //       setNode(nodeArr);
  //     }
  //   }

         
  //   canvas.addEventListener("mousedown", onMouseDown);
  //   canvas.addEventListener("mousemove", onMouseMove);
  //   canvas.addEventListener("mouseup", onMouseUp);

  //   return () => {
  //     canvas.removeEventListener("mousedown", onMouseDown);
  //     canvas.removeEventListener("mousemove", onMouseMove);
  //     canvas.removeEventListener("mouseup", onMouseUp);
  //   }
  // }, [node])

  const changeArrayOrder = function(list, targetIdx, moveValue) {
    if (list.length < 0) return;

    // 이동할 index 값을 변수에 선언
    const newPosition = targetIdx + moveValue;
    // 이동할 값이 0보다 작거나 최대값을 벗어나는 경우 종료
    if (newPosition < 0 || newPosition >= list.length) return;
    // 임의의 변수를 하나 만들고 배열 값 저장
    const tempList = JSON.parse(JSON.stringify(list));
    // 옮길 대상을 target 변수에 저장하기
    const target = tempList.splice(targetIdx, 1)[0];
    // 새로운 위치에 옮길 대상을 추가하기
    tempList.splice(newPosition, 0, target);
    return tempList;
  };

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");
    
    let n;
    let mn;

    const onMouseDown = (e)=>{
      //mousemove 됐는지 확인하는 용도
      offsetX = e.offsetX;
      offsetY = e.offsetY;

      n = searchNodeLoca(e.offsetX, e.offsetY);    //마우스 좌표 아래에 노드 있는지 확인하는 용도. x, y 좌표 아래 있으면 n은 not undefined
      if(n){  //n이 있으면 isMouseDown 을 true로 바꾸고 mousemove 할 수 있도록 준비
        isMouseDown = true;
      }
    }

    const onMouseMove = (e)=>{
      if(isMouseDown){ //isMouseDown이 true이면,
        if(!((offsetX-5<=e.offsetX && e.offsetX<=offsetX+5) && (offsetY-5<=e.offsetY && e.offsetY<=offsetY+5))){  
          //mousedown 한 위치랑, move된 위치가 서로 비슷하지 않다면, 움직였다고 봐야함 (onclick이벤트랑 혼동되지 않기 위해 넣은 장치)
          isMouseMove = true;
        }

        mn = searchNodeLoca(e.offsetX, e.offsetY);  //움직이고 있는 마우스 좌표 상에 텍스트 박스가 있으면 mn은 not undefined
        if((e.offsetX>n.bbox.x1 && e.offsetX<n.bbox.x2)&&(e.offsetY>n.bbox.y1 && e.offsetY<n.bbox.y2)){    //만약 마우스의 x, y좌표가 선택된 노드의 bbox안이면 무효
          returnPoint = true;
          mn = null;
        }
        else{
          returnPoint = false;
         
        }
      }//if isMouseDown
    }

    const onMouseUp = (e)=>{
      // console.log("isMouseMove", isMouseMove)
      // console.log("onMouseUp/ 움직여진 node : ", n)
      // console.log("onMouseUp/ 병합될 node : ", mn);
      isMouseDown = false;
      if(isMouseMove){ //마우스가 움직였다면, mouseup 이후의 전파를 막는다.
        isMouseMove = false;
        e.preventDefault();
        e.stopPropagation();
      
        if(returnPoint){ //움직여진 노드 bbox 안에서 마우스 떼도 아무일도 안일어나게 설정
          return;
        }
  
        let nodeArr = cloneDeep(node);
        if(typeof mn !== 'undefined' && typeof n !== 'undefined'){   //마우스 업을 한 위치가 어떤 노드 박스영역 안이면 => 움직인 노드와 딸린 식구까지 전부 mn의 자식노드로 합류
          
          let index = nodeArr.findIndex(obj => obj.num === n.num);  //움직인 노드의 index 찾기
          nodeArr = changeArrayOrder(nodeArr, index, nodeArr.length-1-index);  // 움직인 노드 index 맨 끝으로 이동시키기
          n = nodeArr[nodeArr.length-1]; // node object
          n.E[0] = mn.num;    // n의 edge 정보 업데이트 ==> mn의 자식노드로 들어가도록
          nodeArr = updateBbox(nodeArr, nodeArr[0]) // 다른 노드 위치 조정
          nodeArr = redrawNodes(ctx, nodeArr);  //다시 그리기
          setNode(nodeArr); //node 정보 업데이트&저장
        }
        
        else if(typeof mn === 'undefined' && typeof n !== 'undefined'){
          console.log("이동할 지점", e.offsetX, e.offsetY, n.num);
          //================== 이 시점부터 문제 ==================
          // 문제 : 움직이고 난 뒤 - 위치는 제대로 조정되는데, bbox 이상해지고, 옮겨진 위치 상에서 노드 클릭해서 활성화 시키면, 클릭이 안 됨
              // ※ 움직일 때 root node는 bbox 상관없이 이동할 수 있도록 변경
          
          let index = nodeArr.findIndex(obj => obj.num === n.num);
          if(n.num === 1 || n.E[0] === 1){  // 이동되는 n이 루트일 때 => 전체 다시 그리기 (노드간 벌어진 간격 유지)
            n = nodeArr[index];
            // 움직인 노드 location x, y 값 수정
            n.location.x = e.offsetX;
            n.location.y = e.offsetY;
            n.bbox.x1 = e.offsetX;
            n.bbox.y1 = e.offsetY;
          }
          else{        // 이동되는 n이 깊이 2이상인 노드일 때 => 깊이 1로 분리
            n = nodeArr[index]
            n.E[0] = 1;
          }
          // bbox 수정 - updateBbox : 움직인 노드부터 돌기
          nodeArr = updateBbox(nodeArr, nodeArr[index]);
          nodeArr = redrawNodes(ctx, nodeArr);
          
          setNode(nodeArr);
          //================== 여기까지 ==================
      }
        

      }
      

    }


    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    }
  }, [node])

  

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");

    canvas.addEventListener('dblclick',handleCanvasDblclick);
    //canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleOnClick);    
    
    return () => {
      canvas.removeEventListener('dblclick',handleCanvasDblclick);
      //canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleOnClick);    
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
    <div className='canvas-container'>
      <div className='canvas-div'>
        <canvas ref={canvasRef} className="canvas-board" width='16000' height='10000'></canvas>
      </div>
      <div className='canvas-div2'>
        <canvas ref={canvas2Ref} className="canvas-board2" width='16000' height='10000'></canvas>
      </div>
      <span style={spanStyle} ref={spanRef} className='span'>{txt}</span>
      {/* 선택된 노드가 있으면 input창 출력 */}
      {input.box}
    </div>
  )
}


const SideBar = ()=>{
  return(
    <div>
      <div className='panel'>
        <div className='sub'></div>
        
        <div className='color-palette'>
          <span>색상변경</span>&nbsp;&nbsp;
          <hr />
          <div className='color-palette-selectbnt'>
            <button>키워드 박스 배경</button>
            <button>연결선</button>
            <button>텍스트</button>
          </div>
          <div>
            <button style={{backgroundColor: '#FF6C6C'}}></button>
            <button style={{backgroundColor: '#FFBB00'}}></button>
            <button style={{backgroundColor: '#FFDF24'}}></button>
            <button style={{backgroundColor: '#FFFF7E'}}></button>
            <button style={{backgroundColor: '#FFFFC6'}}></button><br />
            <button style={{backgroundColor: '#ED006D'}}></button>
            <button style={{backgroundColor: '#FF7EC8'}}></button>
            <button style={{backgroundColor: '#CB6CFF'}}></button>
            <button style={{backgroundColor: '#6D6CFF'}}></button>
            <button style={{backgroundColor: '#00C6ED'}}></button><br />
            <button style={{backgroundColor: '#670000'}}></button>
            <button style={{backgroundColor: '#997000'}}></button>
            <button style={{backgroundColor: '#CCA63D'}}></button>
            <button style={{backgroundColor: '#47C83E'}}></button>
            <button style={{backgroundColor: '#9FC93C'}}></button>
          </div>
        </div>
        
        <div className= 'edge-width'>
          <span>연결선 굵기</span>&nbsp;&nbsp;
          <hr />
          <div className='edge-width-selectbnt'>
            <span>1</span>&nbsp;&nbsp;&nbsp;&nbsp;<button><hr style={{height: '1px'}} /></button><br />
            <span>2</span>&nbsp;&nbsp;&nbsp;&nbsp;<button><hr style={{height: '3px'}}/></button><br />
            <span>3</span>&nbsp;&nbsp;&nbsp;&nbsp;<button><hr style={{height: '5px'}}/></button><br />
            <span>4</span>&nbsp;&nbsp;&nbsp;&nbsp;<button><hr style={{height: '7px'}}/></button><br />
            <span>5</span>&nbsp;&nbsp;&nbsp;&nbsp;<button><hr style={{height: '9px'}}/></button>
          </div>
        </div>
        <div className= 'text-size'>
          <span>텍스트 변경</span>&nbsp;&nbsp;
          <hr />
          <div>
            <div>
              <span>텍스트 크기</span><br />
              <button>S</button>
              <button>M</button>
              <button>L</button>
            </div>
            <div>
              <span>굵게</span><br />
              <button>B</button>
            </div>
          </div>
        </div>
      </div>
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
      <Canvas/>
      <SideBar/>
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
