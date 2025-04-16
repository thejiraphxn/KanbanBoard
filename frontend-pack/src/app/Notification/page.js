'use client'
import React, {useState, useEffect} from 'react'
import NavBar from '../Components/NavBar/NavBar'
import List from '@mui/joy/List'
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useSession, status } from "next-auth/react"
import { useRouter } from "next/navigation";
import Link from 'next/link';
import ShortText from '../Components/ShortText/ShortText';

const page = () => {
  const [NoticeInvite, setNoticeInvite] = useState([]);
  const { data: session, status } = useSession()
  const router = useRouter();

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
            setNoticeInvite(data.lists);
        } 
    } catch(err){
        console.error('Failed to fetch lists', err.message);
    }
  }

  useEffect(() => {
    fetchInviteLists();
  }, [status])

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || !session?.user?.mb_username) {
      router.push('/');
    }
  }, [status, session?.user?.mb_username]);
  

  return (
    <>
      <div className="bg-gradient-to-br from-green-200 via-green-50 to-green-100 h-full max-h-full w-screen items-center">
          <NavBar/>
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
                <h2 className="text-xl text-green-800 font-semibold mb-4">Notification</h2>
                <List sx={{
                  overflowY: 'auto',
                  height: {
                  sm: 150,
                  md: 200,
                  lg: 200,
                }}}>
                  <div className="grid grid-cols-1 mb-2">
                    {
                        NoticeInvite?.map((list, index) => (
                            <Link href={`/Mission/Guest/${list?.bd_id}`} key={index} className="bg-green-100 p-3 rounded-xl cursor-pointer hover:bg-green-200 transition duration-300 ease-in-out mb-2">
                                <h2 className="text-md text-green-700 flex items-center">
                                    <div className="me-3">
                                        <ListAltIcon />
                                    </div>
                                    {"You have new invite to join : " + ShortText(list?.bd_project_name, 19)}
                                </h2>
                            </Link>
                        ))
                    }
                      
                  </div>

                </List>
              </div>
            </div>
      </div>

    </>
  )
}

export default page