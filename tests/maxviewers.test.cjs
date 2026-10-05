// Run with: node --test tests/maxviewers.test.cjs
// Execute the full source and shipped bundle with DOM/crypto shims; no network calls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const test=require('node:test'),path=require('node:path');
function run(file,url){
 const nodes={};let encoded;
 function element(tag){return {tag,style:{},appendChild(c){if(c.id)nodes[c.id]=c},removeChild(){},addEventListener(){},select(){},remove(){}}}
 const body=element('body');nodes.body=body;
 const sandbox={document:{body,documentElement:{},createElement:element,getElementById(id){return nodes[id]},execCommand(){}},window:{location:{pathname:'/'},innerWidth:1000,innerHeight:1000},CryptoJS:{AES:{encrypt(input){encoded=input;return {toString(){return 'encoded'}}},decrypt(){return ''}}},setTimeout(){},console:{log(){},warn(){},error(){},info(){},debug(){},trace(){}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{timeout:2000});nodes.urlInpput.value=url;sandbox.process({pageX:1,pageY:1});return encoded;
}

const cases = [
 ['first long option','https://vdo.ninja/?maxviewers=2&push=demo','2',false],
 ['later long option','https://vdo.ninja/?push=demo&maxviewers=3','3',false],
 ['zero limit','https://vdo.ninja/?push=demo&maxviewers=0','0',false],
 ['empty long option','https://vdo.ninja/?push=demo&maxviewers=','',false],
 ['existing clean option','https://vdo.ninja/?push=demo&clean&maxviewers=4','4',true],
 ['existing cleanoutput option','https://vdo.ninja/?maxviewers=5&cleanoutput=1','5',true],
 ['short option unchanged','https://vdo.ninja/?push=demo&mv=2','2',false],
 ['no viewer option','https://vdo.ninja/?push=demo',null,false],
 ['cleanoutput only','https://vdo.ninja/?push=demo&cleanoutput=1',null,true],
 ['other aliases retained','https://vdo.ninja/?view=demo&framerate=30&maxviewers=6','6',false],
];
for(const file of ['main.js','obfuscated.js']) for(const [name,input,limit,clean] of cases) {
 test(file+': '+name,()=>{
  const root=process.env.INVITE_SOURCE_DIR||path.join(__dirname,'..');
  const output=run(path.join(root,file),input);
  const params=new URL('https://'+output).searchParams;
  assert.equal(params.get('mv'),limit);
  assert.equal(params.has('maxviewers'),false);
  assert.equal(params.has('clean'),clean);
  if(name==='other aliases retained'){assert.equal(params.get('v'),'demo');assert.equal(params.get('fr'),'30');}
  else if(params.has('push'))assert.equal(params.get('push'),'demo');
 });
}
