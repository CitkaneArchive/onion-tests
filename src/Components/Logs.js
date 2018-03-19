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

import React, { Component } from 'react';

class Log extends Component{
    constructor(props) {
        super(props);

        this.state = {
            log:[],
        };
        const {setter,type,id} = this.props;
        setter(type+'_'+id,(data)=>{
            this.setState({log:data});
        });
    }

    componentWillReceiveProps(nextProps){
        const {setter,type,id} = nextProps;
        setter(type+'_'+id,(data)=>{
            this.setState({log:data});
        });
    }
    componentWillUnmount(){
        const {setter,type,id} = this.props;
        setter(type+'_'+id,(data)=>{
            return;
        });
    }
    render(){
        const {log} = this.state;
        return (
            <div className='pre'>
                <pre>{
                    log.map((line,i)=>{
                        return <div key={i}>{line}</div>
                    })
                }</pre>
            </div>
        );
    }
}

export default Log;