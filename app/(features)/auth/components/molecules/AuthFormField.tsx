import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';

interface AuthFormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const AuthFormField = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  value,
  onChange,
  error,
}: AuthFormFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default AuthFormField;
