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

const fs = require('fs');
const path = require('path');

const downStart = {};

function Data(){
    function metric(){
        return {
            completed:0,
            errors:0,
            moved:0,
            triptime:0,
            activetime:0,
            downtime:0,
            latency:0,
            activelatency:0
        }
    }
    if(fs.existsSync(path.join(RootDir,'server/data.json'))){
        this.data = require(path.join(RootDir,'server/data.json'));
    }else{
        this.data = {
            socket:new metric(),
            reqres:new metric(),
            grpc:new metric()
        };
        this.write();
    }
    if(fs.existsSync(path.join(RootDir,'server/errors.json'))){
        this.errors = require(path.join(RootDir,'server/errors.json'));
    }else{
        this.errors = {};
    }

    this.tor = {}
}
Data.prototype.write = function(){
    const json = JSON.stringify(this.data,null,'\t');
    const err = JSON.stringify(this.errors,null,'\t');
    fs.writeFileSync(path.join(RootDir,'server/data.json'),json);
    fs.writeFileSync(path.join(RootDir,'server/errors.json'),err);
};
Data.prototype.add = function(key,time,size){
    this.data[key].moved += size;
    this.data[key].triptime += time;
    this.data[key].activetime = time;
    this.data[key].completed ++;
    if(downStart[key]){
        this.data[key].downtime+=Date.now()-downStart[key];
    }
    downStart[key] = false;
};

Data.prototype.error = function(key,err){
    if(!this.errors[key])this.errors[key]=[];
    if(!downStart[key]) downStart[key] = Date.now();
    const string = Ts()+err;
    this.errors[key].unshift(string);
    if(this.errors[key].length > 100) this.errors[key].pop();
    this.data[key].errors++;
    console.log(key,string);
};

Data.prototype.torLog = function(key,mess){
    if(!this.tor[key])this.tor[key]=[];
    mess.split(/\r?\n/).forEach(data=>{
        if(!data.length) return;
        data = data.split('[');
        data = data.length > 1?'['+data[1]:data[0];
        data = data.trim();
        const string = Ts()+data;
        this.tor[key].unshift(string);
        if(this.tor[key].length > 100) this.tor[key].pop();
        console.log(key,string);
    })
};

module.exports = new Data();