'use client'
import React, {useState, useEffect} from 'react'
import { useSession } from 'next-auth/react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShortText from '../ShortText/ShortText';
import Link from 'next/link';
import Swal from 'sweetalert2';

const History = () => {
    const [Lists, setLists] = useState([]);
    const [InviteLists, setInviteLists] = useState([]);
    const { data: session, status } = useSession();


    const DeleteBoard = async(BoardID) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/delboard/${BoardID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.token}`
                },
            })
            const data = await res.json();
            console.log(data)
            if (res.ok && data.status) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Deleted your board !',
                })
                fetchLists()
                fetchInviteLists()
            } 
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong!',
            })
            console.error('Error fetching tags :', error.message)
        }
    }

    const fetchLists = async () => {
        try{
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/lists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.token}`
                },
            });
            const data = await response.json();
            console.log(data);
            if (response.ok && data.status) {
                console.log(data);
                setLists(data.lists);
            } 
        } catch(err){
            console.error('Failed to fetch lists', err.message);
        }
    }

    const fetchInviteLists = async () => {
        try{
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/invite_lists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.token}`
                },
            });
            const data = await response.json();
            console.log(data);
            if (response.ok && data.status) {
                setInviteLists(data.lists);
            } 
        } catch(err){
            console.error('Failed to fetch lists', err.message);
        }
    }

    useEffect(() => {
        if(status == 'loading') return
        fetchLists();
        fetchInviteLists();
    }, [session?.user?.mb_username, status]);



    return (
        <>
            <div className="md:w-full bg-white h-full rounded-2xl p-5 overflow-y-auto shadow-lg">
                <h1 className='md:text-3xl text-lg font-bold text-green-700 mb-5'>
                    Your List
                </h1>
                <div className="gap-3 grid md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 grid-cols-2 mb-5">
                    {
                        Lists?.map((list, index) => (
                            <Link href={`/Mission/Master/${list?.bd_id}`} key={index} className="bg-green-100 p-3 rounded-xl cursor-pointer hover:bg-green-200 transition duration-300 ease-in-out grid grid-cols-2">
                                <h2 className="text-lg text-green-700 flex items-center">
                                    <div className="me-3">
                                        <ListAltIcon />
                                    </div>
                                    {ShortText(list?.bd_project_name, 19)}
                                </h2>
                                <h2 className='text-lg text-green-700 flex justify-self-end me-2' onClick={() => DeleteBoard(list?.bd_id)}>
                                    x
                                </h2>
                            </Link>
                        ))
                    }
                </div>

                <h1 className='md:text-3xl text-lg font-bold text-green-700 mb-5'>
                    Your Join
                </h1>
                <div className="gap-3 grid md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 grid-cols-2 mb-5">
                    {
                        InviteLists?.map((list, index) => (
                            <Link href={`/Mission/Guest/${list?.bd_id}`} key={index} className="bg-green-100 p-3 rounded-xl cursor-pointer hover:bg-green-200 transition duration-300 ease-in-out">
                                <h2 className="text-lg text-green-700 flex items-center">
                                    <div className="me-3">
                                        <ListAltIcon />
                                    </div>
                                    {ShortText(list?.bd_project_name, 19)}
                                </h2>
                            </Link>
                        ))
                    }
                </div>
            </div>
        </>
    )
}

export default History