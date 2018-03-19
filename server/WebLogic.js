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

const path = require('path');
const Data = require(path.join(RootDir,"server/Data.js"));
const onion = require(path.join(RootDir,"server/Onion.js"))

function webdata(socket){
    socket.on('message',data=>{
        data = JSON.parse(data);
        if(data.id === 'info'){
            socket.send(message('info',Data.data));
        }
        if(data.id === 'errors'){
            socket.send(message('errors',Data.errors));
        }
        if(data.id === 'torlog'){
            socket.send(message('torlog',Data.tor));
        }
        if(data.id === 'reboot'){
            onion.rebootClients();
        }
    });
}

function message(id,data){
    const m = {
        id:id,
        data:data
    };
    return JSON.stringify(m);
}
module.exports = webdata;