const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
function load(file,mocks={}) {
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,Date,Set,console,require:name=>{
   if(name in mocks)return mocks[name];
   if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks);
   return require(name);
 }});return exports;
}
test('demo requires explicit homologation config, never production fallback',()=>{
 const {demoPolicy}=load('src/core/demoPolicy.ts');
 assert.equal(demoPolicy(false,'production',true).blocked,true);
 assert.equal(demoPolicy(false,'homologation',false).blocked,true);
 assert.equal(demoPolicy(false,'homologation',true).demo,true);
 assert.equal(demoPolicy(true,'homologation',true).demo,false);
});
function store() {
 let state;let success=true;let calls=0;
 const hooks=load('src/store/clientes.ts',{
  react:{useMemo:fn=>fn()},'@/hooks/useDiaAtual':{useDiaAtual:()=>''},
  zustand:{create:init=>{const get=()=>state;const set=patch=>{state={...state,...(typeof patch==='function'?patch(state):patch)};};state=init(set,get);const hook=selector=>selector(state);hook.getState=get;hook.setState=set;return hook;}},
  '@/lib/supabase':{MODO_DEMO:false,traduzirErro:e=>String(e)},
  '@/mocks/clientes':{CLIENTES_MOCK:[]},
  '@/utils/whatsapp':{abrirWhatsApp:async()=>true},
  '@/services/clientes':{registrarLembrete:async id=>{calls++;if(!success)throw Error('offline');return {id,ultimo_lembrete_em:'2026-09-27T12:00:00Z'};}}
 });
 return {...hooks,fail:()=>{success=false;},calls:()=>calls};
}
test('opening WhatsApp does not mark sent; failure retains pending confirmation',async()=>{
 const s=store(),client={id:'one',ultimo_lembrete_em:null};
 s.useClientesStore.setState({clientes:[client]});
 await s.useClientesStore.getState().enviarLembrete(client);
 assert.equal(s.calls(),0);assert.equal(s.useClientesStore.getState().clientes[0].ultimo_lembrete_em,null);
 s.fail();await assert.rejects(s.useClientesStore.getState().confirmarLembrete(client),/offline/);
 assert.equal(s.useClientesStore.getState().clientes[0].ultimo_lembrete_em,null);
 assert.equal(s.useClientesStore.getState().lembretesAbertos[0],'one');
});
test('manual confirmation is saved before removing pending reminder',async()=>{
 const s=store(),client={id:'one',ultimo_lembrete_em:null};
 s.useClientesStore.setState({clientes:[client]});
 await s.useClientesStore.getState().enviarLembrete(client);
 await s.useClientesStore.getState().confirmarLembrete(client);
 assert.equal(s.calls(),1);assert.equal(s.useClientesStore.getState().clientes[0].ultimo_lembrete_em,'2026-09-27T12:00:00Z');
 assert.equal(s.useClientesStore.getState().lembretesAbertos.length,0);
});
test('day change recalculates return and yesterday confirmation',()=>{
 const {comPrazo}=store();
 const date1=new Date(2026,8,26,23,59),date2=new Date(2026,8,27,0,1);
 const client={data_retorno:'2026-09-27',ultimo_lembrete_em:date1.toISOString()};
 assert.equal(comPrazo(client,date1).diasRestantes,1);assert.equal(comPrazo(client,date1).avisadaHoje,true);
 assert.equal(comPrazo(client,date2).diasRestantes,0);assert.equal(comPrazo(client,date2).avisadaHoje,false);
});
