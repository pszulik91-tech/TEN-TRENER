type StorageLike={getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void};
type State={round:number;training:{completedRound?:number|null};matchState?:null|{fixture:{round:number};completed:boolean};careerStats:{matches:number}};
export const TELEMETRY_KEY:string;
export const CONSENT_KEY:string;
export function createPublisherTelemetry(storage:StorageLike,clock:()=>number,build:string):{enabled:()=>boolean;start:()=>void;record:(event:string)=>void;observe:(game:State|null)=>void;consent:(value:boolean)=>boolean;clear:()=>void;export:()=>unknown};
