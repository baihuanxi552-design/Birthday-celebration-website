export const assetNames = {
  1:'01_intro.jpg',2:'02_mic.jpg',3:'03_win.jpg',4:'04_warn.jpg',5:'05_glove.jpg',6:'06_cube.jpg',7:'07_blur.jpg',8:'08_bed.jpg',9:'09_stand.jpg',10:'10_bros.png',11:'11_mask_dance.mp4',12:'12_sleep_face.jpg',13:'13_daze.jpg',14:'14_neck_tilt.jpg',15:'15_umbrella_peek.jpg',16:'16_hotpot.jpg',17:'17_medal.jpg',18:'18_class_laugh.jpg',19:'19_suits_five.jpg',20:'20_polaroid.jpg'
};
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const LOOP_END = 6.4;
export const comicState = (value) => {
  const p=clamp(Number(value),0,100)/50;
  const opacity=[Math.max(0,1-p),Math.max(0,1-Math.abs(p-1)),Math.max(0,p-1)];
  const text=p<.65?'起初，他还在认真看书。':p<1.55?'后来，他开始思考人生。':'最后，他选择当场断电。';
  return {opacity,text,battery:Math.round(100-p*50),tilt:p>1?(p-1)*8:0};
};
// Coordinates include the contain-mode letterbox, rather than assuming the image fills its box.
export const lensGeometry = ({width,height,imageWidth,imageHeight,x,y,zoom=8,lens=180}) => {
  const scale=Math.min(width/imageWidth,height/imageHeight);
  const drawnWidth=imageWidth*scale,drawnHeight=imageHeight*scale;
  const offsetX=(width-drawnWidth)/2,offsetY=(height-drawnHeight)/2;
  const px=clamp(x-offsetX,0,drawnWidth),py=clamp(y-offsetY,0,drawnHeight);
  return {
    left:clamp(x-lens/2,0,Math.max(0,width-lens)),top:clamp(y-lens/2,0,Math.max(0,height-lens)),
    backgroundSize:`${drawnWidth*zoom}px ${drawnHeight*zoom}px`,
    backgroundPosition:`${lens/2-px*zoom}px ${lens/2-py*zoom}px`,
    targetX:offsetX+drawnWidth*.381,targetY:offsetY+drawnHeight*.386,
  };
};
