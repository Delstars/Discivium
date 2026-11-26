import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSession, validateSnapshot, validateAcknowledgement } from './apiClient';
const user={id:2,username:'student',name:'Alex',role:'student'};
test('session rejects incomplete or malformed success',()=>{
  assert.throws(()=>validateSession({ok:true}));
  assert.throws(()=>validateSession({authenticated:true,user,csrf:null}));
  assert.equal(validateSession({authenticated:false,user:null,csrf:null}).authenticated,false);
  assert.equal(validateSession({authenticated:true,user,csrf:'token'}).user?.id,2);
});
test('role snapshot rejects missing data',()=>{
  assert.throws(()=>validateSnapshot({user,csrf:'token',semester:'Fall 2026',demo:true,notifications:[]}));
  assert.equal(validateSnapshot({user,csrf:'token',semester:'Fall 2026',demo:true,notifications:[],courses:[],timetable:[],catalogue:[],finance:[],requests:[],record:{},attendance:{},advising:{}}).user.role,'student');
});
test('commands require explicit acknowledgement',()=>{
  for(const value of [null,{},[],{ok:false},{ok:'true'}]) assert.throws(()=>validateAcknowledgement(value));
  assert.deepEqual(validateAcknowledgement({ok:true}),{ok:true});
});
