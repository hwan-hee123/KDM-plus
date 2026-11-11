import {redirect} from 'next/navigation';
// Keep old bookmarks usable without retaining a login screen.
export default function Page(){redirect('/');}
