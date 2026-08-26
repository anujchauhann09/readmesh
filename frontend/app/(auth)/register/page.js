import RegisterClient from './register-client';

export const metadata = {
  title: 'Create your account',
  description: 'Create a readmesh account and start reading docs the better way.',
  alternates: { canonical: '/register' },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
