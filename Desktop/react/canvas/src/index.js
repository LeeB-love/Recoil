import React, { useEffect, useState } from 'react';
import canvasToImage from 'canvas-to-image';
import ReactDOM from 'react-dom';
import { Brush, Slash, EraserFill, Circle, Square, Heptagon, BoundingBoxCircles, Clipboard, Scissors, Bezier, ArrowRepeat, ArrowsAngleExpand, ArrowsAngleContract} from 'react-bootstrap-icons';
import './index.css';

const Menu = (props) => {

  const onchangeStrokeColor = (e) => {
    props.setStrokeColor(e.target.value);
  }

  const onchangeLineWidth = (e) => {
    props.setStrokeLineWidth(e.target.value);
  }

  const onClickLine = () => {
    props.setBtnState(btnState => ({ ...btnState, line: 1 }))
  }

  const onClickCurve = () => {
    props.setBtnState(btnState => ({ ...btnState, curve: 1 }))
  }

  const onClickEllipse = () => {
    props.setBtnState(btnState => ({ ...btnState, ellipse: 1 }))
  }

  const onClickRect = () => {
    props.setBtnState(btnState => ({ ...btnState, rect: 1 }))
  }

  const onClickPolygon = () => {
    props.setBtnState(btnState => ({ ...btnState, polygon: 1 }));
  }

  const onClickEraser = () => {
    props.setBtnState(btnState => ({ ...btnState, eraser: 1 }))
  }

  const onchangePaintColor = (e) => {
    props.setFillColor(e.target.value);
    props.setBtnState(btnState => ({ ...btnState, paint: 1 }));
  }

  const onClickSelect = () => {
    props.setCcp(ccp => ({ ...ccp, copy: 1 }));
  }

  const onClickPaste = () => {
    props.setCcp(ccp => ({ ...ccp, paste: 1 }));
  }

  const onClickCut = () => {
    props.setCcp(ccp => ({ ...ccp, cut: 1 }));
  }

  const onClickBrush = () => {
    props.setBtnState(btnState => ({ ...btnState, brush: 1 }));
  }

  const onClickRotateL = () => {
    props.setTrans(trans => ({ rotateL: 1 }));
  }

  const onClickNewFile = () => {
    props.setF(f => ({ ...f, newFile: 1 }))
  }

  const onClickSaveFile = () => {
    props.setF(f => ({ ...f, saveFile: 1 }))
  }

  const onClickOpenFile = () => {
    props.setF(f=>({...f, openFile: 1}))
  }

  const onClickUndo = () => {
    props.setUndo(1)
  }

  const onClickRedo = ()=>{
    props.setRedo(1);
  }


  return (
    <div className='menubar'>
      <button onClick={onClickNewFile} title="새로운 캔버스">new file</button>
      <button onClick={onClickSaveFile} title="저장">save</button>
      <button onClick={onClickOpenFile} title="불러오기">open</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

      <button onClick={onClickUndo} title="실행취소">undo</button>
      <button onClick={onClickRedo} title="재실행">redo</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

      <span>line color</span>&nbsp;
      <input type="color" onChange={onchangeStrokeColor} />&nbsp;&nbsp;&nbsp;
      <span>line width</span>&nbsp;
      <select onChange={onchangeLineWidth}>
        {/* <option value="0">없음</option> */}
        <option value="1" selected>1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="15">15</option>
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="50">50</option>
      </select>&nbsp;&nbsp;&nbsp;
      <span>paint color</span>&nbsp;
      <input type="color" onChange={onchangePaintColor} />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <button onClick={onClickBrush} title="브러쉬"><Brush/></button>
      <button onClick={onClickLine} title="선분"><Slash/></button>
      <button onClick={onClickCurve} title="베지어 곡선"><Bezier/></button>
      <button onClick={onClickEraser} title="지우개"><EraserFill/></button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <button onClick={onClickEllipse} title="타원 (shift를 누르고 그리면 원형이 그려집니다.)"><Circle/></button>
      <button onClick={onClickRect} title="직사각형 (shift를 누르고 그리면 정사각형이 그려집니다.)"><Square/></button>
      <button onClick={onClickPolygon} title="다각형 (shift를 누르고 클릭 시 도형이 완성됩니다.)"><Heptagon/></button>&nbsp;&nbsp;&nbsp;
      <button onClick={onClickSelect} title="영역 선택"><BoundingBoxCircles/></button>
      <button onClick={onClickPaste} title="붙여넣기"><Clipboard/></button>
      <button onClick={onClickCut} title="잘라내기"><Scissors/></button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <span>rotate</span>&nbsp;
      <button onClick={onClickRotateL} title="회전"><ArrowRepeat/></button>
    </div>
  )
}

let imageData;
let rotatedImg;
let boxAngle = 0;
let isMouseDown = false;

const createPoint = (context2, startPointX, startPointY, endPointX, endPointY) => {
  context2.fillRect(startPointX + ((endPointX - startPointX) / 2), startPointY - 3, 8, 8);
  context2.fillRect(startPointX + ((endPointX - startPointX) / 2), endPointY - 3, 8, 8);
  context2.fillRect(startPointX - 3, startPointY + ((endPointY - startPointY) / 2), 8, 8);
  context2.fillRect(endPointX - 3, startPointY + ((endPointY - startPointY) / 2), 8, 8);
  context2.fillRect(startPointX - 3, startPointY - 3, 8, 8);
  context2.fillRect(endPointX - 3, endPointY - 3, 8, 8);
  context2.fillRect(startPointX + (endPointX - startPointX) - 3, startPointY - 3, 8, 8);
  context2.fillRect(startPointX - 3, startPointY + (endPointY - startPointY) - 3, 8, 8);
}

