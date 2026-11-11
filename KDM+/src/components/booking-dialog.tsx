'use client';
import {useEffect,useRef,useState} from 'react';
import {X,ChevronLeft,ChevronRight,Check,CalendarDays} from 'lucide-react';
import {type Equipment,statusLabels} from '@/lib/equipment';
import {koreaToday,monthDays,moveMonth,dateLabel,rentalDays,validateRental,type RentalInput} from '@/lib/rental-dates';

export default function BookingDialog({equipment,onClose}:{equipment:Equipment;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const [today]=useState(()=>koreaToday());
  const [month,setMonth]=useState(today.slice(0,7));
  const [selecting,setSelecting]=useState<'start'|'end'>('start');
  const [form,setForm]=useState<RentalInput>({start:'',end:'',name:'',cohort:'',purpose:''});
  const [error,setError]=useState('');
  const [review,setReview]=useState(false);
  const blockedUntil=equipment.status==='rented'?equipment.returnDate:undefined;
  const unavailable=equipment.status==='maintenance';
  useEffect(()=>{
    const el=dialog.current;el?.showModal();
    return ()=>el?.close();
  },[]);
  useEffect(()=>{if(review)heading.current?.focus();},[review]);
  const update=(key:keyof RentalInput,value:string)=>{setForm(f=>({...f,[key]:value}));setError('');};
  function choose(date:string){
    if(selecting==='start'){
      setForm(f=>({...f,start:date,end:f.end>=date?f.end:''}));setSelecting('end');
    }else if(!form.start||date<form.start){
      setForm(f=>({...f,start:date,end:''}));setSelecting('end');
    }else{setForm(f=>({...f,end:date}));}
    setError('');
  }
  function submit(event:React.FormEvent){
    event.preventDefault();
    const message=validateRental(form,koreaToday(),blockedUntil);
    if(message){setError(message);return;}
    if(unavailable){setError('점검 중인 장비는 신청할 수 없습니다.');return;}
    setReview(true);
  }
  const [year,monthNumber]=month.split('-').map(Number);
  return <dialog ref={dialog} className="booking-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="booking-title">
    <button className="close-dialog" onClick={onClose} aria-label="대여 신청 창 닫기"><X size={22}/></button>
    <aside className="booking-product">
      <span className="booking-brand">KDM<span>+</span></span>
      <img src={equipment.image} alt={`${equipment.name} 참고 사진`}/>
      <div className="booking-product-info"><span className={`stock ${equipment.status}`}><i/>{statusLabels[equipment.status]}</span><h2>{equipment.name}</h2><span className="asset-id">{equipment.id}</span><dl><div><dt>구성품</dt><dd>{equipment.components.join(' · ')}</dd></div><div><dt>모델</dt><dd>실제 모델 정보 등록 예정</dd></div></dl><p>사진과 대여 상태는 예시입니다.</p></div>
    </aside>
    <div className="booking-main">
      {review?<section className="booking-review"><div className="review-icon"><Check size={26}/></div><h2 id="booking-title" ref={heading} tabIndex={-1}>신청 내용을 확인해 주세요.</h2><p className="review-intro">아직 접수되지 않은 미리보기입니다.</p><dl className="review-details"><div><dt>장비</dt><dd>{equipment.name} <span>{equipment.id}</span></dd></div><div><dt>대여일</dt><dd>{dateLabel(form.start)}</dd></div><div><dt>반납 예정일</dt><dd>{dateLabel(form.end)}</dd></div><div><dt>이용 기간</dt><dd>{rentalDays(form.start,form.end)}일 · 시작일과 반납일 포함</dd></div><div><dt>신청자</dt><dd>{form.name.trim()}</dd></div><div><dt>기수</dt><dd>{form.cohort}기</dd></div>{form.purpose.trim()&&<div><dt>사용 목적</dt><dd>{form.purpose.trim()}</dd></div>}</dl><div className="demo-message">현재는 신청 화면을 체험하는 단계입니다. 입력 내용은 전송·저장되지 않으며, 창을 닫으면 사라집니다. 실제 대여는 시스템 연결 후 관리자 승인이 필요합니다.</div><div className="review-actions"><button className="button secondary" onClick={()=>setReview(false)}>내용 수정</button><button className="button primary" onClick={onClose}>확인하고 닫기</button></div></section>:
      <form onSubmit={submit}><h2 id="booking-title">언제 필요하세요?</h2><p className="form-intro">날짜를 고르고 이름과 기수를 입력해 주세요.</p>
      {unavailable?<div className="unavailable-message">현재 점검 중인 장비입니다. 다른 장비를 선택해 주세요.</div>:<>
      <div className="date-fields"><button type="button" className={selecting==='start'?'selected':''} onClick={()=>setSelecting('start')}><span>대여일</span><strong>{dateLabel(form.start)}</strong><CalendarDays size={17}/></button><button type="button" className={selecting==='end'?'selected':''} onClick={()=>setSelecting('end')}><span>반납 예정일</span><strong>{dateLabel(form.end)}</strong><CalendarDays size={17}/></button></div>
      <div className="calendar"><div className="calendar-header"><h3 aria-live="polite">{year}년 {monthNumber}월</h3><div><button type="button" aria-label="이전 달" disabled={month<=today.slice(0,7)} onClick={()=>setMonth(moveMonth(month,-1))}><ChevronLeft size={19}/></button><button type="button" aria-label="다음 달" onClick={()=>setMonth(moveMonth(month,1))}><ChevronRight size={19}/></button></div></div><div className="weekdays" aria-hidden="true">{['일','월','화','수','목','금','토'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-days">{monthDays(month).map((day,i)=>day?<button type="button" key={day} disabled={day<today||!!(blockedUntil&&day<=blockedUntil)} className={[day===form.start?'range-start':'',day===form.end?'range-end':'',form.start&&form.end&&day>form.start&&day<form.end?'in-range':'',day===today?'today':''].join(' ')} aria-label={`${dateLabel(day)}${day===today?' 오늘':''}${day===form.start?' 대여일':''}${day===form.end?' 반납 예정일':''}`} aria-pressed={day===form.start||day===form.end} onClick={()=>choose(day)}>{Number(day.slice(-2))}</button>:<span key={`blank-${i}`}/>)}</div><p className="calendar-help" aria-live="polite">{form.start&&form.end?`${rentalDays(form.start,form.end)}일 이용 · 시작일과 반납일 포함`:selecting==='start'?'대여를 시작할 날짜를 선택하세요.':'반납할 날짜를 선택하세요. 당일 반납도 가능합니다.'}</p>{blockedUntil&&<p className="blocked-note">{dateLabel(blockedUntil)}까지 대여 중 (예시)</p>}</div>
      <div className="person-fields"><label htmlFor="renter-name">이름 <span>필수</span><input id="renter-name" name="name" autoComplete="off" required maxLength={40} value={form.name} onChange={e=>update('name',e.target.value)} placeholder="이름 입력"/></label><label htmlFor="renter-cohort">기수 <span>필수</span><div className="cohort-input"><input id="renter-cohort" name="cohort" inputMode="numeric" pattern="[1-9][0-9]?" title="1~99 사이의 기수를 숫자로 입력해 주세요" required maxLength={2} autoComplete="off" value={form.cohort} onChange={e=>update('cohort',e.target.value.replace(/[^0-9]/g,''))} placeholder="예: 7"/><span>기</span></div></label></div>
      <label className="purpose-field" htmlFor="purpose">사용 목적 <span>선택</span><textarea id="purpose" rows={2} maxLength={200} value={form.purpose} onChange={e=>update('purpose',e.target.value)} placeholder="예: 졸업 프로젝트 촬영"/></label>
      {error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" className="button primary submit-button">신청 내용 확인</button><p className="form-footnote">화면 미리보기입니다. 실제 신청은 접수되지 않습니다.</p></>}
      </form>}
    </div>
  </dialog>;
}
