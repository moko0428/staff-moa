import { ActionState } from '../../types';

interface ActionStateMessageProps {
  state: ActionState;
}

const ActionStateMessage = ({ state }: ActionStateMessageProps) => {
  if (!state.message) return null;
  if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) return null;
  return (
    <p className={`text-sm ${state.ok ? 'text-green-600' : 'text-red-500'}`}>
      {state.message}
    </p>
  );
};

export default ActionStateMessage;
