// Plaza-local coordinates, after the plaza's furniture spacing expansion.
export const plazaSeats=[[-3.55,.8],[3.55,.8],[-1,1.95],[1,1.95]].map(([x,z])=>({x,z,y:.4625,heading:Math.atan2(-x,-z)}));

export function plazaSeatBlocks(x,z){return plazaSeats.some(s=>{const dx=x-s.x,dz=z-s.z,c=Math.cos(s.heading),sn=Math.sin(s.heading);return Math.abs(dx*c-dz*sn)<.49&&Math.abs(dx*sn+dz*c)<.28})}
