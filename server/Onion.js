/*
 * Copyright (c) 2018. Michael Jonker (http://openpoint.ie)
 *
 * This file is part of Onion-tests.
 *
 * Onion-tests is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 *
 * Onion-tests is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with onion-tests. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const child = require('child_process');
const fs = require('fs');
const path = require("path");
const clients = require(path.join(RootDir,"server/Clients.js"));
const Data = require(path.join(RootDir,"server/Data.js"));

function Onion(){}

Onion.prototype.startOnion = function(){
    const list = Object.keys(Services).filter((key)=>{
        return Services[key].server;
    });
    return new Promise((resolve,reject)=>{
        let next = ()=>{
            const key = list.shift();
            this.makeService(key).then(()=>{
                Services[key].onion = fs.readFileSync(path.join(RootDir,"tor/keys",key,"hostname"),'utf8').replace(/(\r\n|\n|\r)/gm,"");
                if(key === 'public') console.log(key+": Site is available at http://"+Services[key].onion);
                if(!list.length){
                    this.onionReady();
                    resolve(true);
                }else{
                    next();
                }
            },err=>{
                this.stopOnion();
                reject(err);
            })
        };
        next();
    })
};

Onion.prototype.makeService = function(key){
    console.log('\nStarting '+key+'\n');

    const def = Services[key];
    if(!fs.existsSync(def.path)){
        fs.writeFileSync(def.path,def.torrc);
    }
    Services[key].proc = child.spawn("tor",["-f",def.path/*,"--SocksPort",def.SocksPort*/],{
        cwd:RootDir
    });

    return new Promise((resolve, reject)=>{
        Services[key].proc.stdout.on('data',(data)=>{

            Data.torLog(key,data.toString());

            if(data.toString().indexOf("Bootstrapped 100%: Done")!== -1){
                resolve(true);
            }
            if(data.toString().indexOf("[error]")!== -1){
                reject(data.toString());
            }
            if(data.toString().indexOf("Catching signal TERM, exiting cleanly")!== -1){
                setTimeout(()=>{
                    this.rebootClients(key);
                })
            }
        });
    });
};

Onion.prototype.onionReady = function(){
    console.log("All onion Services loaded");
    const json = {
        onion:Services.public.onion,
        socketPort:Services.public.WebSocketPort,
        localPort:Services.public.HttpPort,
        torrc:{}
    };
    Object.keys(Services).forEach(key=>{
       json.torrc[key]=Services[key].torrc;
    });
    fs.writeFileSync(path.join(RootDir,'src/service.json'),JSON.stringify(json));

    this.makeService("socketClient").then(()=>{
        console.log("socketClient: Waiting 30 seconds for circuit to establish............");
        setTimeout(()=>{
            Data.data.started = Date.now();
            clients.ws("socketClient");
        },30000)
    },err=>{
        console.error(err);
        this.stopOnion();
    });

    this.makeService("httpClient").then(()=>{
        console.log("httpClient: Waiting 30 seconds for circuit to establish............");
        setTimeout(()=>{
            Data.data.started = Date.now();
            clients.reqres("httpClient");
        },30000)
    },err=>{
        console.error(err);
        this.stopOnion();
    });

    this.makeService("grpcClient").then(()=>{
        console.log("grpcClient: Waiting 30 seconds for circuit to establish............");
        setTimeout(()=>{
            Data.data.started = Date.now();
            clients.grpc("grpcClient");
        },30000)
    },err=>{
        console.error(err);
        this.stopOnion();
    });
};

Onion.prototype.stopOnion = function(){
    Object.keys(Services).forEach(function(key){
        if(Services[key].proc) Services[key].proc.kill();
    })
};

Onion.prototype.rebootClients = function(key){
    if(key){
        this.makeService(key).then(()=>{
            Services[key].rebooting = false;

            if(key==='httpClient'){
                clients.reqres("httpClient");
            }else if(key==='socketClient'){
                clients.ws("socketClient");
            }else if(key==='grpcClient'){
                clients.grpc("grpcClient");
            }

        },err=>{
            console.error(err);
            this.stopOnion();
        });
    }else{
        Object.keys(Services).forEach(function(key){
            if(!Services[key].server) {
                Services[key].rebooting = true;

                if(key==='httpClient'){
                    clients.reqres("httpClient",true)
                }else if(key==='socketClient'){
                    clients.ws("socketClient",true)
                }else if(key==='grpcClient'){
                    clients.grpc("grpcClient",true);
                }

                Services[key].proc.kill();
            }
        })
    }
};

module.exports = new Onion();