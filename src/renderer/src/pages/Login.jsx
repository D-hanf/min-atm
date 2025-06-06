import LoginCard from '../features/dashboard/ui/login/LoginCard';
import LoginHeader from '../features/dashboard/ui/login/LoginHeader';
import React from 'react';

const LoginForm = () => {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <LoginHeader></LoginHeader>
    <LoginCard></LoginCard>
    </div>
  );
};

export default LoginForm;
