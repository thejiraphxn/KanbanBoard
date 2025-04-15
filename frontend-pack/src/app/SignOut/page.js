"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const SignOut = () => {
    const router = useRouter();

    useEffect(() => {
        signOut({ redirect: false }).then(() => {
            setTimeout(() => {
                router.push('/')
            }, 500);
        });
    }, [router]);
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-white to-green-200">
            <h1 className="text-2xl font-bold text-green-700">Logging out...</h1>
        </div>
    );
};

export default SignOut
