import roundedRectangle from 'canvas-rounded-rectangle';

const rectStyle = (x, y, width, height, strokeColor, fillColor, radius)=> {
    if(typeof radius === 'undefined'){
      radius = 10
    }
    
    return({
      top: x,
      left: y,
      width: width,
      height: height,
      stroke: strokeColor,
      fill: fillColor,
      borderRadius: radius,
      strokeWidth: 10,
      hover: {
          stroke: '#ff3333'
      }
    })
  }


   // let rect = rectStyle(x, y, 200, 70, '#B6E3E9', '#B6E3E9', 40);
    // let firstNode = roundedRectangle(rect);
    // ctx.fillColor = rect.fill;
