'use client';
import React, { useState, useEffect } from 'react';
import NavBar from "./Components/NavBar/NavBar";
import History from "./Components/History/History";
import { useSession, signIn } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Swal from "sweetalert2";
import { Typewriter } from 'react-simple-typewriter'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Link from 'next/link';



export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [ButtonDisable, setButtonDisable] = useState(false);

  const CreateNewBoard = async() => {
    setButtonDisable(true)
    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/create`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`
        },
      })
      const data = await res.json()
      if (res.ok && data.status) {
        setTimeout(() => {
          router.push(`/Mission/Master/${data.BoardID}`)
        }, 500);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'Something went wrong!',
        })
      }
    } catch (error) {
        console.error('Error creating new board:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Something went wrong!',
        })
    }
    setButtonDisable(false)
  }

  const AskSwal = () => {
    Swal.fire({
      title: 'Would you like create new board ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'You, I would'
    }).then((result) => {
      if (result.isConfirmed) {
        CreateNewBoard()
        Swal.fire(
          'Created !',
          'This page will redirect to your board.',
          'success'
        )
      }
    })
  }

  

  return (
    <>
      <div className="bg-gradient-to-br from-green-100 via-white to-green-200 overscroll-y-hidden min-h-screen min-w-screen md:overflow-y-hidden">
        <NavBar/>
        <div className="min-h-screen flex items-center justify-center px-4">
          {
            session?.user?.mb_username ? (
              <div className="container px-2 md:px-0 md:mx-auto flex flex-col md:flex-row justify-between min-h-full md:gap-7">
                <div className="md:w-1/5 w-full h-screen py-10">
                  <button onClick={AskSwal} disabled={ButtonDisable} className="cursor-pointer bg-green-500 text-xl text-white font-bold py-2 px-4 rounded-2xl w-full h-13 hover:bg-green-600 transition duration-300 ease-in-out">
                    + Add New
                  </button>
                </div>
                <div className="md:w-4/5 w-full h-screen py-10">
                  <History/>
                </div>
              </div>
            ) : (
              <>
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-center max-w-full"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="inline-flex items-center gap-2 justify-center mb-6"
                    >
                      <Sparkles className="text-green-600 animate-spin-slow" />
                      <h1 className="text-4xl font-extrabold text-green-700 drop-shadow-md">
                        <Typewriter
                          words={[
                            'Welcome to Kanban Jam Board!',
                            'Sign in and invite your friend!',
                            'enjoy your task !'
                          ]}
                          loop={0}
                          cursor
                          cursorStyle="_"
                          typeSpeed={70}
                          deleteSpeed={40}
                          delaySpeed={1000}
                        />
                      </h1>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.8 }}
                      className="text-gray-700 text-lg mb-8"
                    >
                      Collaborate, drag & drop tasks, and get things done—beautifully.
                    </motion.p>

                    <Link
                      className="duration-200 ease-in-out cursor-pointer px-6 py-3 bg-green-500 text-white rounded-xl font-bold transition-all hover:bg-green-600 shadow-md"
                      href='/SignUp'
                    >
                      Take me
                    </Link>
                  </motion.div>
              </>
            )
          }
        </div>
      </div>
    </>
  );
}