//mouseup 되어서 도형 하나 그려질 때 마다 canvas를 스크린샷 찍어서 배열에 저장. 
const getCanvasScreenshot = (canvas, cvsArr, setCvsArr, udCount, setUdCount)=>{
  let cvsArr2 = cvsArr;

  //일정 길이 이상 쌓이면 앞의 것 잘라내기
  if(cvsArr2.length >= 15){
    cvsArr2.splice(0,8);
  }

  //실행 취소를 한 상태에서 도형이 그려지면, 실행취소 한 캔버스는 날리기
  if(udCount !== 0){
    cvsArr2.splice(cvsArr2.length-udCount);
    setUdCount(0);
  }

  let image = new Image();
  image.src = canvas.toDataURL();
  cvsArr2.push(image);
  console.log(cvsArr2)
  setCvsArr(cvsArr2);
}



const Canvas = (props) => {

  let canvas;
  let context;

  let canvas2;
  let context2;

  let canvas3;
  let context3;

  let canvasRef = React.createRef();
  let canvas2Ref = React.createRef();
  let canvas3Ref = React.createRef();
  let fileInputRef = React.createRef();

  const [isShiftPress, setIsShiftPress] = useState(0);
  const [count, setCount] = useState(0);
  const [selectPoint, setSelectPoint] = useState();
  const [esc, setEsc] = useState(0);
  const [pos, setPos] = useState("none");
  const [isClickPoint, setIsClickPoint] = useState(false);
  const [cvsArr, setCvsArr] = useState([]);
  const [udCount, setUdCount] = useState(0); 
  const [isKeyPressed, setIsKeyPressed] = useState({ctrl: 0});


  const onKeyDown = React.useCallback((e) => {
    console.log(e);
    if (e.code === "ShiftLeft") {
      setIsShiftPress(1);
    }
    else if(e.code === "ControlLeft"){
      setIsKeyPressed({ctrl: 1})
    }
  }, []);

  const onKeyUp = React.useCallback((e) => {
    if (e.code === "ShiftLeft") {
      setIsShiftPress(0);
    }
    else if(e.code === "ControlLeft"){
      setIsKeyPressed({ctrl: 0})
    }
    else if(e.code === "Escape") {
      e.preventDefault();
      props.setBtnState({ line: 0, curve: 0, ellipse: 0, rect: 0, polygon: 0, eraser: 0, paint: 0, brush: 0 })
      props.setCcp({ copy: 0, paste: 0, cut: 0 })
      props.setTrans({ rotateL: 0})
      setEsc(1);
    }
  }, [])


  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
   
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    }
  }, []);


  //실행 취소
  useEffect(() => {
    if(props.undo === 1 || (isKeyPressed.ctrl===1 && isKeyPressed.z === 1)){
      if(udCount === 5){
        props.setUndo(0);
        return;
      }

      canvas = canvasRef.current;
      context = canvas.getContext("2d");
      let count = udCount;

      count++;

      if(cvsArr.length-(count)<0){
        props.setUndo(0);
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      if(cvsArr.length-(1+count)>=0){
        context.drawImage(cvsArr[cvsArr.length-(1+count)], 0,0,canvas.width,canvas.height);
      }
      setUdCount(count);
      props.setUndo(0);
    }
  }, [props.undo])


  //재실행
  useEffect(() => {
    if(props.redo === 1){
      if(udCount === 0){
        props.setRedo(0);
        return;
      }
      canvas = canvasRef.current;
      context = canvas.getContext("2d");
     
      let count = udCount;
      count--;

      console.log("udCount : ",count)
      console.log("cvsArr : ", cvsArr);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(cvsArr[(cvsArr.length-1)-count], 0,0,canvas.width,canvas.height);
      setUdCount(count);
      props.setRedo(0);
    }
  }, [props.redo])


  //새 파일
  useEffect(() => {
    if (props.f.newFile !== 1) {
      return;
    }
    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    props.setStrokeColor("#000000")
    props.setStrokeLineWidth(1);
    props.setBtnState({ line: 0, curve: 0, ellipse: 0, rect: 0, polygon: 0, eraser: 0, paint: 0, select: 0, brush: 0 })
    props.setFillColor('#000000')
    props.setTrans({ rotateL: 0})
    props.setCcp({ copy: 0, paste: 0, cut: 0 })
    setSelectPoint();
    props.setF(f => ({ ...f, newFile: 0 }))
  }, [props.f.newFile])

  //저장
  useEffect(() => {
    if (props.f.saveFile !== 1) {
      return;
    }

    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    canvasToImage(canvas, {
      name: 'image',
      type: 'png',
      quality: 1
    });

    props.setF(f => ({ ...f, saveFile: 0 }))
  }, [props.f.saveFile])


  //브러쉬
  useEffect(() => {
    if (props.btnState.brush !== 1) {
      return;
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    //canvas 요소에 접근해서 참조값 가져오기
    canvas = canvasRef.current;
    //getContext()로 캔버스의 2d context 얻어오기
    context = canvas.getContext("2d");

    const onMousedown = (e) => {
      //눌려져있다고 표시
      isMouseDown = true;

      //마우스 위치 (offset 값으로 canvas 상의 x좌표 y좌표 가져오기)
      let x = e.offsetX;
      let y = e.offsetY;

      //beginPath() : 새로운 경로를 생성 - 경로: 점들의 집합  x,y 지점부터 그릴 준비 시작
      context.beginPath();
      context.moveTo(x, y);

      //선 색상지정, 굵기지정 넣기
      context.strokeStyle = props.strokeColor;
      context.lineWidth = props.strokeLineWidth;
    }

    const onMousemove = (e) => {
      if (isMouseDown) {
        let x = e.offsetX;
        let y = e.offsetY;
        context.lineTo(x, y);
        context.stroke();
        
      }
    }

    const onMouseup = () => {
      isMouseDown = false;
      
      getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
    }

    canvas.addEventListener("mousedown", onMousedown);
    canvas.addEventListener("mousemove", onMousemove)
    canvas.addEventListener("mouseup", onMouseup)

    return () => {
      canvas.removeEventListener("mousedown", onMousedown);
      canvas.removeEventListener("mousemove", onMousemove)
      canvas.removeEventListener("mouseup", onMouseup)
    }
  }, [props.btnState, props.strokeColor, props.strokeLineWidth, udCount])


  //직선 그리기
  useEffect(() => {
    if (props.btnState.line !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    //canvas 요소에 접근해서 참조값 가져오기
    canvas = canvasRef.current;
    //getContext()로 캔버스의 2d context 얻어오기
    context = canvas.getContext("2d");
    const onMousedown = (e) => {
      //마우스 위치 (offset 값으로 canvas 상의 x좌표 y좌표 가져오기)
      let x = e.offsetX;
      let y = e.offsetY;

      //beginPath() : 새로운 경로를 생성 - 경로: 점들의 집합  x,y 지점부터 그릴 준비 시작
      context.beginPath();
      context.moveTo(x, y);

      //선 색상지정, 굵기지정 넣기
      context.strokeStyle = props.strokeColor;
      context.lineWidth = props.strokeLineWidth;
    }

    const onMouseup = (e) => {
      let x = e.offsetX;
      let y = e.offsetY;

      context.lineTo(x, y);
      context.stroke();
      getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
      props.setBtnState(btnState => ({ ...btnState, line: 0 }))
    }

    canvas.addEventListener("mousedown", onMousedown);
    canvas.addEventListener("mouseup", onMouseup);

    return () => {
      canvas.removeEventListener("mousedown", onMousedown);
      canvas.removeEventListener("mouseup", onMouseup);
    }
  }, [props.btnState.line, props.strokeColor, props.strokeLineWidth, udCount])


  //곡선 그리기
  useEffect(() => {
    if (props.btnState.curve !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");

    let startPoint = {};
    let cp1 = {};
    let cp2 = {};
    let count = 0;

    const onClick = (e) => {
      count++;
      console.log(count);

      if (count === 1) {
        console.log("count first : ", count);
        startPoint.x = e.offsetX;
        startPoint.y = e.offsetY;
        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;
        context2.fillStyle="#0000FF"
        context2.clearRect(0, 0, canvas2.width, canvas2.height)
        context2.beginPath();
        context2.ellipse(startPoint.x, startPoint.y, 5, 5, 0, 0, 2 * Math.PI);
        context2.fill();
      }
      else if (count === 2) {
        console.log("count cp1 : ", count);
        cp1.x = e.offsetX;
        cp1.y = e.offsetY;
        context2.beginPath();
        context2.ellipse(cp1.x, cp1.y, 5, 5, 0, 0, 2 * Math.PI);
        context2.fill();
      }
      else if (count === 3) {
        console.log("count cp2 : ", count);
        cp2.x = e.offsetX;
        cp2.y = e.offsetY;
        context2.beginPath();
        context2.ellipse(cp2.x, cp2.y, 5, 5, 0, 0, 2 * Math.PI);
        context2.fill();
      }
      else if (count === 4) {
        console.log("count end point : ", count);
        let x = e.offsetX;
        let y = e.offsetY;

        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);

        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;

        context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, x, y);
        context.stroke();
        getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);

        count = 0;
        context2.clearRect(0, 0, canvas2.width, canvas2.height)
        props.setBtnState(btnState => ({ ...btnState, curve: 0 }))
      }
    }

    const onMousemove = (e)=>{
      props.setCursor({x:e.offsetX, y:e.offsetY})
    }

    canvas2.addEventListener("click", onClick)
    canvas2.addEventListener("mousemove", onMousemove);

    return () => {
      canvas2.removeEventListener("click", onClick)
      canvas2.removeEventListener("mousemove", onMousemove);
    }
  }, [props.btnState.curve, props.strokeColor, props.strokeLineWidth, udCount])


  //타원 그리기
  useEffect(() => {
    if (props.btnState.ellipse !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    let startPointX;
    let startPointY;

    const onMousedown = (e) => {
      startPointX = e.offsetX;
      startPointY = e.offsetY;
      console.log("startPointX, startPointY : ", startPointX, startPointY)
    }

    const onMouseup = (e) => {
      let endPointX = e.offsetX;
      let endPointY = e.offsetY;

      console.log("endPointX, endPointY : ", endPointX, endPointY)

      if (isShiftPress === 1) {
        context.beginPath();

        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;

        
        if(endPointX>startPointX && endPointY>startPointY){
          context.ellipse((startPointX + (endPointX - startPointX) / 2), (startPointY + (endPointY - startPointY) / 2), (endPointX - startPointX) / 2, (endPointX - startPointX) / 2, 0, 0, 2 * Math.PI);
          context.stroke();
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }


        if (props.btnState.paint !== 0) {
          context.fillStyle = props.fillColor
          context.fill();
          props.setBtnState(btnState => ({ ...btnState, paint: 0 }))
        }
      }
      else {
        context.beginPath();

        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;
        
        if(endPointX>startPointX && endPointY>startPointY){
          context.ellipse((startPointX + (endPointX - startPointX) / 2), (startPointY + (endPointY - startPointY) / 2), (endPointX - startPointX) / 2, (endPointY - startPointY) / 2, 0, 0, 2 * Math.PI);
          context.stroke();
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        if (props.btnState.paint !== 0) {
          context.fillStyle = props.fillColor
          context.fill();
          props.setBtnState(btnState => ({ ...btnState, paint: 0 }))
        }
      }
      props.setBtnState(btnState => ({ ...btnState, ellipse: 0 }))
    }

    canvas.addEventListener("mousedown", onMousedown);
    canvas.addEventListener("mouseup", onMouseup);


    return () => {
      canvas.removeEventListener("mousedown", onMousedown);
      canvas.removeEventListener("mouseup", onMouseup)
    }
  }, [props.btnState.ellipse, isShiftPress, props.strokeColor, props.strokeLineWidth, props.fillColor, props.btnState.paint, udCount])


  //사각형 그리기
  useEffect(() => {
    if (props.btnState.rect !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    let startPointX;
    let startPointY;

    const onMousedown = (e) => {
      startPointX = e.offsetX;
      startPointY = e.offsetY;
    }

    const onMouseup = (e) => {
      let endPointX = e.offsetX;
      let endPointY = e.offsetY;

      if (isShiftPress === 1) {
        context.beginPath();

        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth

        context.rect(startPointX, startPointY, (endPointY - startPointY), (endPointY - startPointY));
        context.stroke();
        getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);

        if (props.btnState.paint !== 0) {
          context.fillStyle = props.fillColor
          context.fill();
          props.setBtnState(btnState => ({ ...btnState, paint: 0 }))
        }
      }
      else {
        context.beginPath();

        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;

        context.rect(startPointX, startPointY, (endPointX - startPointX), (endPointY - startPointY));
        context.stroke();
        getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);

        if (props.btnState.paint !== 0) {
          context.fillStyle = props.fillColor
          context.fill();
          props.setBtnState(btnState => ({ ...btnState, paint: 0 }))
        }
      }
      props.setBtnState(btnState => ({ ...btnState, rect: 0 }))
    }

    canvas.addEventListener("mousedown", onMousedown);
    canvas.addEventListener("mouseup", onMouseup);

    return () => {
      canvas.removeEventListener("mousedown", onMousedown);
      canvas.removeEventListener("mouseup", onMouseup)
    }
  }, [props.btnState.rect, isShiftPress, props.strokeColor, props.strokeLineWidth, props.fillColor, udCount])


  //다각형 그리기
  useEffect(() => {
    if (props.btnState.polygon !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    let startPointX;
    let startPointY;
    let endPointX;
    let endPointY;

    const onClick = (e) => {
      setCount(count => { let c = count + 1; return (c) });

      if (count === 0) {
        startPointX = e.offsetX;
        startPointY = e.offsetY;

        context.beginPath();
        context.moveTo(startPointX, startPointY);
        context.strokeStyle = props.strokeColor;
        context.lineWidth = props.strokeLineWidth;
      }
      else {
        endPointX = e.offsetX;
        endPointY = e.offsetY;

        if (e.shiftKey === true) {

          context.closePath();
          context.stroke();
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);

          if (props.btnState.paint !== 0) {
            context.fillStyle = props.fillColor
            context.fill();
            props.setBtnState(btnState => ({ ...btnState, paint: 0 }))
          }
          setCount(0);
          props.setBtnState(btnState => ({ ...btnState, polygon: 0 }))
        }
        else {
          context.lineTo(endPointX, endPointY);
          context.stroke();
        }
      }

    }
    canvas.addEventListener("click", onClick);


    return () => {
      canvas.removeEventListener("click", onClick);
    }
  }, [props.btnState.polygon, isShiftPress, props.btnState.paint, count, props.strokeColor, props.strokeLineWidth, udCount])


  //지우개
  useEffect(() => {
    if (props.btnState.eraser !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if(props.ccp.copy === 1){
      props.setCcp({copy: 0, paste: 0, cut: 0})
      canvas2 = canvas2Ref.current;
      context2 = canvas2.getContext("2d");
      context2.clearRect(0,0,canvas2.width, canvas2.height)
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
    }


    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    const onMousedown = (e) => {
      isMouseDown = true;
      context.clearRect(e.offsetX, e.offsetY, props.strokeLineWidth, props.strokeLineWidth);
    };

    const onMousemove = (e) => {
      if (isMouseDown) {
        context.clearRect(e.offsetX, e.offsetY, props.strokeLineWidth, props.strokeLineWidth);
      }
    };

    const onMouseup = () => {
      isMouseDown = false;
      getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
    };

    canvas.addEventListener("mousedown", onMousedown);
    canvas.addEventListener("mousemove", onMousemove);
    canvas.addEventListener("mouseup", onMouseup);


    return () => {
      canvas.removeEventListener("mousedown", onMousedown);
      canvas.removeEventListener("mousemove", onMousemove);
      canvas.removeEventListener("mouseup", onMouseup);
    }
  }, [props.btnState.eraser, props.strokeLineWidth, udCount])


  //영역선택
  useEffect(() => {
    if (props.ccp.copy !== 1) {
      return;
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }
    if (isClickPoint) {
      return
    }
    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");

    let startPointX;
    let startPointY;
    let endPointX;
    let endPointY;

    const onMousedown = (e) => {
      isMouseDown = true
      startPointX = e.offsetX;
      startPointY = e.offsetY;
    }

    const onMousemove = (e) => {
      endPointX = e.offsetX;
      endPointY = e.offsetY;
      props.setCursor({x: endPointX, y: endPointY });
      if (isMouseDown) {
        //canvas2 리셋
        context2.clearRect(0, 0, canvas.width, canvas.height);
        context2.strokeStyle = '#0000FF';
        context2.fillStyle = '#0000FF'
        //점선으로 지정
        context2.setLineDash([4, 2]);
       
        //사각형 그리기
        context2.strokeRect(startPointX, startPointY, (endPointX - startPointX), (endPointY - startPointY));
        
        //표시점들...
        createPoint(context2, startPointX, startPointY, endPointX, endPointY);
      }
    }

    const onMouseup = (e) => {
      isMouseDown = false;
      endPointX = e.offsetX;
      endPointY = e.offsetY;
      
      //사각형 그리기
      context2.strokeRect(startPointX, startPointY, (endPointX - startPointX), (endPointY - startPointY));

      if (startPointX !== endPointX && startPointY !== endPointY) {
        //선택영역 이미지 데이터 저장
        imageData = context.getImageData(startPointX, startPointY, (endPointX - startPointX), (endPointY - startPointY));
        //선택영역 위치 저장
        setSelectPoint({ sX: startPointX, sY: startPointY, eX: endPointX, eY: endPointY });
        props.setSelect({ sX: startPointX, sY: startPointY, eX: endPointX, eY: endPointY });
      }
      props.setBtnState(btnState => ({ ...btnState, select: 0 }))
    }

    canvas2.addEventListener("mousedown", onMousedown);
    canvas2.addEventListener("mousemove", onMousemove);
    canvas2.addEventListener("mouseup", onMouseup);

    return () => {
      canvas2.removeEventListener("mousedown", onMousedown);
      canvas2.removeEventListener("mousemove", onMousemove);
      canvas2.removeEventListener("mouseup", onMouseup);
    }
  }, [props.ccp.copy, isClickPoint])



  //영역취소
  useEffect(() => {
    if (!selectPoint) {
      return;
    }

    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");
    let sX = selectPoint.sX;
    let sY = selectPoint.sY;
    let eX = selectPoint.eX;
    let eY = selectPoint.eY;

    if (esc === 1) {
      context2.clearRect(0, 0, canvas2.width, canvas2.height);
      setSelectPoint();
      props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
      props.setCcp(ccp=>({...ccp, copy: 0}));
      setEsc(0);
    }

    const onClick = (e)=>{
      let x = e.offsetX;
      let y = e.offsetY;
      if(!((sX<=x && x<=eX)&&(sY<=y&&y<=eY))){
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        setSelectPoint();
        props.setSelect({ sX: 0, sY: 0, eX: 0, eY: 0 });
      }
    }
    canvas2.addEventListener("click", onClick);
    return () => {
      canvas2.removeEventListener("click", onClick);
    }
  }, [selectPoint, esc])


  //붙여넣기
  useEffect(() => {
    if (props.ccp.paste !== 1) {
      return;
    }
    if (props.ccp.copy === 1) {
      props.setCcp(ccp => ({ ...ccp, copy: 0 }))
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }

    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");


    const onClick = (e) => {
      context.putImageData(imageData, e.offsetX, e.offsetY);
      props.setCcp(ccp=>({...ccp, paste: 0}))
      context2.clearRect(0,0,canvas2.width, canvas2.height);
      getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
    }

    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("click", onClick);
    }
  }, [props.ccp.paste])


  //잘라내기
  useEffect(() => {
    if (props.ccp.cut !== 1) {
      return;
    }
    if (props.ccp.copy === 1) {
      props.setCcp(ccp => ({ ...ccp, copy: 0 }))
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }

    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    context.clearRect(selectPoint.sX - 1, selectPoint.sY - 1, (selectPoint.eX - selectPoint.sX) + 2, (selectPoint.eY - selectPoint.sY) + 2);
    getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);

    props.setCcp(ccp => ({ ...ccp, cut: 0 }));

  }, [props.ccp.cut])


  const [clickAngle, setClickAngle] = useState(1.5);
  const [rotateAngle, setRotateAngle] = useState(0);
  //회전
  useEffect(() => {
    if(!selectPoint){
      props.setTrans({rotateL: 0 })
      return;
    }
    if (props.trans.rotateL !== 1) {
      return;
    }
    if (props.ccp.copy === 1) {
      props.setCcp(ccp => ({ ...ccp, copy: 0 }))
    }
    if (props.btnState.brush === 1) {
      props.setBtnState(btnState => ({ ...btnState, brush: 0 }))
    }
    if (props.btnState.eraser === 1) {
      props.setBtnState(btnState => ({ ...btnState, eraser: 0 }))
    }

    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");

    if (selectPoint) {
      let sX = selectPoint.sX;
      let sY = selectPoint.sY;
      let eX = selectPoint.eX;
      let eY = selectPoint.eY;
      let centerX = eX - ((eX - sX) / 2);
      let centerY = eY - ((eY - sY) / 2);

      const onMousedown = (e) => {
        isMouseDown = true;
        let x = e.offsetX;
        let y = e.offsetY;
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.putImageData(imageData, sX, sY);
        setClickAngle(Math.atan2(y - centerY, x - centerX))
      }

      const onMousemove = (e) => {
        if (isMouseDown) {
          context2.clearRect(sX - 1, sY - 1, (eX - sX) + 2, (eY - sY) + 2);

          let x = e.offsetX;
          let y = e.offsetY;
          props.setCursor({x:x, y:y})
          setRotateAngle(Math.atan2(y - centerY, x - centerX) - clickAngle)

          //select box 중심 축으로 이동
          context2.translate(centerX, centerY);
          //움직인 각만큼 회전
          context2.rotate(rotateAngle);
          //원점으로 회귀
          context2.translate(-centerX, -centerY);

          let image = new Image();
          image.src = canvas.toDataURL();
          let pattern = context.createPattern(image, 'repeat');
          context2.fillStyle = pattern;
          context2.fillRect(sX, sY, (eX - sX), (eY - sY));
        }
      }

      const onMouseup = () => {
        //돌아간 캔버스 원점 회귀
        context2.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(sX, sY, (eX - sX), (eY - sY));
        isMouseDown = false;
        //canvas2의 전체 이미지를 canvas1에 draw => glabalCompositeOperation 설정해서 덮어씌우지 않게 수정
        rotatedImg = context2.getImageData(0, 0, canvas2.width, canvas2.height);
        context.globalCompositeOperation = "source-over"
        context.drawImage(canvas2, 0, 0, canvas.width, canvas.height)
        getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        props.setTrans(trans => ({ ...trans, rotateL: 0 }))
      }

      canvas2.addEventListener("mousedown", onMousedown);
      canvas2.addEventListener("mousemove", onMousemove);
      canvas2.addEventListener("mouseup", onMouseup);

      return () => {
        canvas2.removeEventListener("mousedown", onMousedown);
        canvas2.removeEventListener("mousemove", onMousemove);
        canvas2.removeEventListener("mouseup", onMouseup);
      }
    }
  }, [props.trans.rotateL, rotateAngle, udCount])


  
  //open 버튼 누르면 input type file 활성화시키기
  useEffect(() => {
    if(props.f.openFile === 1){
      fileInputRef.current.click();
      props.setF(f=>({...f, openFile: 0}));
    }
  }, [props.f.openFile])


  HTMLCanvasElement.prototype.renderImage = function (blob, context, canvas) {
    var img = new Image();
    img.onload = function () {
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      getCanvasScreenshot( canvas, cvsArr, setCvsArr, udCount, setUdCount); 
    }
    img.src = URL.createObjectURL(blob);
  };

  //파일 불러오기
  const onChangeOpenFile = (e) => {
    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.renderImage(e.target.files[0], context, canvas);
    e.target.value = null;
  }


  //마우스 위치 확인용
  useEffect(() => {
    if (isClickPoint || props.btnState.curve ===1) return;
    if (!selectPoint) {
      return;
    }
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");

    if (selectPoint) {

      let sX = selectPoint.sX;
      let sY = selectPoint.sY;
      let eX = selectPoint.eX;
      let eY = selectPoint.eY;
      let x = 0, y = 0;

      const onMousemove = (e) => {
        x = e.offsetX
        y = e.offsetY

        if ((sX - 20 <= x && x <= sX + 20) && (sY - 20 <= y && y <= sY + 20)) {
          //비교해서 
          setPos("top-left");
          console.log("point");
        }
        else if ((sX + (eX - sX) - 20 <= x && x <= sX + (eX - sX) + 20) && (sY - 20 <= y && y <= sY + 20)) {
          setPos("top-right")
          console.log("point");
        }
        else if ((sX + ((eX - sX) / 2) - 20 <= x && x <= sX + ((eX - sX) / 2) + 20) && (sY - 20 <= y && y <= sY + 20)) {
          setPos("top-middle")
          console.log("point");
        }
        else if ((sX - 20 <= x && x <= sX + 20) && (sY + (eY - sY) - 20 <= y && y <= sY + (eY - sY) + 20)) {
          setPos("bottom-left")
          console.log("point");
        }
        else if ((eX - 20 <= x && x <= eX + 20) && (eY - 20 <= y && y <= eY + 20)) {
          setPos("bottom-right")
          console.log("point");
        }
        else if ((sX + ((eX - sX) / 2) - 20 <= x && x <= sX + ((eX - sX) / 2) + 20) && (eY - 20 <= y && y <= eY + 20)) {
          setPos("bottom-middle")
          console.log("point");
        }
        else if ((sX - 20 <= x && x <= sX + 20) && sY + ((eY - sY) / 2) - 20 <= y && y <= sY + ((eY - sY) / 2) + 20) {
          setPos("left-middle")
          console.log("point");
        }
        else if ((eX - 20 <= x && x <= eX + 20) && sY + ((eY - sY) / 2) - 20 <= y && y <= sY + ((eY - sY) / 2) + 20) {
          setPos("right-middle")
          console.log("point");
        }
        else {
          setPos("none")
        }
      }

      canvas2.addEventListener("mousemove", onMousemove);
      console.log('add');
      return () => {
        console.log('remove');
        canvas2.removeEventListener("mousemove", onMousemove);
      }
    }
  }, [selectPoint])


  //마우스 위치 확인용2
  useEffect(() => {
    canvas = canvasRef.current;
    context = canvas.getContext("2d");

    const handleMousemove = (e)=>{
      props.setCursor({ x: e.offsetX, y: e.offsetY });
    }

    canvas.addEventListener('mousemove', handleMousemove);
    return () => {
      canvas.removeEventListener('mousemove', handleMousemove);
    }
  }, [])



  // 영역 조정
  useEffect(() => {
    if (pos === "none") {
      return;
    }
    canvas = canvasRef.current;
    context = canvas.getContext("2d");
    canvas2 = canvas2Ref.current;
    context2 = canvas2.getContext("2d");
    canvas3 = canvas3Ref.current;
    context3 = canvas3.getContext("2d");

    if (selectPoint) {
      //조정되기 전 값
      let sX = selectPoint.sX;
      let sY = selectPoint.sY;
      let eX = selectPoint.eX;
      let eY = selectPoint.eY;

      const onMousedown = () => {
        setIsClickPoint(true);
        isMouseDown = true;
        context3.clearRect(0, 0, canvas2.width, canvas2.height);
      }

      const onMousemove = (e) => {
        if (isMouseDown) {
          context3.clearRect(0, 0, canvas2.width, canvas2.height);
          let x = e.offsetX;
          let y = e.offsetY;
          context3.lineWidth = 0.5;
          if (pos == "top-middle") {
            setSelectPoint(selectPoint => ({ ...selectPoint, sY: y }));
            context3.strokeRect(sX, y, eX - sX, eY - y);
          }
          else if (pos == "top-left") {
            setSelectPoint(selectPoint => ({ ...selectPoint, sX: x, sY: y }));
            context3.strokeRect(x, y, eX - x, eY - y);
          }
          else if (pos == "top-right") {
            setSelectPoint(selectPoint => ({ ...selectPoint, eX: x, sY: y }));
            context3.strokeRect(sX, y, x - sX, eY - y);
          }
          else if (pos == "bottom-left") {
            setSelectPoint(selectPoint => ({ ...selectPoint, sX: x, eY: y }));
            context3.strokeRect(x, sY, eX - x, y - sY);
          }
          else if (pos == "bottom-right") {
            setSelectPoint(selectPoint => ({ ...selectPoint, eX: x, eY: y }));
            context3.strokeRect(sX, sY, x - sX, y - sY);
          }
          else if (pos == "bottom-middle") {
            setSelectPoint(selectPoint => ({ ...selectPoint, eY: y }));
            context3.strokeRect(sX, sY, eX - sX, y - sY);
          }
          else if (pos == "left-middle") {
            setSelectPoint(selectPoint => ({ ...selectPoint, sX: x }));
            context3.strokeRect(x, sY, eX - x, eY - sY);
          }
          else if (pos == "right-middle") {
            setSelectPoint(selectPoint => ({ ...selectPoint, eX: x }));
            context3.strokeRect(sX, sY, x - sX, eY - sY);
          }
        }
      }

      const onMouseup = (e) => {
        // let sX2 = selectPoint2.sX;
        // let sY2 = selectPoint2.sY;
        // let eX2 = selectPoint2.eX;
        // let eY2 = selectPoint2.eY;
        context3.clearRect(0, 0, canvas2.width, canvas2.height);

        isMouseDown = false;
        setIsClickPoint(false);

        // let image = new Image();
        // image.src = canvas.toDataURL();
        //result canvas에 drawImage - 조정한 영역만큼
        //조정한 만큼 imageData로 저장
        if (sX !== eX && sY !== eY) {
          //선택영역 이미지 데이터 저장
          imageData = context.getImageData(sX, sY, eX - sX, eY - sY);
        }
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        // context2.strokeRect(sX, sY, eX-sX, eY-sY);
        let x = e.offsetX;
        let y = e.offsetY;
        // context3.lineWidth = 0.5;
        if (pos == "top-middle") {
          setSelectPoint(selectPoint => ({ ...selectPoint, sY: y }));
          context2.strokeRect(sX, y, eX - sX, eY - y);
          createPoint(context2, sX, y, eX, eY);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, sX, y, eX - sX, eY - y);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "top-left") {
          setSelectPoint(selectPoint => ({ ...selectPoint, sX: x, sY: y }));
          context2.strokeRect(x, y, eX - x, eY - y);
          createPoint(context2, x, y, eX, eY);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, x, y, eX - x, eY - y);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "top-right") {
          setSelectPoint(selectPoint => ({ ...selectPoint, eX: x, sY: y }));
          context2.strokeRect(sX, y, x - sX, eY - y);
          createPoint(context2, sX, y, x, eY);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, sX, y, x - sX, eY - y);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "bottom-left") {
          setSelectPoint(selectPoint => ({ ...selectPoint, sX: x, eY: y }));
          context2.strokeRect(x, sY, eX - x, y - sY);
          createPoint(context2, x, sY, eX, y);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, x, sY, eX - x, y - sY);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "bottom-right") {
          setSelectPoint(selectPoint => ({ ...selectPoint, eX: x, eY: y }));
          context2.strokeRect(sX, sY, x - sX, y - sY);
          createPoint(context2, sX, sY, x, y);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, sX, sY, x - sX, y - sY);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "bottom-middle") {
          setSelectPoint(selectPoint => ({ ...selectPoint, eY: y }));
          context2.strokeRect(sX, sY, eX - sX, y - sY);
          createPoint(context2, sX, sY, eX, y);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, y - sY);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "left-middle") {
          setSelectPoint(selectPoint => ({ ...selectPoint, sX: x }));
          context2.strokeRect(x, sY, eX - x, eY - sY);
          createPoint(context2, x, sY, eX, eY);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, x, sY, eX - x, eY - sY);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
        else if (pos == "right-middle") {
          setSelectPoint(selectPoint => ({ ...selectPoint, eX: x }));
          context2.strokeRect(sX, sY, x - sX, eY - sY);
          createPoint(context2, sX, sY, x, eY);
          context3.drawImage(canvas, sX, sY, eX - sX, eY - sY, sX, sY, eX - sX, eY - sY,);
          context.clearRect(sX, sY, eX - sX, eY - sY);
          context.drawImage(canvas3, sX, sY, eX - sX, eY - sY, sX, sY, x - sX, eY - sY);
          getCanvasScreenshot(canvas, cvsArr, setCvsArr, udCount, setUdCount);
        }
      }

      canvas2.addEventListener("mousedown", onMousedown);
      canvas3.addEventListener("mousemove", onMousemove);
      canvas3.addEventListener("mouseup", onMouseup);
      console.log('1');
      return () => {
        canvas2.removeEventListener("mousedown", onMousedown);
        canvas3.removeEventListener("mousemove", onMousemove);
        canvas3.removeEventListener("mouseup", onMouseup);
        console.log('2');
      }
    }
  }, [isClickPoint, pos, udCount])


  const [zoom, setZoom] = useState(1);
  //확대축소
  useEffect(() => {
    if(props.scale.in === 1){
      if(zoom === 8){
        props.setScale(scale=>({ ...scale, in: 0 }));
        return;
      }
      setZoom(zoom*2);
      props.setScale(scale=>({ ...scale, in: 0 }));
    }
    else if(props.scale.out === 1){
      if(zoom === 0.125){
        props.setScale(scale=>({...scale, out: 0}));
        return;
      }
      setZoom(zoom*0.5);
      props.setScale(scale=>({...scale, out: 0}));
    }
    console.log(zoom);
    props.setContent(zoom);
  }, [props.scale])


  const canvasStyle= ()=>{
    if(zoom!==1){
      return{
        transformOrigin: `top left`, 
        transform: `scale(${zoom})`}
    }
  }

  const canvas2Style = (props)=>{
    if(zoom!==1){
      return {
        visibility: (props.ccp.copy === 1 || props.trans.rotateL === 1 || props.btnState.curve === 1 ) ? 'visible' : 'hidden', 
        transformOrigin: `top left`,
        transform: `scale(${zoom})`
      }
    }
    else{
      return { visibility: (props.ccp.copy === 1 || props.trans.rotateL === 1 || props.btnState.curve === 1 ) ? 'visible' : 'hidden'}
    }
  }

  const canvas3Style = ()=>{
    if(zoom!==1){
      return {
        visibility: isClickPoint === true ? 'visible' : 'hidden', 
        transformOrigin: `top left`,
        transform: `scale(${zoom})`
      }
    }
    else{
      return {visibility: isClickPoint === true ? 'visible' : 'hidden'}
    } 
  }


  return (
    <div className="container-canvas">
      <div>
        <input ref={fileInputRef} type="file" accept="image" onChange={onChangeOpenFile} hidden/>
      </div>
      {/* canvas 요소에 접근할 수 있도록 Ref 걸기  */}
      
      <div className="canvas-div">
        <canvas style={canvasStyle(props)} ref={canvasRef} className="canvas-board" width="1400px" height="750px"></canvas>
        <canvas style={canvas2Style(props)} ref={canvas2Ref} className="canvas-select" width="1400px" height="750px"></canvas>
        <canvas style={canvas3Style(props)} ref={canvas3Ref} className="canvas-select2" width="1400px" height="750px"></canvas>
      </div>
    </div>
  )
}

