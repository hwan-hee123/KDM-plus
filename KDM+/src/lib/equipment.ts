export const categories = ['전체', '노트북', '아이패드', '아이맥', '카메라', '캠코더'] as const;
export type Category = typeof categories[number];
export type Equipment = {
  id: string; name: string; category: Exclude<Category, '전체'>; image: string;
  status: 'available' | 'rented' | 'maintenance'; returnDate?: string;
  description: string; components: string[];
};
// 1단계 UI 전용 예시 데이터. 모델, 사진, 대여 상태는 실제 보유 장비 정보가 아닙니다.
const groups: {prefix:string; name:string; category:Equipment['category']; count:number; image:string; description:string}[] = [
  {prefix:'LT',name:'노트북',category:'노트북',count:6,image:'laptop',description:'기획부터 작업의 마무리까지, 어디서든 이어지는 작업 환경.'},
  {prefix:'air',name:'아이패드 에어',category:'아이패드',count:4,image:'air',description:'가볍게 펼치는 아이디어. 스케치와 기록을 위한 태블릿.'},
  {prefix:'imac',name:'아이맥',category:'아이맥',count:4,image:'imac',description:'넓은 화면으로 더 깊이 몰입하는 데스크톱 작업 환경.'},
  {prefix:'sony',name:'소니 카메라',category:'카메라',count:1,image:'sony',description:'순간의 시선을 작품으로 남기는 촬영 장비.'},
  {prefix:'canon',name:'캐논 카메라',category:'카메라',count:2,image:'canon',description:'프로젝트의 장면을 선명하게 기록해 보세요.'},
  {prefix:'mini',name:'아이패드 미니',category:'아이패드',count:1,image:'mini',description:'한 손에 담기는 작은 작업실. 이동 중에도 간편하게.'},
  {prefix:'cam',name:'소니 캠코더',category:'캠코더',count:1,image:'cam',description:'행사와 인터뷰의 흐름을 끊김 없이 기록하는 영상 장비.'},
];
const rented = ['LT-03','LT-05','air-02','imac-03'];
export const equipment: Equipment[] = groups.flatMap(g => Array.from({length:g.count},(_,i)=>{
 const id = `${g.prefix}-${String(i+1).padStart(2,'0')}`;
 return {id,name:g.name,category:g.category,image:`/images/${g.image}.jpg`,status:rented.includes(id)?'rented':id==='canon-02'?'maintenance':'available',returnDate:rented.includes(id)?'2026-11-18':undefined,description:g.description,components:g.prefix==='LT'?['본체','충전기','마우스']:['본체','기본 구성품 (추후 확인)']};
}));
// UI는 이 조회 계층을 사용합니다. 3단계에서 서버 기반 Supabase 조회로 교체합니다.
export function getEquipment() { return equipment; }
export const statusLabels = {available:'대여 가능',rented:'대여 중',maintenance:'점검 중'};
export const rentalStatuses = ['승인 대기','승인 완료','수령 대기','대여 중','반납 검수 중','반납 완료','승인 거절'] as const;
