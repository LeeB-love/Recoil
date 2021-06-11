// //노드 새로 생설될 때, 부모노드의 형제들 위치조정
  // const relocateSiblingNodes = (node1, pIndex)=>{
  //   console.log("relocateSiblingNodes");

  //   if(node1[pIndex].num === 0){
  //     return node1;
  //   }
    
  //   let cnt = 1;
    
    
  //   for(let i=0; i<node1.length; i++){
  //     //위치 조정이 필요한 형제 노드들 골라내기
  //     if((node1[i].E[0] === node1[pIndex].E[0]) && (node1[i].E[1] > node1[pIndex].E[1])){
        
  //       // 위치 조정이 필요한 형제노드의 y값 조정
  //       node1[i].location.y = node1[pIndex].bbox.y2 + 100*cnt;
        
  //       // 위치가 조정된 형제노드의 바운딩 박스 조정
  //       let bboxHeight = node1[i].bbox.y2-node1[i].bbox.y1;
  //       node1[i].bbox.y1 = node1[pIndex].bbox.y2 + 100*cnt;
  //       //=======================bbox y2 좌표 고치기 지금 뭔가 이상함
  //       node1[i].bbox.y2 = node1[pIndex].bbox.y2 + 100*cnt+bboxHeight;
        
        
  //       cnt++;
  //       console.log("cnt", cnt);
  //     }
  //   }
    
  //   //부모노드의 부모노드의 bbox만큼 clearRect
  //   const gPIndex = node1.findIndex(obj => obj.num === node1[pIndex].E[0]);

    
  //   if(gPIndex >0){
  //     return relocateSiblingNodes(node1, gPIndex)
  //   }
  //   else{
  //     return node1;
  //   }    
  // }




  const updateBbox2 = (nodeArr, node, exnodeNum, exnodeBbox, distanceMoved)=>{

    node.check = true;
    const foundChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check !== true));

    //자식노드 있으면 자식노드 쪽으로 가기
    if(foundChildN){

      //움직인 거리가 있으면, 자식 노드의 위치, bbox 업데이트
      if(typeof distanceMoved !== 'undefined'){
        foundChildN.location.y += distanceMoved;
        foundChildN.bbox.y1 +=  distanceMoved;
        foundChildN.bbox.y2 +=  distanceMoved;
      }

      const isFirstChildN = nodeArr.find(obj => (obj.E[0] === node.num) && (obj.check === true));

    // exnodeBbox를 받아서, 
      if(typeof exnodeBbox !== 'undefined'){
        // 좌우로 움직이는건 조건에 걸리면 안됨. 상하로 찾는 것만 걸려야 함. => 첫째 빼기 
        if((foundChildN.location.y < exnodeBbox.y2) && isFirstChildN){

          // foundChildN이 자식노드 갖고 있는 애면 자식노드 전체 다... 옮겨줘야합니다 ㅜㅠㅜ
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

// - 선택되어있는 노드와 그 노드의 자식 노드들을 순차적으로 탐색하며 bbox와 location 설정
// - 이전 노드의 bbox를 넘겨야하나? bbox가 아니라 location의 width를 넘겨서 거기다가 더해주기


// 1. 어차피 움직여야할 x축 거리는 모든 자식 노드들이 다 똑같음
// 2. 자식이 없