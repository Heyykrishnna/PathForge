import { AuthCard } from '../../components/auth-card';

export const metadata = {
  title: 'Sign Up | PathForge',
  description: 'Create your PathForge account to access career intelligence and internship matching.'
};

export default function RegisterPage() {
  return <AuthCard initialMode="signup" />;
}

