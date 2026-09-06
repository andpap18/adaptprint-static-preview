const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=__dirname;
const handlerPath=path.join(root,'api','quote.php');
const configPath=path.join(root,'deploy','private','adaptprint-quote-config.example.php');
const js=fs.readFileSync(path.join(root,'assets','js','main.js'),'utf8');

assert(fs.existsSync(handlerPath),'missing MyIP PHP quote endpoint');
assert(fs.existsSync(configPath),'missing private configuration template');
const handler=fs.readFileSync(handlerPath,'utf8');
const config=fs.readFileSync(configPath,'utf8');

for(const token of ['REQUEST_METHOD','application/json','HTTP_ORIGIN','hash_equals','honeypot','rate_limit','filter_var','FILTER_VALIDATE_EMAIL','mail(','json_response']){
  assert(handler.includes(token),`endpoint security/delivery contract missing: ${token}`);
}
for(const field of ['name','contact','service','quantity','deadline','file_link','message','service_context','project_context']){
  assert(handler.includes(`'${field}'`),`endpoint field missing: ${field}`);
}
assert(config.includes("'recipient' => 'adaptprintsales@gmail.com'"),'recipient must be configured to Adapt Print sales email');
assert(/location\.hostname===['"]adaptprint\.gr['"]/.test(js),'frontend must use endpoint only on production domain');
assert(js.includes("'/api/quote.php'"),'frontend endpoint path missing');
assert(js.includes("fetch('/api/quote.php'"),'frontend must submit production form via fetch');
console.log('PASS quote endpoint contract');
