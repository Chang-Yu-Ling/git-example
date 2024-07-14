import * as XLSX from 'xlsx'
import * as _ from 'lodash'
import * as fs from 'fs';
import axios from 'axios'
import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/Either'
import {flow} from 'fp-ts/lib/function'
import { diff } from 'json-diff-ts';


const dbInit_list=['a b c(6)','d e time'] // db initial script

const sch_r=['aReplace','bReplace','cReplace'] //replace key word
const sch_r_dir=['aReplace','bReplace']  //replace key word
const sch_r_undirMap={
    'time':'20',
    'int': '10'
} //replace key word map
var sch="aReplace aReplace bReplace bReplace cReplace cReplace dReplace dReplace uiuotrtertrt"

var check_list :Array<Object>=[];

for(const dbInit of dbInit_list){
    let i_R=dbInit.split(' ');
    var new_sch=sch;
    for(var j=0;j<sch_r.length;j++){     
        if(sch_r_dir.includes(sch_r[j]))   
            new_sch = new_sch.replace(new RegExp(sch_r[j], 'g'), i_R[j])
        else{ 
            let sub=i_R[j].split('(');
            console.log(sub)
            if( Object.keys(sch_r_undirMap).includes(sub[0])){
                new_sch = new_sch.replace(new RegExp(sch_r[j], 'g'), sub[0])
                new_sch = new_sch.replace(new RegExp('dReplace', 'g'), sch_r_undirMap[sub[0]])
            }else{
                new_sch = new_sch.replace(new RegExp(sch_r[j], 'g'), sub[0])
                new_sch = new_sch.replace(new RegExp('dReplace', 'g'), sub[1].substring(0,sub[1].length-1))
            }
        }
    }
    check_list.push(new_sch)
}

console.log(check_list)
for(const line of check_list){
    console.log(line)
}
