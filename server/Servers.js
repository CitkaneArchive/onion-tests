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

const express = require('express');
const WebSocket = require('ws');
const child = require("child_process");
const path = require("path");
const fs = require('fs');
const grpc = require('grpc');

const cycle_proto = grpc.load(path.join(RootDir,'server/proto/onion.proto')).onion;
const webdata = require(path.join(RootDir,'server/WebLogic.js'));
const clients = require(path.join(RootDir,'server/Clients.js'));

const image = fs.readFileSync(path.join(RootDir,'public/honeybadger.jpg'));

console.log(image.length);

function Servers(){}

Servers.prototype.makeGrpc = function(key){


    function DoCycle(call,callback){
        clients.latency.grpc = Date.now()-call.request.date;
        callback(null,{image:image});
    }
    const server = new grpc.Server();
    server.addService(cycle_proto.Cycle.service,{DoCycle:DoCycle});
    server.bind('127.0.0.1:'+Services[key].GrpcPort, grpc.ServerCredentials.createInsecure());
    server.start();
};

Servers.prototype.makeSocket = function(key){
    Wsockets[key] = new WebSocket.Server({
        port:Services[key].WebSocketPort,
        host:'localhost'
    });
    Wsockets[key].on('connection', socket => {

        if(key === 'socketServer'){
            socket.on('message',(data)=>{
                clients.latency.socket = Date.now()-data;
                socket.send(image);
            });
        }
        if(key === 'public'){
            webdata(socket);
        }
    });
};

Servers.prototype.makeWebsite = function(){
    if(Production){
        const dir = path.join(RootDir,'build');
        const app = express();
        app.use(express.static(dir));
        app.listen(Services.public.HttpPort);
    }else{
        const dev = child.spawn('node', [path.join(RootDir,'node_modules/.bin/react-scripts'),'start'],{
            cwd:RootDir
        });
        dev.stdout.on("data",(data)=>{
            console.log(data.toString());
        })
    }
};

Servers.prototype.makeHttp = function(key){
    if(key === 'public'){
        this.makeWebsite();
    }else{
        const dir = path.join(RootDir,'public');
        const app = express();
        app.get('/', function (req, res) {
            clients.latency.reqres = Date.now()-req.get('time');
            res.send(image);
        });
        app.listen(Services[key].HttpPort);
    }
};

module.exports = new Servers();