const {REF,BASE}=require('./guard.cjs');
const PREFIX='sb-'+REF+'-auth-token';
function decodeCookies(cookies) {
  if(!Array.isArray(cookies)||!cookies.length||cookies.length>8)throw Error('Bounded auth cookies required');
  const names=new Set();
  for(const c of cookies)if(!c||!new RegExp('^'+PREFIX+'(?:\\.\\d+)?$').test(c.name)||typeof c.value!=='string'||!c.value||c.value.length>16000||names.has(c.name))throw Error('Invalid auth cookie fixture');else names.add(c.name);
  if(cookies.length===1&&!([PREFIX,PREFIX+'.0'].includes(cookies[0].name)))throw Error('Single auth chunk must be zero');
  const ordered=[...cookies].sort((a,b)=>Number(a.name.split('.').pop())-Number(b.name.split('.').pop()));
  if(cookies.length>1&&ordered.some((c,i)=>c.name!==PREFIX+'.'+i))throw Error('Auth cookie chunks must be contiguous');
  let raw=ordered.map(c=>c.value).join('');
  if(raw.startsWith('base64-'))raw=Buffer.from(raw.slice(7),'base64url').toString();
  const session=JSON.parse(raw),claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url').toString());
  return {session,claims};
}
function expiredFixture(cookies,ownerId,now=Math.floor(Date.now()/1000)) {
  const {session,claims}=decodeCookies(cookies);
  if(claims.sub!==ownerId||claims.iss!=='https://'+REF+'.supabase.co/auth/v1'||!Number.isFinite(claims.exp)||claims.exp>=now||typeof session.refresh_token!=='string'||!session.refresh_token)throw Error('Expired owner session fixture required');
  // Shape/claims only: genuine signed-session provenance is a separate preflight requirement.
  return cookies.map(c=>({name:c.name,value:c.value,url:BASE,httpOnly:true,sameSite:'Lax',secure:false}));
}
module.exports={PREFIX,decodeCookies,expiredFixture};
