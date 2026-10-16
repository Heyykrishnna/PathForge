import { AuthCard } from '../../components/auth-card';

export const metadata = {
  title: 'Log In | PathForge',
  description: 'Log into your PathForge account.'
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}

