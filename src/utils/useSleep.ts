export default async function useSleep(time:number){
   return new Promise<void>((resolve, reject) =>{
      setTimeout(()=>{
         resolve()
      }, time)
   })
}