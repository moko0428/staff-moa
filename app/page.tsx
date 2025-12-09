import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from './landing/page';

export default async function Home() {
  const store = await cookies();
  const authed = store.get('userId')?.value || store.get('authToken')?.value;
  if (authed) {
    redirect('/post');
  }
  return <LandingPage />;
}
