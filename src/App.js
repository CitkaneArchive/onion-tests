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

import environ from './service.json';
import React, { Component } from 'react';
import Log from './Components/Logs';
import './App.css';

console.log(environ);

const WebSocket = require('isomorphic-ws');
const numeral = require('numeral');

console.log(window.location.host);

let socketLocation;
if(window.location.host.indexOf('localhost') === 0){
    socketLocation = "ws://localhost:"+environ.socketPort+'/';
}else if(window.location.host === environ.onion){
    socketLocation = "ws://"+environ.onion+':'+environ.socketPort+'/';
}else{
    socketLocation = "ws://"+window.location.host+':'+environ.socketPort+'/';
}



const message = function (id,data){

    const m = {
        id:id,
        data:data
    };
    return JSON.stringify(m);
};
const toData = function(message){
    return JSON.parse(message);
};



class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            socket:{
                completed:0,
                errors:0,
                moved:0,
                triptime:0
            },
            reqres:{
                completed:0,
                errors:0,
                moved:0,
                triptime:0
            },
            tests:['socket','reqres'],
            opt:1
        };
        this.getters = {};
        this.ws = new WebSocket(socketLocation);
        this.ws.onopen = ()=>{
            this.ws.send(message('info'));
            this.ws.send(message('errors'));
            this.ws.send(message('torlog'));
            setInterval(()=>{
                this.ws.send(message('info'));
            },1000);
            setInterval(()=>{
                this.ws.send(message('errors'));
                this.ws.send(message('torlog'));
            },5000);
        };
        this.ws.onerror = (err)=>{
            console.error(err);
        };
        this.ws.onclose = ()=>{
            console.log('Websocket disconnected');
        };
    }
    setter = (name,fn)=>{
        this.getters[name] = fn;
    };
    componentDidMount(){

        this.ws.onmessage = message=>{
            const data = toData(message.data);
            if(data.id === 'info'){
                this.setState(data.data);
            }
            if(data.id === 'torlog'){
                Object.keys(data.data).forEach(key=>{

                    if(key === 'public') return;
                    if(this.getters['torlog_'+key]) this.getters['torlog_'+key](data.data[key]);
                });
            }
            if(data.id === 'errors'){
                Object.keys(data.data).forEach(key=>{
                    if(key === 'public') return;
                    if(this.getters['errors_'+key]) {
                        this.getters['errors_' + key](data.data[key]);
                    }
                });
            }
        };
    };
    render() {
        if(!this.ws.readyState) return null;
        const {tests,opt} = this.state;
        return <div className='container'>
            <div id = 'header'>
                <h1>TOR Onion Transport Showdown</h1>
                <div className = 'sub'>
                    Comparing the performance of various transport protocols over the TOR network.
                </div>
                <p>
                    This test specifically examines connections to an Onion Service by repeatedly transfering a 32kB buffer of an <a target="_blank" href="./honeybadger.jpg">image file</a> from server to client.
                </p>
                <p>
                    The test is designed to give equal opportunity to all scenarios under varying network conditions. More about definitions and methodologies are in the <a href="#footnotes">footnotes</a>.
                </p>
                <p>
                    Code can be examined at <a href = 'https://github.com/citkane/onion-tests' target = '_blank' rel="noopener noreferrer">Github</a>.
                </p>
                <div id='options'>
                    <div className = {opt===1?'button active':'button'} onClick={()=>{
                        this.ws.send(message('errors'));
                        this.ws.send(message('torlog'));
                        this.setState({
                            tests:['socket','reqres'],
                            opt:1
                        });
                    }}>Websockets vs Req-Res</div>
                    <div className = {opt===2?'button active':'button'} onClick={()=>{
                        this.ws.send(message('errors'));
                        this.ws.send(message('torlog'));
                        this.setState({
                            tests:['grpc','reqres'],
                            opt:2
                        });
                    }}>gRPC vs Req-Res</div>
                    <div className = {opt===3?'button active':'button'} onClick={()=>{
                        this.ws.send(message('errors'));
                        this.ws.send(message('torlog'));
                        this.setState({
                            tests:['socket','grpc'],
                            opt:3
                        });
                    }}>Websockets vs gRPC</div>
                </div>
            </div>
            <div className='child first'>
                {tests.map((type, i) => {
                    const completed = this.state[type].completed;//type === 'sockets' ? socket.completed : reqres.completed;
                    const errors = this.state[type].errors;
                    const moved = this.state[type].moved;
                    const triptime = this.state[type].triptime;
                    const activetime = this.state[type].activetime;
                    const downtime = this.state[type].downtime;
                    const latency = this.state[type].latency;
                    const activelatency = this.state[type].activelatency;
                    let title;
                    if(type === 'reqres') title = "Req-Res";
                    if(type === 'socket') title = "WebSockets";
                    if(type === 'grpc') title = "gRPC";
                    let classes = 'info type';
                    classes+=i===0?' left':' right';


                    return <div id={'info_'+type} className={classes} key={i}>
                        <h2 className='title'>{title}</h2>
                        <div className='item'>
                            <span className='label'>UpTime</span>
                            <span className='data'>{numeral(triptime/1000).format('00:00:00')}</span>
                        </div>
                        <div className='item'>
                            <span className='label'>DownTime</span>
                            <span className='data bad'>{numeral(downtime/1000).format('00:00:00')}</span>
                        </div>
                        <div className='item'>
                            <span className='label'>Round trips</span>
                            <span className='data'>{numeral(completed).format('0,0')}</span>
                        </div>
                        <div className='item'>
                            <span className='label'>Errors</span>
                            <span className='data bad'>{numeral(errors).format('0,0')}</span>
                        </div>
                        <div className='item'>
                            <span className='label'>Average trip time</span>
                            <span>
                                <span className='data'>{Math.floor(triptime/completed)}</span><span className='def'>ms</span>
                            </span>
                        </div>
                        <div className='item'>
                            <span className='label'>Active trip time</span>
                            <span>
                                <span className='def'>{activetime}</span><span className='def'>ms</span>
                            </span>
                        </div>
                        <div className='item'>
                            <span className='label'>Average latency</span>
                            <span>
                                <span className='data'>{Math.floor(latency/completed)}</span><span className='def'>ms</span>
                            </span>
                        </div>
                        <div className='item'>
                            <span className='label'>Active latency</span>
                            <span>
                                <span className='def'>{activelatency}</span><span className='def'>ms</span>
                            </span>
                        </div>
                        <div className='item'>
                            <span className='label'>Average speed</span>
                            <span>
                                <span className='data'>{numeral(moved/(triptime/1000)).format('0.00b')}</span><span className='def'>/s</span>
                            </span>
                        </div>
                        <div className='item last'>
                            <span className='label'>Data moved</span>
                            <span className='def'>{numeral(moved).format('0.00b')}</span>
                        </div>
                    </div>
                })}
            </div>
            <div className='child second'>
                {tests.map((type, i) => {
                    let classes = 'logs type';
                    classes+=i===0?' left':' right';
                    let service;
                    let client;
                    if(type === 'reqres'){
                        client = "httpClient";
                        service = "httpServer";
                    }
                    if(type === 'socket'){
                        client = "socketClient";
                        service = "socketServer";
                    }
                    if(type === 'grpc'){
                        client = "grpcClient";
                        service = "grpcServer";
                    }

                    return <div id={'logs_'+type} className={classes} key={i}>

                        <h3>Errors</h3>
                        {type === 'grpc'&&<Log type="errors" id={type} setter={this.setter}/>}
                        {type === 'socket'&&<Log type="errors" id={type} setter={this.setter}/>}
                        {type === 'reqres'&&<Log type="errors" id={type} setter={this.setter}/>}
                        <h3>Tor Client</h3>
                        <div  className = 'pre torrc'>
                            <pre>{environ.torrc[client]}</pre>
                        </div>
                        {type === 'grpc'&&<Log type="torlog" id={client} setter={this.setter}/>}
                        {type === 'socket'&&<Log type="torlog" id={client} setter={this.setter}/>}
                        {type === 'reqres'&&<Log type="torlog" id={client} setter={this.setter}/>}
                        <h3>Onion Service</h3>
                        <div className = 'pre torrc'>
                            <pre>{environ.torrc[service]}</pre>
                        </div>
                        {type === 'grpc'&&<Log type="torlog" id={service} setter={this.setter}/>}
                        {type === 'socket'&&<Log type="torlog" id={service} setter={this.setter}/>}
                        {type === 'reqres'&&<Log type="torlog" id={service} setter={this.setter}/>}


                    </div>

                })}
            </div>
            <div id = 'footnotes'>
                <h2>Footnotes</h2>
                <h3>Methodology</h3>
                <p>Each protocol has two dedicated TOR instances running, a client and a onion service server. Clients connect through their own localhost TOR proxy</p>
                <p>
                    The work cycle consists of the client sending the server a timestamp and the server responding with a 32kB data buffer, which
                    repeats upon completion of the buffer being fully received. Latency is measured on the timestamp from client to server while trip
                    time is the total time, including data transfer.
                </p>
                <p>
                    The connection quality for a circuit can be a lottery, so every two hours all the clients reboot from a TOR OS level and establish new connections.
                </p>
                <h3>UpTime</h3>
                <p>
                    The amount of time that the connection has actively been engaged in transferring data.
                </p>
                <h3>DownTime</h3>
                <p>
                    The amount of time that the connection has spent in error recovery.
                </p>
                <h3>Round Trips</h3>
                <p>
                    The number of cycles (send timestamp, receive data) that have successfully completed.
                </p>
                <h3>Trip Time</h3>
                <p>
                    The time taken for a cycle, including transfer of buffer data.
                </p>
                <h3>Latency</h3>
                <p>
                    The time taken for a timestamp to travel from client to server.
                </p>
            </div>
        </div>;
    }
}

export default App;
