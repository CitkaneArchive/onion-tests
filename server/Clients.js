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

const url = require('url');
const http = require('http');
const SocksProxyAgent = require('socks-proxy-agent');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const grpc = require('grpc');

const cycle_proto = grpc.load(path.join(RootDir,'server/proto/onion.proto')).onion;
const Data = require(path.join(RootDir,"server/Data.js"));

function Clients(){
    this.latency={};
}

Clients.prototype.grpc = function(key,halt){
    if(halt && this.client){
        //this.client.close();
        grpc.closeClient(this.client);
        return;
    }
    this.client = new cycle_proto.Cycle(Services.grpcServer.onion+':'+Services.grpcServer.GrpcPort,grpc.credentials.createInsecure());
    grpc.waitForClientReady(this.client,Infinity,()=>{honey()});
    const honey = ()=>{
        let dateNow = Date.now();
        this.client.DoCycle({date:dateNow.toString()},(err,response)=>{
            if(err){
                if(!Services[key].rebooting) Data.error('grpc',err.message);
            }else{
                const tripTime = Date.now() - dateNow;
                Data.add('grpc',tripTime,response.image.length);
                Data.data.grpc.latency += this.latency.grpc;
                Data.data.grpc.activelatency = this.latency.grpc;
            }
            if(!Services[key].rebooting) {
                honey();
            }
        })
    };
};

Clients.prototype.reqres = function(key,halt){
    if(halt && this.req){
        this.req.destroy();
        return;
    }
    const proxy = 'socks://127.0.0.1:'+Services.httpClient.SocksPort;
    console.log('using proxy server %j', proxy);
    const endpoint = 'http://'+Services.httpServer.onion+'/';
    console.log('attempting to GET %j', endpoint);
    const opts = url.parse(endpoint);
    opts.agent = new SocksProxyAgent(proxy);

    const honey = ()=>{
        const dateNow = Date.now();
        let resTime;
        opts.headers={
            Time:dateNow
        };
        this.req = http.get(opts,(res)=>{
            let buff = [];
            resTime = Date.now()-dateNow;
            res.on('data',chunk=>{
                buff.push(chunk);
            });
            res.on('end',()=>{
                buff = Buffer.concat(buff);
                const tripTime = Date.now() - dateNow;
                Data.add('reqres',tripTime,buff.length);
                Data.data.reqres.latency += this.latency.reqres;
                Data.data.reqres.activelatency = this.latency.reqres;
                honey();
            });

        }).on('error',err=>{
            if(!Services[key].rebooting){
                Data.error('reqres',err.message);
                this.req.destroy();
                opts.agent = new SocksProxyAgent(proxy);
                honey();
            }
        })
    };
    honey();
};

Clients.prototype.ws = function(key,halt){
    if(halt && this.socket){
        this.socket.close();
        return;
    }
    const proxy = 'socks://127.0.0.1:'+Services.socketClient.SocksPort;
    console.log('using proxy server %j', proxy);
    const endpoint = 'ws://'+Services.socketServer.onion+':'+Services.socketServer.WebSocketPort;
    console.log('attempting to connect to WebSocket %j', endpoint);
    let agent = new SocksProxyAgent(proxy);



    const makeSocket = ()=>{
        let dateNow;
        this.socket = new WebSocket(endpoint,null,{agent:agent});
        this.socket.on('error',(err)=>{
            Data.error('socket',err.message);
        });

        this.socket.on('open',()=>{
            dateNow = Date.now();
            this.socket.send(dateNow);
        });

        this.socket.on('message',buff=>{
            const tripTime = Date.now() - dateNow;
            dateNow = Date.now();
            Data.add('socket',tripTime,buff.length);
            Data.data.socket.latency += this.latency.socket;
            Data.data.socket.activelatency = this.latency.socket;
            this.socket.send(dateNow);
        });

        this.socket.on('close',(code,reason)=>{
            if(!Services[key].rebooting){
                agent = new SocksProxyAgent(proxy);
                makeSocket();
            }
        });
    };
    makeSocket();
};

module.exports = new Clients();