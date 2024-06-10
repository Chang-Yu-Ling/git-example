import * as XLSX from 'xlsx'
import * as _ from 'lodash'

import axios from 'axios'
import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/Either'
import {flow} from 'fp-ts/lib/function'

// const handleClick = () => {
//     var wb = XLSX.utils.book_new();
//     var ws = XLSX.utils.json_to_sheet(arrayofobjects);
//     XLSX.utils.book_append_sheet(wb, ws, 'Test');
//     XLSX.writeFile(wb, './res/file.xlsx');
// };

// let arrayofobjects = [
//     {
//         "00": 4,
//         "01": 6,
//         "10": 12,
//         "11": 7,
//     },
//     {
//         "00": 7,
//         "01": 7,
//         "10": 4,
//         "11": 5,
//     }
// ]
// handleClick();

let apiTemplate={
    "compare_1":{
                "para":"/api/v1/compare?prodId=123",
                "email": "mailReplace",
                "userAccount":"accountReplace"
    },
    "compare":{
                "para":"?prodId=prodIdReplace"
    }

}


const getApi=(hostName:string,apiName:string,para:string):TE.TaskEither<Error,string>=>
    pipe(
        TE.tryCatch(
            ()=>
            axios.get(hostName+apiName+para).then((response)=>{
                return response.data.CompareResult
            }),
            (error)=>new Error(`Failed to get w: ${error}`)
        )
    )
const postApi=(hostName:string,apiName:string,body:object):TE.TaskEither<Error,string>=>
    pipe(
        TE.tryCatch(
            ()=>
            axios.post(hostName+apiName,apiTemplate[apiName]).then((response)=>{
                return response.data
            }),
            (error)=>new Error(`Failed to get w: ${error}`)
        )
    )

const handleGetCompareResult=(hostName:_.List<string>,apiName:_.List<string>,body:object)=>{  
    let response_base,response_compare;  
    let apiRequestPara=apiTemplate[apiName[0]].para;        
    Object.keys(body).forEach((key:string)=>{
        apiRequestPara=apiRequestPara.replaceAll(key, body[key])
    });
    getApi(hostName[0],apiName[0],apiRequestPara)().then(
        flow(
        E.match(
            (e)=>console.error(e),
            (right)=>{
                response_base=right;
                console.log(right)
            }
        )
        )
    )
    apiRequestPara=apiTemplate[apiName[1]].para;        
    Object.keys(body).forEach((key:string)=>{
        apiRequestPara=apiRequestPara.replaceAll(key, body[key])
    });
    getApi(hostName[1],apiName[1],apiRequestPara)().then(
        flow(
        E.match(
            (e)=>console.error(e),
            (right)=>{
                response_compare=right;
                console.log(right)
            }
        )
        )
    )
}
const handlePostCompareResult=(hostName:_.List<string>,apiName:_.List<string>,body:object)=>{
    let response_base,response_compare;
    let apiRequestBody=apiTemplate[apiName[0]];
    Object.keys(apiRequestBody).forEach((key:string)=>{
        apiRequestBody[key]=body[apiRequestBody[key]]==null?apiRequestBody[key]:body[apiRequestBody[key]];
    });
    postApi(hostName[0],apiName[0],apiRequestBody)().then(
        flow(
            E.match(
            (e)=>console.error(e),
            (right)=>{
                    response_base=right;
                    console.log(response_base);
                }
            )
        )
    )
    apiRequestBody=apiTemplate[apiName[1]];
    Object.keys(apiRequestBody).forEach((key:string)=>{
        apiRequestBody[key]=body[apiRequestBody[key]]==null?apiRequestBody[key]:body[apiRequestBody[key]];
    });
    postApi(hostName[1],apiName[1],apiRequestBody)().then(
        flow(
            E.match(
            (e)=>console.error(e),
            (right)=>{
                    response_compare=right;
                    console.log(response_compare);
                }
            )
        )
    )
}

      
let requestPara={
    "prodIdReplace": "987"
}
handleGetCompareResult(["http://localhost:8000/api/v1/","http://localhost:8000/api/v1/"],["compare","compare"],requestPara);

      
let requestBody={
                "mailReplace": "alice@gmail.com",
                "accountReplace":"alice"
    }
handlePostCompareResult(["http://localhost:8000/api/v1/","http://localhost:8000/api/v1/"],["compare_1","compare_1"],requestBody);
