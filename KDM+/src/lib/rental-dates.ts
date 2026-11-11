export function koreaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = (type:string) => parts.find(p=>p.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function monthDays(month:string): (string|null)[] {
  const [year,m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year,m-1,1)).getUTCDay();
  const count = new Date(Date.UTC(year,m,0)).getUTCDate();
  const cells:(string|null)[] = Array(start).fill(null);
  for(let d=1;d<=count;d++) cells.push(`${month}-${String(d).padStart(2,'0')}`);
  while(cells.length%7)cells.push(null);
  return cells;
}
export function moveMonth(month:string,offset:number):string {
  const [y,m]=month.split('-').map(Number);
  return new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7);
}
export function dateLabel(date:string):string {
  if(!date)return '날짜 선택';
  const [y,m,d]=date.split('-').map(Number);
  return `${y}.${String(m).padStart(2,'0')}.${String(d).padStart(2,'0')}`;
}
export function rentalDays(start:string,end:string):number {
  return Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1;
}
export type RentalInput = {start:string;end:string;name:string;cohort:string;purpose:string};
export function validateRental(input:RentalInput,today:string,blockedUntil?:string):string|null {
  const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!validDate(input.start)||!validDate(input.end))return '달력에서 대여일과 반납 예정일을 선택해 주세요.';
  if(input.start<today)return '오늘 이후의 대여일을 선택해 주세요.';
  if(input.end<input.start)return '반납 예정일은 대여일과 같거나 늦어야 합니다.';
  if(blockedUntil&&input.start<=blockedUntil)return '현재 대여 중인 기간 이후로 선택해 주세요.';
  if(!input.name.trim()||input.name.trim().length>40)return '이름을 1~40자로 입력해 주세요.';
  if(!/^[1-9]\d?$/.test(input.cohort))return '기수를 1~99 사이의 숫자로 입력해 주세요.';
  if(input.purpose.length>200)return '사용 목적은 200자 이내로 입력해 주세요.';
  return null;
}
