import * as XLSX from 'xlsx'
import * as _ from 'lodash'
import * as fs from 'fs';
import axios from 'axios'
import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/Either'
import {flow} from 'fp-ts/lib/function'
import { diff } from 'json-diff-ts';

let apiTemplate={
    'compare_get':{
                'nonbiz':'compare_get',
                'biz':'biz_compare_get',
                'param':'?prodId=prodIdReplace',
                'body':{
                }
    },
    'compare_post':{
                'nonbiz':'compare_post',
                'biz':'biz_compare_post',
                'param':'',
                'body':{
                    'email': 'mailReplace',
                    'userAccount':'accountReplace',
                    'address': 'mailReplace'
                }
    },
    'compare_request':{
                'nonbiz':'compare_request',
                'biz':'biz_compare_request',
                'param':'',
                'body':{
                    'email': 'mailReplace',
                    'userAccount':'accountReplace'
                }
    },
}

class Api{    
    public  get=(hostName:string,apiName:string,para:string):TE.TaskEither<Error,string>=>
        pipe(
            TE.tryCatch(
                ()=>axios.get(hostName+apiName+para).then((response)=>{
                    return response.data
                }),(error)=>new Error(`${error}`)
            )
        )
    public post=(hostName:string,apiName:string,body:object):TE.TaskEither<Error,string>=>
        pipe(
            TE.tryCatch(
                ()=>axios.post(hostName+apiName,body).then((response)=>{
                    return response.data
                }),(error)=>new Error(`${error}`)
            )
        )
}
const api=new Api(); 
function handleCompareResult(hostName:Array<string>,apiName:Array<string>,apiTempName:string,body:Object):Object{  
         let responseTime: Array<number> = []
         let response: Array<Object> = []
         let apiRequestPara
         let method
         if (Object.keys(apiTemplate[apiTempName].body).length === 0) {
             apiRequestPara = apiTemplate[apiTempName].param
             Object.keys(body).forEach((key: string) => {
                 apiRequestPara = apiRequestPara.replaceAll(key, body[key])
             })
             method = api.get
         } else {
             let apiRequestBody = apiTemplate[apiTempName].body
             let apiRequestBodyString = JSON.stringify(apiRequestBody)
             Object.keys(body).forEach((key: string) => {
                 apiRequestBodyString = apiRequestBodyString.replace(new RegExp(key, 'g'), body[key])
             })
             // console.log(apiRequestBodyString);
             apiRequestPara = JSON.parse(apiRequestBodyString)
             method = api.post
         }
         return(async () => {
             for (var i = 0; i < 2; i++) {
                 const start = Date.now()
                 await method(hostName[i], apiName[i], apiRequestPara)().then(
                     flow(
                         E.match(
                             (e) => {
                                 response.push(e!)
                                //  console.error(e)
                             },
                             (right) => {
                                 response.push(right!)
                                //  console.log(response);
                             }
                         )
                     )
                 )
                 const finish = Date.now()
                 const time = (finish - start) / 1000
                 responseTime.push(time)
             }
         })().then(() => {
             const tag = ['1', '2']
             const diffs = diff(response[0], response[1])
             let url, body
             let report={}; 
             for (var i = 0; i < 2; i++) {
                 if (Object.keys(apiTemplate[apiTempName].body).length === 0) {
                     url = hostName[i] + apiName[i] + apiRequestPara
                     body = {}
                 } else {
                     url = hostName[i] + apiName[i]
                     body = apiRequestPara
                 }
                 report['url_' + tag[i]] = url
                 report['responseTime_' + tag[i]] = responseTime[i]
                 report['response_' + tag[i]] = response[i]
             }
             report['body'] = body
             report['diff'] = diffs
             // console.log(report);
             // reports.push(report);
             // console.log(reports);
            return report;
         })
    // .then(()=>{return report})
}
    
