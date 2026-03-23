import { getEventRosterAction } from './actions';
import EventRosterClient from './components/EventRosterClient';

export default async function EventPage() {
  const result = await getEventRosterAction();
  const rosters = result.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <EventRosterClient rosters={rosters} />
    </div>
  );
}
