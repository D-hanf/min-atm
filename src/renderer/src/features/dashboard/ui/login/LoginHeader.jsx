import ImageComp from "../../../../components/ImageComp";
import React from "react";
import logo from '../../../../assets/electron.svg'; // Adjust the path as necessary

const LoginHeader = () => {
  return (
   <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <ImageComp className="mx-auto h-10 w-auto" src={logo} alt="Your Company"></ImageComp>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
    </div>
  );
};

export default LoginHeader;