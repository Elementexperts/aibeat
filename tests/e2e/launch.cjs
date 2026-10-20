// Preparation is shared with local verification. This file does not authorize staging execution.
const fs=require('node:fs'),path=require('node:path');
const {prepareRuntime}=require('./runtime-config.cjs');
function prepare(configFile) {
  const source=path.resolve(__dirname,'../..'),file=path.resolve(configFile||'');
  const relative=path.relative(source,file);
  if(!configFile||!relative||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)))throw Error('Protected configuration must be outside repository');
  const prepared=prepareRuntime({config:JSON.parse(fs.readFileSync(file,'utf8')),source});
  return {...prepared,runnerEnvironment:require('./runner-policy.cjs').runnerEnvironment(prepared,file)};
}
if(require.main===module && process.argv.includes('--verify-local') && process.argv.length===3) {
  require('./local-runtime.cjs').run().catch(()=>{console.error('Local containment probe refused');process.exitCode=1;});
}else if(require.main===module){
  try {if(process.argv.includes('--start'))throw Error('Execution gate closed: separate staging authorization required');prepare(process.env.C01_E2E_CONFIG_FILE);console.log('Snapshot prepared; staging transport disabled.');}
  catch{console.error('C01 preparation refused; protected configuration or execution gate.');process.exitCode=1;}
}
module.exports={prepare};
