const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/lib/rental-dates.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}};vm.runInNewContext(compiled,context);
const {koreaToday,monthDays,moveMonth,rentalDays,validateRental}=context.exports;
const input={name:'테스트',cohort:'7',start:'2026-11-12',end:'2026-11-14',purpose:''};
test('Korean date uses midnight boundary, independent of UTC date',()=>{
 assert.equal(koreaToday(new Date('2026-11-11T15:01:00Z')),'2026-11-12');
 assert.equal(koreaToday(new Date('2026-11-11T14:59:00Z')),'2026-11-11');
});
test('calendar handles leap years and month/year boundaries',()=>{
 assert.equal(monthDays('2028-02').filter(Boolean).length,29);
 assert.equal(monthDays('2027-02').filter(Boolean).length,28);
 assert.equal(monthDays('2026-11')[0],'2026-11-01');
 assert.equal(moveMonth('2026-12',1),'2027-01');
 assert.equal(moveMonth('2027-01',-1),'2026-12');
});
test('inclusive range allows same-day return',()=>{
 assert.equal(rentalDays('2026-11-12','2026-11-12'),1);
 assert.equal(rentalDays('2026-12-31','2027-01-02'),3);
 assert.equal(validateRental({...input,end:input.start},'2026-11-12'),null);
});
test('rejects missing, impossible, past and reversed dates',()=>{
 for(const patch of [{start:''},{end:''},{start:'2026-02-30'},{start:'2026-11-11'},{end:'2026-11-10'}]){
  assert.ok(validateRental({...input,...patch},'2026-11-12'));
 }
});
test('rejects occupied rental dates, allows day after return',()=>{
 assert.ok(validateRental(input,'2026-11-12','2026-11-12'));
 assert.equal(validateRental({...input,start:'2026-11-13'},'2026-11-12','2026-11-12'),null);
});
test('name and cohort are required; purpose is optional',()=>{
 assert.equal(validateRental(input,'2026-11-12'),null);
 for(const patch of [{name:'  '},{cohort:''},{cohort:'0'},{cohort:'7기'},{cohort:'1.5'},{cohort:'100'},{purpose:'a'.repeat(201)}]){
  assert.ok(validateRental({...input,...patch},'2026-11-12'));
 }
});
