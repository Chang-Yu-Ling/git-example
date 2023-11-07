import * as XLSX from 'xlsx'
import * as _ from 'lodash'

const workbook_1 = XLSX.readFile('./data/test_1.xlsx')
const workbook_2 = XLSX.readFile('./data/test_2.xlsx')
function skipKey(key:string){if (key === "Props"||key === "SSF"||key === "Styles" ) return undefined}
const xlsx_1=workbook_1.Sheets
// JSON.stringify(workbook_1, (key, value) => {
//     skipKey(key)
//     return value
//   })
const xlsx_2=workbook_2.Sheets
// JSON.stringify(workbook_2, (key, value) => {
//     skipKey(key)
//     return value
// })
var preCheck:boolean=_.isEqual(xlsx_1,xlsx_2)
if(preCheck) {console.log("%c==> \t比對結果：2 份檔案 一樣\t", 'color: green')}    
else {console.log("%c==> \t比對結果：2 份檔案 不同\t", 'color: red')}    

if(!preCheck){    
    var check:boolean=true

    if(workbook_1.SheetNames.length!=workbook_2.SheetNames.length){
        check=false
        console.log("頁數不同：( workbook_1 =",workbook_1.SheetNames.length,", \t workbook_2 =",workbook_2.SheetNames.length,")")
    }
    else{
        for(var i=0;i<workbook_1.SheetNames.length;i++){
            //console.log("第",i+1,"頁")
            //console.log(workbook_1.Sheets[workbook_1.SheetNames[i])
            const data_1 = XLSX.utils.sheet_to_json(workbook_1.Sheets[workbook_1.SheetNames[i]])
            const data_2 = XLSX.utils.sheet_to_json( workbook_2.Sheets[workbook_2.SheetNames[i]])
            //console.log(data_1)
            //console.log(data_2)
            if(data_1.length!=data_2.length){
                check=false
                console.log("第",i+1,"頁，列數不同：( data_1 =",data_1.length,", \tdata_2 =",data_2.length,")")
            }
            else{
                if(!_.isEqual(Object.keys(data_1[0]||{}), Object.keys(data_2[0]||{}))){
                    Object.keys(data_1[0]||{}).map((ai,l)=>{
                        if(ai!=Object.keys(data_2[0]||{})[l])console.log("第",i+1,"頁，\t第",0+1,"列，第",l+1,"格 不同：( data_1 =",ai,", \tdata_2 =",Object.keys(data_2[0]||{})[l],")")               
                    })
                }
                else{            
                    data_1.map((a,r)=>{
                        if(!_.isEqual(a, data_2[r])){
                                check=false
                                //console.log("\t第",r+2,"列 內容 不同")  
                                Object.values(a||{}).map((ai,k)=>{
                                    if(ai!==Object.values(data_2[r]||{})[k])console.log("第",i+1,"頁，\t第",r+2,"列，第",k+1,"格 不同：( data_1 =",ai,", \tdata_2 =",Object.values(data_2[r]||{})[k],")")
                                })
                                //console.log("\t\t test_1: ",a)
                                //console.log("\t\t test_2: ", data_2[r])
                            }
                        })
                }
            } 
        }
    }

    // if(check) {console.log("%c==> \t比對結果：2 份檔案 一樣\t", 'color: green')}    
    // else {console.log("%c==> \t比對結果：2 份檔案 不同\t", 'color: red')}    
}