// read query data from csv
const apiList=['compare_get','compare_post','compare_request']  //test api list
const csv = fs.readFileSync( './res/input.csv','utf8');
const json=csvJSON(csv);
console.log('input csv: ',json);
const inputHeader = ["host_local", "host_dev", "api_local", "api_dev"]
const inputHeaderApiType = ["api_local", "api_dev"]
for(const testName of apiList){
    let inputSource:Array<object>=[]
    var reports :Array<Object>=[];
    for(const o of json){
        let inputQuery=JSON.parse(JSON.stringify(o));
        let inputRequestData={}
        
        Object.keys(o).forEach((key: string) => {
            if(!inputHeader.includes(key)){            
                delete inputQuery[key]
                inputRequestData[key]=o[key]!=null?o[key]:""
            }
            if(inputHeaderApiType.includes(key)){       
                inputQuery[key]=apiTemplate[testName][o[key]]
            }
        })
        if(!(Object.keys(inputQuery).length===0)){
            inputQuery['api_name']=testName
            inputQuery['requestData']=inputRequestData
            inputSource.push(inputQuery)
        }
    }
    console.log('input query data: ',inputSource)
    
    // start api test for query data from csv
    for await(const o of inputSource){
        let res=JSON.parse(JSON.stringify(await handleCompareResult([o.host_dev,o.host_local],[o.api_dev,o.api_local],o.api_name,o.requestData)))
        // console.log(res);
        reports.push(res);
    }
    console.log('api test result: ',reports);
    
    // write test_report to xlsx    
    const headerOutput = ["body", "url_1", "responseTime_1", "response_1", "url_2", "responseTime_2", "response_2","diff"]
    let th='';
    for(const h of headerOutput){
        th+= '<th>'+h+'</th>'
    }
        let table = '<h1>'+testName+'</h1></br>'+
        '<table border="1">' +
            '<thead>' +
                '<tr>' +th
                '</tr>' +
            '</thead>' +
            '<tbody>';

    for(const r of reports) {
    table += '<tr>'
        for(const h of headerOutput){
            table += '<td>' + JSON.stringify(r[h]) + '</td>';
        }
    table += '</tr>'
    }
    table = table+'</tbody></table>';

    // Your table is ready ! You can deal with it
    console.log('output html',table);
    fs.writeFile('res/optput_'+testName+'.html', table, function (err) {
        if (err)
            console.log(err);
        else
            console.log('write html complete.');
    });
}


// let source=[
//     {
//         'host_local':'http://localhost:8000/api/v1/',
//         'host_dev':'http://localhost:8000/api/v1/',
//         'api_local':'compare_get',
//         'api_dev':'biz_compare_get',
//         'api_name':'compare_get',
//         'requestData':{
//             'prodIdReplace': '987'
//         }
//     },{
//         'host_local':'http://localhost:8000/api/v1/',
//         'host_dev':'http://localhost:8000/api/v1/',
//         'api_local':'compare_post',
//         'api_dev':'biz_compare_post',

//         'api_name':'compare_post',
//         'requestData':{
//             'mailReplace': 'alice@gmail.com',
//             'accountReplace':'alice'
//         }
//     }
// ];
// for await(const o of source){
//     let res=JSON.parse(JSON.stringify(await handleCompareResult([o.host_dev,o.host_local],[o.api_dev,o.api_local],o.api_name,o.requestData)))
//     // console.log(res);
//     reports.push(res);
// }
// console.log(reports);
// const header = ["body", "url_1", "responseTime_1", "response_1", "url_2", "responseTime_2", "response_2","diff"]

// var wb = XLSX.utils.book_new();
// var ws = XLSX.utils.json_to_sheet(reports,{header:header});
// XLSX.utils.book_append_sheet(wb, ws, 'Test');
// XLSX.writeFile(wb, './res/file.xlsx');
/////////////////////////////////////////////////////////////////
// let requestPara={
//     'prodIdReplace': '987'
// }
// handleCompareResult(['http://localhost:8000/api/v1/','http://localhost:8000/api/v1/'],['compare_get','biz_compare_get'],'compare_get',requestPara);

      
// let requestBody={
//                 'mailReplace': 'alice@gmail.com',
//                 'accountReplace':'alice'
//     }
// handleCompareResult(['http://localhost:8000/api/v1/','http://localhost:8000/api/v1/'],['compare_post','biz_compare_post'],'compare_post',requestBody);



function csvJSON(text, quoteChar = '"', delimiter = ',') {
    var rows=text.split("\n");
    var headers=rows[0].split(",");
    const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, 'gs');  
    const match = line => [...line.matchAll(regex)]
      .map(m => m[2]) 
      .slice(0, -1);   
    var lines = text.split('\n');
    const heads = headers ?? match(lines.shift());
    lines = lines.slice(1);    
    return lines.map(line => {
      return match(line).reduce((acc, cur, i) => {
        // replace blank matches with `null`
        const val = cur.length <= 0 ? null : Number(cur) || cur;
        const key = heads[i] ?? `{i}`;
        return { ...acc, [key]: val };
      }, {});
    });
  }

  // to do
  // edit code of "apiTemplate" for each api => to match param & body(key to match input.csv)
  // edit code of "apiList" for each api name ==> to match apiTemplate[key]
  // edit input.csv

  // edit code to write test_report to xlsx