const StateBar = (props) => {

  const onClickZoomIn = ()=>{
    props.setScale(scale=>({...scale, in: 1}));
  }

  const onClickZoomOut = ()=>{
    props.setScale(scale=>({...scale, out: 1}));
  }

  return(
    <div className='stateBar-container'>
      <div>
        <span className='state-name'>확대/축소</span><br />
        <button onClick={onClickZoomIn}>확대</button>
        <button onClick={onClickZoomOut}>축소</button>
      </div>
      <div>
        <span className='state-name'>커서 좌표</span><br />
        <span>x: {props.cursor.x}, y: {props.cursor.y}</span><br/>
      </div>
      <div>
        <span className='state-name'>선택 영역</span><br />
        <span>[start]  x: {props.select.sX}, y: {props.select.sY}</span><br/>
        <span>[end]  x: {props.select.eX}, y:{props.select.eY}</span>
      </div>
      <div>
        <span className='state-name'>컨텐츠 영역</span><br />
        <span>{props.content*100} %</span><br/>
      </div>
    </div>
  )
}



const App = () => {

  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeLineWidth, setStrokeLineWidth] = useState(1);
  const [btnState, setBtnState] = useState({ line: 0, curve: 0, ellipse: 0, rect: 0, polygon: 0, eraser: 0, paint: 0, select: 0, brush: 0 })
  const [ccp, setCcp] = useState({ copy: 0, paste: 0, cut: 0 })
  const [fillColor, setFillColor] = useState('#000000')
  const [trans, setTrans] = useState({ rotateL: 0})
  const [f, setF] = useState({ newFile: 0, saveFile: 0, openFile: 0 })
  const [undo, setUndo] = useState(0);
  const [redo, setRedo] = useState(0);
  const [scale, setScale] = useState({ in: 0, out: 0 })
  const [cursor, setCursor] = useState({x: 0, y: 0});
  const [select, setSelect] = useState({ sX: 0, sY: 0, eX: 0, eY: 0 });
  const [content, setContent] = useState(1);


  return (
    <div className='container'>
      <div className="first"><div className="bar"></div></div>
      <div className="item">
        <h1>Canvas</h1>
        <Menu
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          setStrokeLineWidth={setStrokeLineWidth}
          setBtnState={setBtnState}
          setFillColor={setFillColor}
          setCcp={setCcp}
          ccp={ccp}
          setTrans={setTrans}
          setF={setF}
          setUndo={setUndo}
          setRedo={setRedo}
        />
      </div>
      <div className="item">
        <StateBar
          setScale={setScale}
          setCursor={setCursor}
          cursor={cursor}
          select={select}
          content={content}
        />
      </div>
      <div className="item">
        <Canvas
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeLineWidth={strokeLineWidth}
          setStrokeLineWidth={setStrokeLineWidth}
          btnState={btnState}
          setBtnState={setBtnState}
          fillColor={fillColor}
          setFillColor={setFillColor}
          setCcp={setCcp}
          ccp={ccp}
          setTrans={setTrans}
          trans={trans}
          setF={setF}
          f={f}
          undo={undo}
          setUndo={setUndo}
          redo={redo}
          setRedo={setRedo}
          setScale={setScale}
          scale={scale}
          setCursor={setCursor}
          setSelect={setSelect}
          setContent={setContent}
        />
      </div>
    </div>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

