import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'KDM Equipment Rental | 함께 쓰는 장비, 더 커지는 가능성', description: 'KDM 공용 장비 대여 서비스. 노트북, 아이패드, 아이맥, 카메라와 캠코더를 한곳에서 만나보세요.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html>; }
