const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const supabase=require('@supabase/supabase-js');
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/supabase.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function load(env){
 const imports={'react-native-url-polyfill/auto':{},'@react-native-async-storage/async-storage':{},'@supabase/supabase-js':supabase,'react-native':{Platform:{OS:'web'}}};
 const context={exports:{},process:{env},console:{warn:()=>{}},WebSocket:globalThis.WebSocket,require:name=>{if(!(name in imports))throw Error(name);return imports[name]}};
 vm.runInNewContext(code,context);
 return context.exports;
}
test('missing, empty or whitespace Supabase settings can initialize the existing demo mode',async()=>{
 for(const value of [undefined,'','   ']){
  const result=load({EXPO_PUBLIC_SUPABASE_URL:value,EXPO_PUBLIC_SUPABASE_ANON_KEY:value});
  assert.equal(result.MODO_DEMO,true);
  assert.ok(result.supabase);
  await result.supabase.auth.stopAutoRefresh();
 }
});
test('configured operational authentication stays enabled',async()=>{
 const result=load({EXPO_PUBLIC_SUPABASE_URL:'https://example.supabase.co',EXPO_PUBLIC_SUPABASE_ANON_KEY:'public-test-fixture'});
 assert.equal(result.MODO_DEMO,false);
 await result.supabase.auth.stopAutoRefresh();
});
