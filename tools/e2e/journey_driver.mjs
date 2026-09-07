// 通过真实输入和物理帧跑路线，不直接修改角色坐标或判定结果。
export function journeyActions(plan,skilled=false){
  const actions=[{z:0,lane:plan.safeLane,lead:0}];
  const steps=(plan.basicSteps||[]).filter(step=>!skilled||!plan.skills.some(s=>step.z>=s.steps[0].z&&step.z<=s.steps.at(-1).z));
  if(skilled)for(const s of plan.skills){steps.push(...s.steps);actions.push({z:s.steps.at(-1).z+plan.speed*1.1,lane:plan.safeLane,lead:0});}
  for(const step of steps){
    actions.push({z:step.z,lane:step.lane,lead:.95});
    if(step.action==='jump'||step.action==='slide')actions.push({z:step.z,action:step.action==='jump'?'onJump':'onSlide',lead:.30});
    if(step.action==='double')actions.push({z:step.z,action:'onJump',lead:.60},{z:step.z,action:'onJump',lead:.27});
  }
  return actions.sort((a,b)=>(a.z-plan.speed*a.lead)-(b.z-plan.speed*b.lead));
}
export function driveJourney(game,actions,fps=60){
  const {G,pl}=game;let at=0,frames=0;
  while(G.state==='play'&&frames++<10000){
    while(actions[at]&&G.dist>=actions[at].z-G.speed*(actions[at].lead||0)){
      const a=actions[at++];
      if(a.lane!==undefined){while(pl.lane<a.lane)game.onRight();while(pl.lane>a.lane)game.onLeft();}
      else game[a.action]();
    }
    game.update(1/fps);
  }
  return frames;
}
