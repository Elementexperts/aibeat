require('./runtime-probe.cjs').probes().then(()=>process.stdout.write('containment probe passed')).catch(()=>{process.stderr.write('containment probe failed');process.exitCode=1;});
