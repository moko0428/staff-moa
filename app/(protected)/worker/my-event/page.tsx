import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getMyEventsAction } from './actions';
import MyEventClient from './components/MyEventClient';

export default async function MyEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'member') redirect('/');

  const { data: events = [] } = await getMyEventsAction();

  return (
    <div className="max-w-lg mx-auto px-0 py-4">
      <MyEventClient events={events ?? []} />
    </div>
  );
}
