// Shared run-wide abort state. Evidence contains labels/IDs only, never request URLs or tokens.
const fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');
const EXIT=86;
function firstViolation(policy,event={}) {
  const evidence={time:new Date().toISOString(),pid:process.pid,kind:String(event.kind||'containment'),transport:String(event.transport||'unknown'),source:String(event.source||'node')};
  try {const fd=fs.openSync(policy.violation,'wx');try{fs.writeFileSync(fd,JSON.stringify(evidence)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}catch(error){if(error.code!=='EEXIST')throw error;}
  return evidence;
}
function assertHealthy(policy) {if(fs.existsSync(policy.violation))throw Error('C01 run aborted: persisted containment violation');}
function fatal(policy,event) {try{firstViolation(policy,event);}finally{process.exit(EXIT);}}
function readPolicy(directory=process.env.C01_E2E_RUN_DIR) {
  if(!directory)throw Error('C01 supervised run directory required');
  const p=JSON.parse(fs.readFileSync(path.join(directory,'c01-runtime-policy.json'),'utf8'));
  if(p.env.C01_E2E_STAGING_ENABLED!=='0')throw Error('Staging execution gate closed');
  return p;
}
class RunMonitor extends EventEmitter {
  constructor(policy) {
    super();this.policy=policy;this.aborted=false;this.pids=new Set();this.children=new Set();this.closers=new Set();
    this.scan=()=>{
      try {
        if(fs.existsSync(policy.ledger)){
          const lines=fs.readFileSync(policy.ledger,'utf8').split('\n');lines.pop();
          for(const line of lines.filter(Boolean)){const e=JSON.parse(line);if((e.kind==='process-start'||e.kind==='browser-start')&&e.cwdIsSnapshot&&Number.isInteger(e.pid)&&e.pid>0&&e.pid!==process.pid)this.pids.add(e.pid);}
        }
        if(fs.existsSync(policy.violation))this.abort();
      }catch{try{firstViolation(policy,{source:'supervisor',transport:'ledger-unreadable'});}finally{this.abort();}}
    };
    this.watcher=fs.watch(path.dirname(policy.violation),this.scan);this.timer=setInterval(this.scan,25);this.timer.unref();this.scan();
  }
  register(child){this.assertHealthy();this.children.add(child);child.once('exit',code=>{this.children.delete(child);if(code===EXIT&&!this.disposed){try{firstViolation(this.policy,{source:'supervisor',transport:'fatal-child-exit'});}finally{this.abort();}}});return child;}
  registerCloser(close){this.assertHealthy();this.closers.add(close);return ()=>this.closers.delete(close);}
  assertHealthy(){assertHealthy(this.policy);if(this.aborted)throw Error('C01 monitor aborted');}
  abort(){
    if(this.aborted)return;this.aborted=true;
    for(const pid of this.pids)try{process.kill(pid);}catch{}
    for(const child of this.children)try{child.kill();}catch{}
    for(const close of this.closers)try{Promise.resolve(close()).catch(()=>{});}catch{}
    this.emit('abort');
  }
  dispose(){this.disposed=true;this.watcher.close();clearInterval(this.timer);}
}
module.exports={EXIT,firstViolation,assertHealthy,fatal,readPolicy,RunMonitor};
