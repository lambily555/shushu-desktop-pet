import sys
from pathlib import Path

tool_dir = Path(sys.argv[3])
sys.path.insert(0, str(tool_dir))

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

source = Path(sys.argv[1])
target = Path(sys.argv[2])
fps = 15
seconds = 3.4
canvas_size = 420

cap = cv2.VideoCapture(str(source))
native_fps = cap.get(cv2.CAP_PROP_FPS) or 25
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = max(.1, total / native_fps)
start = max(0, min(duration*.12, duration-seconds))
count = max(2, int(min(seconds, duration-start)*fps))
session_u2 = new_session('u2net')
cutouts = []
bounds = []
previous_alpha = None
roi = None

for i in range(count):
    cap.set(cv2.CAP_PROP_POS_MSEC, min(duration-.04,start+i/fps)*1000)
    ok, frame = cap.read()
    if not ok:
        continue
    h,w = frame.shape[:2]
    scale=min(1,720/max(h,w))
    if scale<1: frame=cv2.resize(frame,(round(w*scale),round(h*scale)),interpolation=cv2.INTER_AREA)
    rgb=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
    if roi is None:
        gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
        dark=(gray<148).astype(np.uint8);margin=max(3,int(min(gray.shape)*.04));dark[:margin,:]=0;dark[-margin:,:]=0;dark[:,:margin]=0;dark[:,-margin:]=0
        dark=cv2.morphologyEx(dark,cv2.MORPH_CLOSE,np.ones((11,11),np.uint8))
        n0,lab0,st0,cent0=cv2.connectedComponentsWithStats(dark,8);candidates=[];area0=gray.size
        for idx in range(1,n0):
            x,y,ww,hh,area=st0[idx]
            if area<area0*.004 or area>area0*.35 or ww>gray.shape[1]*.72 or hh>gray.shape[0]*.72:continue
            dx=(cent0[idx][0]-gray.shape[1]/2)/gray.shape[1];dy=(cent0[idx][1]-gray.shape[0]/2)/gray.shape[0]
            candidates.append((area*np.exp(-(dx*dx+dy*dy)/.11),x,y,ww,hh))
        if candidates:
            _,x,y,ww,hh=max(candidates);padx=int(ww*.42);pady=int(hh*.42)
            roi=(max(0,x-padx),max(0,y-pady),min(frame.shape[1],x+ww+padx),min(frame.shape[0],y+hh+pady))
        else: roi=(int(frame.shape[1]*.14),int(frame.shape[0]*.14),int(frame.shape[1]*.86),int(frame.shape[0]*.86))
    rx0,ry0,rx1,ry1=roi;rgb=rgb[ry0:ry1,rx0:rx1]
    lut=np.array([min(255,((v/255.0)**.80)*255+6) for v in range(256)],dtype=np.uint8)
    rgb=cv2.LUT(rgb,lut)
    source_image=Image.fromarray(rgb)
    rgba=np.array(remove(source_image,session=session_u2))
    alpha=rgba[:,:,3]
    mask=(alpha>52).astype(np.uint8)
    n,labels,stats,centroids=cv2.connectedComponentsWithStats(mask,8)
    if n>1:
        frame_area=mask.shape[0]*mask.shape[1];cx=mask.shape[1]/2;cy=mask.shape[0]/2
        scores=[]
        for index in range(1,n):
            area=stats[index,cv2.CC_STAT_AREA]
            dx=(centroids[index][0]-cx)/mask.shape[1];dy=(centroids[index][1]-cy)/mask.shape[0]
            center_weight=np.exp(-(dx*dx+dy*dy)/.14)
            scores.append(-1 if area>frame_area*.68 else area*(.35+.65*center_weight))
        keep=1+int(np.argmax(scores));alpha[labels!=keep]=0
    solid=cv2.morphologyEx((alpha>46).astype(np.uint8)*255,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    solid=cv2.morphologyEx(solid,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    solid=cv2.GaussianBlur(solid,(5,5),0);alpha=np.minimum(alpha,solid);alpha[alpha<24]=0
    if previous_alpha is not None and previous_alpha.shape==alpha.shape:alpha=cv2.addWeighted(alpha,.86,previous_alpha,.14,0)
    previous_alpha=alpha.copy();rgba[:,:,3]=alpha
    ys,xs=np.where(alpha>45)
    if len(xs)<100: continue
    bounds.append((xs.min(),ys.min(),xs.max()+1,ys.max()+1));cutouts.append(Image.fromarray(rgba,'RGBA'))
cap.release()
if not cutouts: raise RuntimeError('没有识别到可抠出的主体')

frames=[]
box_w=int(np.percentile([b[2]-b[0] for b in bounds],90)*1.14);box_h=int(np.percentile([b[3]-b[1] for b in bounds],90)*1.14)
centers=[((b[0]+b[2])/2,(b[1]+b[3])/2) for b in bounds]
for index,cut in enumerate(cutouts):
    nearby=centers[max(0,index-2):min(len(centers),index+3)];cx=sum(p[0] for p in nearby)/len(nearby);cy=sum(p[1] for p in nearby)/len(nearby)
    x0=max(0,int(cx-box_w/2));y0=max(0,int(cy-box_h/2));x1=min(cut.width,x0+box_w);y1=min(cut.height,y0+box_h)
    crop=cut.crop((x0,y0,x1,y1))
    visible=crop.getbbox()
    if visible: crop=crop.crop(visible)
    crop.thumbnail((canvas_size-18,canvas_size-18),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(canvas_size,canvas_size),(0,0,0,0))
    canvas.alpha_composite(crop,((canvas_size-crop.width)//2,canvas_size-crop.height-8));frames.append(canvas)
target.parent.mkdir(parents=True,exist_ok=True)
frames[0].save(target,save_all=True,append_images=frames[1:],duration=round(1000/fps),loop=0,lossless=False,quality=88,method=4)
print(target)
