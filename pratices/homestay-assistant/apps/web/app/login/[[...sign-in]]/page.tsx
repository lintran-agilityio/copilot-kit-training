"use client";

// Libs
import { SignIn } from "@clerk/nextjs";

import { ROUTES } from "@/constants";

const LoginPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center">
        <SignIn routing="path" path={ROUTES.LOGIN} />
      </div>
    </main>
  );
};

export default LoginPage;
