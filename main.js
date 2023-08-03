const path = require('path')
const os = require('os')
const { spawn } = require('child_process');
const { exec, fork } = require("child_process");
const { WebSocket } = require('ws')

class localdb{
  constructor (polyDBPath){
    // start the database process as a child process and attach to it
    switch (os.platform()) {
        case 'win32':
            this.db = exec(path.join(polyDBPath,'polygonDB.exe'));
            break;
        case 'linux':
            this.db = spawn(path.join(polyDBPath,'polygonDB'));
            break;
        case 'darwin':
            this.db = spawn(path.join(polyDBPath,'polygonDB'));
            break;
        default:
            throw new Error('Unsupported platform: ' + os.platform());
        break;
    }
    
  }
    getversion = async function(){
        const db = this.db
        return new Promise(function (resolve, reject) {
            db.stdin.end(`{"action":"version"}\n`)
            db.stdout.on('data', (data) => {
            var output = data.toString().split("\n")[0]
            // remove the listener
            db.stdout.removeAllListeners('data')
                resolve(output)
            });
        })
        }
    remove = async function(table,row){
        var db = this.db
        return new Promise(function (resolve, reject) {
            db.stdin.end(`{"dbname":"${table}","action":"remove","row":${row}}\n`)
            db.stdout.on('data', (data) => {
            var output = data.toString().split("\n")[0]
                resolve(output)
                // remove the listener
                db.stdout.removeAllListeners('data')
            });
        })
    }
}

class remotedb{
    constructor (con,key){
      this.con = con
      this.ws = new WebSocket("ws://"+con+"/ws");
      this.key = key
    }
  open = async function() {
    var ws = this.ws
    return new Promise((resolve, reject) => {
      ws.on('open', () => {
        resolve('READY!')
      })
      ws.on('error', (err) => {
        console.log(err)
        reject('Can not connect to server!')
      })
    })  
  }
  
  record = async function(table,row,loc,data){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      var location = "rows"
      if(row == "schema"){
        location = "schema"
      } else if(row == "all"){
        location = "rows"
      }
      else{
      if(loc == undefined){
        location = "rows."+row
      }else{
      location = "rows."+row+"."+loc
      }
      }
      ws.send(JSON.stringify({action: "record",password: key,dbname: table,location: location,value: data}))
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
    });
    ws.on('error', async function error(msg) {
      reject(msg)
    });
  })
  }
  remove = async function(table,row,loc){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      var location = "rows"
      if(row == "schema"){
        location = "schema"
      } else if(row == "all"){
        location = "rows"
      }
      else{
      if(loc == undefined){
        location = "rows."+row
      }else{
      location = "rows."+row+"."+loc
      }
      }
      ws.send(JSON.stringify({action: "record",password: key,dbname: table,location: location,value: null}))
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
    });
  })
  }
  getschema = async function(table){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      ws.send(JSON.stringify({action: "retrieve",password: key,dbname: table,location: "schema"}))
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
    });
  })
  }
  retrieve = async function(table,row,loc){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      var location ="rows"
      if(row == undefined){
        location = "rows"
      }
      else if(loc == undefined){
        location = "rows."+row
      }
      else{
        location = "rows."+row+"."+loc
      }
      ws.send(JSON.stringify({action: "retrieve",password: key,dbname: table,location: location}))
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
    });
  })
  }
  search = async function(table,col,val,index){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      if(index == undefined){
        index = true
      }
      const query = col+":"+val
      if(index == true){
        ws.send(JSON.stringify({action: "index",password: key,dbname: table,location: "rows",value: query}))
      }else if(index == false){
      ws.send(JSON.stringify({action: "search",password: key,dbname: table,location: "rows",value: query}))
      }else{
        reject("ERROR: Index must be true or false")
      }
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
      });
  })
  }
  append = async function(table,data){
    var ws = this.ws
    var key = this.key
    return new Promise(function (resolve, reject) {
      ws.send(JSON.stringify({action: "append",password: key,dbname: table,location: "rows",value: data}))
      ws.on('message', async function message(msg) {
      var data = JSON.parse(msg)
      if(data.error){
        reject(data.error)
      }else{
      resolve(data)
      }
    });
  })
  }
  close = function (){
    this.ws.close()
  }
  }

module.exports = {localdb,remotedb}