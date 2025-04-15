'use client'
import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import NavBar from "../Components/NavBar/NavBar"
import validateForm from '../Validation/validateForm'
import { useSession, signIn } from 'next-auth/react'

const Page = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const { data:session, status } = useSession();
    const [viewPassword, setViewPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [disableButton, setDisableButton] = useState(false)

    const handleChange = (e) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const foundErrors = validateForm(formData)

        if (Object.keys(foundErrors).length > 0) {
        setErrors(foundErrors)
        return
        }

        setErrors({})
        setDisableButton(true)

        const payload = {
            mb_username: formData.username,
            mb_email: formData.email,
            mb_password: formData.password,
            confirm_password: formData.confirmPassword,
            mb_firstname: formData.firstname,
            mb_lastname: formData.lastname
        }

        try{
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
    
            const result = await res.json()
    
            if (res.ok && result.status) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Registration success!',
                    text: result.message || 'You can login now !',
                    confirmButtonColor: '#22c55e'
                })
                setFormData({
                    firstname: '',
                    lastname: '',
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                })
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: result.message || result.error || 'Something went wrong',
                    confirmButtonColor: '#ef4444'
                })
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Network error, please try again later',
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
    <div className="bg-gradient-to-br from-green-100 via-white to-green-200 min-h-screen shadow-lg">
        <NavBar />
        <main className="flex justify-center items-center">
            <form onSubmit={handleSubmit} className="w-full md:w-2/6 p-6 bg-white rounded-xl mt-10">
            <h2 className="text-2xl font-bold text-green-700 text-center mb-5">Sign Up</h2>

            <div className="grid sm:grid-cols-2 gap-3">
                <div className="mb-3">
                    <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-green-700">Firstname</label>
                    <input
                        type="text"
                        id="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        placeholder="John"
                        className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                        required
                    />
                    {errors.firstname && <p className="text-red-500 text-sm">{errors.firstname}</p>}
                </div>

                <div className="mb-3">
                    <label htmlFor="lastname" className="block mb-2 text-sm font-medium text-green-700">Lastname</label>
                    <input
                        type="text"
                        id="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                        required
                    />
                    {errors.lastname && <p className="text-red-500 text-sm">{errors.lastname}</p>}
                </div>
            </div>

            <div className="mb-3">
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-green-700">Username</label>
                <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe007"
                    className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                    required
                />
                {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
            </div>

            <div className="mb-3">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-green-700">Email</label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                    required
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="mb-3">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-green-700">Password</label>
                <input
                    type={viewPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                    required
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <div className="mb-3">
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-green-700">Confirm Password</label>
                <input
                    type={viewPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="********"
                    className="shadow-sm bg-white text-green-700 border-zinc-200 text-sm rounded-lg block w-full p-2.5 border-2 focus:border-green-500 focus:outline-none"
                    required
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
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
                // disabled={disableButton}
                className="w-full py-3 text-sm font-medium rounded-xl bg-green-700 text-white hover:bg-green-800 duration-200 ease-in-out cursor-pointer disabled:opacity-50"
            >
                SignUp
            </button>
            </form>
        </main>
    </div>
    )
}

export default Page
