'use client'
import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import NavBar from "../Components/NavBar/NavBar"
import { useRouter } from 'next/navigation'
import { useSession, signIn } from "next-auth/react"

const Page = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const { data: session, status } = useSession()
  const router = useRouter()
  const [viewPassword, setViewPassword] = useState(false)
  const [disableButton, setDisableButton] = useState(false)

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setDisableButton(true)

    const res = await signIn("credentials", {
      redirect: false,
      mb_username: formData.username,
      mb_password: formData.password
    })

    if (res.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Sign In Success!',
        text: 'Welcome back!',
        confirmButtonColor: '#22c55e'
      })
      router.push('/')
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Sign In Failed',
        text: res.error || 'Invalid credentials',
        confirmButtonColor: '#ef4444'
      })
    }

    setDisableButton(false)
  }

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      router.push('/');
    }
  
  }, [status]);

  

  return (
    <div className="bg-gradient-to-br from-green-100 via-white to-green-200 min-h-screen">
      <NavBar />
      <main className="flex justify-center items-center">
        <form onSubmit={handleSubmit} className="w-full md:w-2/6 p-6 bg-white rounded-xl mt-10 shadow-lg">
          <h2 className="text-2xl font-bold text-green-700 text-center mb-5">Sign In</h2>

          <div className="mb-3">
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-green-700">Username</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-green-700">Password</label>
            <input
              type={viewPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-start mb-5">
            <input
              id="viewPassword"
              type="checkbox"
              checked={viewPassword}
              onChange={() => setViewPassword(!viewPassword)}
              className="w-4 h-4 border-green-300 rounded-2xl bg-gray-50"
            />
            <label htmlFor="viewPassword" className="ms-2 text-sm font-medium text-green-700">
              Show Password
            </label>
          </div>

          <button
            type="submit"
            disabled={disableButton}
            className="w-full py-3 text-sm font-medium cursor-pointer ease-in-out suration-200 rounded-xl bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </main>
    </div>
  )
}

export default Page
