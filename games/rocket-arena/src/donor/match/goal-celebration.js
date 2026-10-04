import { PhysicsClock } from "../physics/clock.js";

// Score/replay time is paused independently; the live car bodies keep simulating.
export class GoalCelebrationPhysics {
  constructor(sim, {playerIndex=0, carCountOffset=2, neutralControls={}, sampleControls=()=>{}, ballOffset=4}={}) {
    Object.assign(this,{sim,playerIndex,carCountOffset,neutralControls,sampleControls});
    this.clock=new PhysicsClock(sim,{ballOffset});
    this.elapsed=0;
  }
  begin() {
    this.elapsed=0;
    this.sim.applyGoalExplosion?.();
    this.clock.sync(0);
  }
  update(delta) {
    this.elapsed+=Math.max(0,Math.min(.1,Number.isFinite(delta)?delta:0));
    this.clock.update(this.elapsed*1000,()=>{
      this.sampleControls();
      for(let i=0;i<this.sim.state[this.carCountOffset];i++)
        if(i!==this.playerIndex)this.sim.setControls(i,this.neutralControls);
    },()=>{
      this.sim.step(1);
      // Celebration contacts must not count another goal or advance match time.
      this.sim.pollGoal();
      return true;
    });
    return this.clock;
  }
}
