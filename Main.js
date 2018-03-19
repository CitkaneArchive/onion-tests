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

global.Production = process.env.NODE_ENV !== 'development';
global.RootDir = __dirname;
global.Rebooting = false;
global.Wsockets = {};
global.Ts = function(){
    return '['+new Date().toLocaleString()+'] ';
};

const path = require("path");
const fs = require('fs');
const onion = require(path.join(RootDir,"server/Onion.js"));
const servers = require(path.join(RootDir,"server/Servers.js"));
const Data = require(path.join(RootDir,"server/Data.js"));


global.Services = {
    public:{
        server:true,
        path:path.join(RootDir,"tor/public_torrc"),
        SocksPort:"9060",
        HttpPort:"9070",
        WebSocketPort:"9080",
        torrc:
`HiddenServiceDir `+path.join(RootDir,'tor/keys/public')+`
HiddenServicePort 80 127.0.0.1:9070
HiddenServicePort 9080 127.0.0.1:9080
LongLivedPorts 9080
DataDirectory `+path.join(RootDir,'tor/data/public')+`
SocksPort 127.0.0.1:9060 OnionTrafficOnly`
    },
    socketServer:{
        server:true,
        path:path.join(RootDir,"tor/socketServer_torrc"),
        //SocksPort:"9061",
        WebSocketPort:"9071",
        torrc:
`HiddenServiceDir `+path.join(RootDir,'tor/keys/socketServer')+`
HiddenServicePort 9071 127.0.0.1:9071
LongLivedPorts 9071
SocksPort 0
HeartbeatPeriod 30 minutes
DataDirectory `+path.join(RootDir,'tor/data/socketServer')+`
NumEntryGuards 10`
    },
    socketClient:{
        path:path.join(RootDir,"tor/socketClient_torrc"),
        SocksPort:"9062",
        torrc:
`DataDirectory `+path.join(RootDir,'tor/data/socketClient')+`
SocksPort 127.0.0.1:9062 OnionTrafficOnly
HeartbeatPeriod 30 minutes
NumEntryGuards 10`
    },
    httpServer:{
        server:true,
        path:path.join(RootDir,"tor/httpServer_torrc"),
        //SocksPort:"9063",
        HttpPort:"9073",
        torrc:
`HiddenServiceDir `+path.join(RootDir,'tor/keys/httpServer')+`
HiddenServicePort 80 127.0.0.1:9073
LongLivedPorts 80
SocksPort 0
HeartbeatPeriod 30 minutes
DataDirectory `+path.join(RootDir,'tor/data/httpServer')+`
NumEntryGuards 10`
    },
    httpClient:{
        path:path.join(RootDir,"tor/httpClient_torrc"),
        SocksPort:"9064",
        torrc:
`DataDirectory `+path.join(RootDir,'tor/data/httpClient')+`
SocksPort 127.0.0.1:9064 OnionTrafficOnly
HeartbeatPeriod 30 minutes
NumEntryGuards 10`
    },
    grpcServer:{
        server:true,
        path:path.join(RootDir,"tor/grpcServer_torrc"),
        GrpcPort:"9074",
        torrc:
        `HiddenServiceDir `+path.join(RootDir,'tor/keys/grpcServer')+`
HiddenServicePort 9074 127.0.0.1:9074
LongLivedPorts 9074
SocksPort 0
HeartbeatPeriod 30 minutes
DataDirectory `+path.join(RootDir,'tor/data/grpcServer')+`
NumEntryGuards 10`
    },
    grpcClient:{
        path:path.join(RootDir,"tor/grpcClient_torrc"),
        HTTPTunnelPort:"9065",
        torrc:
        `DataDirectory `+path.join(RootDir,'tor/data/grpcClient')+`
HTTPTunnelPort 127.0.0.1:9065
SocksPort 0
HeartbeatPeriod 30 minutes
NumEntryGuards 10`
    }
};

if(fs.existsSync(path.join(RootDir,'src/service.json'))){
    fs.unlinkSync(path.join(RootDir,'src/service.json'));
}
fs.writeFileSync(path.join(RootDir,'process.env'),'http_proxy=http://127.0.0.1:'+Services.grpcClient.HTTPTunnelPort,{encoding:'utf8'});
require('dotenv').config({path:path.join(RootDir,'process.env')});

//start the onion services and clients
onion.startOnion().then(()=>{
    //create the onion service http/websocket servers
    Object.keys(Services).forEach(key =>{
        if(Services[key].WebSocketPort){
            servers.makeSocket(key);
        }
        if(Services[key].HttpPort){
            servers.makeHttp(key);
        }
        if(Services[key].GrpcPort){
            servers.makeGrpc(key);
        }
    });
},err=>{
    console.error(err);
});
setInterval(()=>{
    Data.write();
},1000*60);
setInterval(()=>{
    onion.rebootClients();
},1000*60*60*2);

