import React, {useEffect, useState, useRef} from 'react'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { motion } from 'framer-motion'
import EventNoteIcon from '@mui/icons-material/EventNote';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSession } from "next-auth/react"
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { io } from 'socket.io-client';
import PersonIcon from '@mui/icons-material/Person';


function NavBar() {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
        transports: ['websocket'],
    });
    const router = useRouter();
    const { data: session, status } = useSession()
    const [isOpen, setIsOpen] = useState(false);
    const [IsNotice, setIsNotice] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const animationRef = useRef(null);


    // useEffect(() => {
    //     if (!session?.user?.mb_id) return; 
      
    //     const handleNotice = (data) => {
    //       console.log('📢 มีการอัปเดตจาก:', data.user);
    //       if (data?.user === session.user.mb_id) {
    //         setIsNotice(true);
    //         setIsPulsing(true);
    //       }
    //     };
      
    //     socket.on('notification_user', handleNotice);
      
    //     return () => {
    //       socket.off('notification_user', handleNotice); 
    //     //   socket.disconnect();
    //     };
    // }, [session?.user?.mb_id]);

    useEffect(() => {
        if (!session?.user?.mb_id) return;
    
        const mbId = session.user.mb_id;
    
        const handleNotice = (data) => {
          console.log('มีการอัปเดตจาก:', data.user);
          if (data?.user === mbId) {
            setIsNotice(true);
            setIsPulsing(true);
          }
        };

        socket.emit('join_notice_room', { UserID: mbId });
        socket.on('notification_user', handleNotice);
    
        return () => {
          socket.off('notification_user', handleNotice);
        };
    }, [session?.user?.mb_id]);
    

    useEffect(() => {
        let isMounted = true;
    
        const startPulseCycle = () => {
          if (!isMounted || !IsNotice) return;
    
          setIsPulsing(true);
    
          setTimeout(() => {
            if (!isMounted || !IsNotice) return;
            setIsPulsing(false);
    
            animationRef.current = setTimeout(() => {
              startPulseCycle();
            }, 2000);
          }, 300);
        };
    
        if (IsNotice) {
          startPulseCycle();
        }
    
        return () => {
          isMounted = false;
          if (animationRef.current) {
            clearTimeout(animationRef.current);
          }
          setIsPulsing(false);
        };
    }, [IsNotice]);

    return (
        <>
            <div className="w-full container mx-auto pt-3">
                <div className="w-full flex items-center justify-between">
                    <a className="text-green-700 flex items-center no-underline hover:no-underline font-bold text-xl lg:text-3xl ps-2 pe-2 w-3/6" href="#">
                        {process.env.NEXT_PUBLIC_APP_NAME}
                    </a>
                    
                    <div className="ps-2 pe-2 w-3/6 justify-end content-center hidden md:flex">
                        <ul className='flex w-full justify-between'>
                            {
                                !session?.user?.mb_username ? (
                                    <>
                                        <li className='w-1/4 justify-items-center'>
                                             
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <a className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out" href="/">
                                                <HomeIcon/> {'Home'}
                                            </a> 
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <Link className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out" href="/SignUp">
                                                <AccountCircleIcon/> {'Sign Up'}
                                            </Link> 
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <Link className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out" href="/SignIn">
                                                <ExitToAppIcon/> {'Sign In'}
                                            </Link> 
                                        </li>
                                        
                                    </>
                                    
                                ) : (
                                    <>
                                        <li className='w-1/4 justify-items-center'>
                                            <Link className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out" href="/">
                                                <EventNoteIcon/> {'Your List'}
                                            </Link> 
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <Link onClick={() => setIsNotice(false)} className={`flex inline-block ${!IsNotice ? 'text-green-700 hover:text-green-300' : 'text-green-300 hover:text-green-500'} ${isPulsing ? 'scale-125' : 'scale-100'} no-underline hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out`} href="/Notification">
                                                {
                                                    !IsNotice ? (
                                                        <>
                                                            <NotificationsActiveIcon/> {'Notification'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <NotificationsActiveIcon/> {'New invite !'}
                                                        </>
                                                    )
                                                }
                                            </Link> 
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <div className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out">
                                                <PersonIcon/> {`@${session?.user?.mb_username}`}
                                            </div> 
                                        </li>
                                        <li className='w-1/4 justify-items-center'>
                                            <Link className="flex inline-block text-green-700 no-underline hover:text-green-300 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4 transform hover:scale-125 duration-300 ease-in-out" href="/SignOut">
                                                <LogoutIcon/> {'Sign Out'}
                                            </Link> 
                                        </li>
                                    </>
                                )
                            }

                            
                            
                        </ul>
                    </div>

                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none cursor-pointer"
                            aria-expanded={isOpen}
                            >
                            <svg
                                className={`text-green-700 h-6 w-6 ${isOpen ? "hidden" : "block"}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16m-7 6h7"
                                />
                            </svg>
                            <svg
                                className={`text-green-700 h-6 w-6 ${isOpen ? "block" : "hidden"}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        
                    </div>
                </div>
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden lg:hidden basis-full top-16 left-0 bg-transparent p-3"
                >
                    <ul className='text-white'>
                        <li>
                            <a href="/" className="block px-3 py-2 text-green-700 font-medium hover:text-green-900 ease-in-out duration-200" >
                                Home
                            </a>
                        </li>
                    </ul>
                </motion.div>
                {/* </div> */}
            </div>
        </>
    )
    }

export default NavBar
