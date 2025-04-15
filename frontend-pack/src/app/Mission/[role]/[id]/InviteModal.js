import React, { useState, useEffect } from 'react';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalClose from '@mui/joy/ModalClose';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import List from '@mui/joy/List';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ShortText from '../../../Components/ShortText/ShortText';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';

const InviteModal = ({ BoardID, BoardName, UpdateState, token, BoardDetail}) => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
        transports: ['websocket'],
    });
    const [open, setOpen] = useState(false);
    const [People, setPeople] = useState({});

    const NotificationUpdate = (UserID, BoardID) => {
        socket.emit('notice_updated', {
          UserID: UserID,
          BoardID: BoardID
        });
    };

    const GetPeople = async() => {
        try{
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/people/${BoardID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await res.json();
            console.log(data.Data)
            if (res.ok && data.status) {
                setPeople(data.Data);
            }
        } catch(err){
            console.log(err.message)
        }
    }

    const InvitePerson = async(MemberID) => {
        try{
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/invite/${BoardID}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }, 
                body: JSON.stringify({
                    mb_id: MemberID
                }),
            })
            const data = await response.json();
            console.log(data);
            if (response.ok && data.status) {
                GetPeople();
                Swal.fire({
                    title: "Success",
                    icon: "success",
                    text: "Invited !",
                    didOpen: () => {
                      const popup = document.querySelector('.swal2-popup');
                      const container = document.querySelector('.swal2-container');
                      if (popup) popup.style.zIndex = '99999';
                      if (container) container.style.zIndex = '99998'; 
                    }
                })
                NotificationUpdate(MemberID, BoardID)
            }
        } catch(err){
            console.log(err.message);
            Swal.fire({
                title: "Error",
                icon: "error",
                text: "Sorry, Please try again",
                didOpen: () => {
                  const popup = document.querySelector('.swal2-popup');
                  const container = document.querySelector('.swal2-container');
                  if (popup) popup.style.zIndex = '99999';
                  if (container) container.style.zIndex = '99998'; 
                }
            })
        }
    }


    useEffect(() => {
        GetPeople();
        
    
    }, [BoardID, token])
    



    return (
        <>
            <button
                className="cursor-pointer hover:bg-green-200 w-full h-10 py-2 px-3 rounded-full bg-green-100 flex items-center justify-center text-green-700 mb-2 duration-200 ease-in-out"
                onClick={() => {setOpen(true), GetPeople()}}
            >
                <PersonAddAlt1Icon className="me-2" /> Invite
            </button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <div className="fixed inset-0 flex items-center justify-center">
                <ModalDialog
                    className="bg-white rounded-2xl p-6 h-[70%] w-[30%] max-w-md border border-zinc-200"
                >
                    <ModalClose />
                    <DialogTitle className="text-green-700 text-xl font-semibold">
                        Choose people to join this board : {BoardName}
                    </DialogTitle>
                    <DialogContent>
                        <p className="text-sm text-zinc-600">
                            {`If you invite others, they’ll be able to view and edit everything on this board!`}
                        </p>

                        <div className="w-full h-[30%] xl:h-[60%] mt-3 rounded-2xl px-5">
                            <List>
                                {
                                    People?.member?.map((list, index) => (
                                        (() => {
                                            const foundUser = People?.invited?.find(user => user.mb_id === list?.mb_id);
                                            return foundUser ? (
                                                <div key={index} className="cursor-pointer w-full h-full bg-green-200 text-green-700 hover:bg-green-300 mt-3 rounded-full px-2.5 py-1.5 grid grid-cols-2 flex duration-200 ease-in-out">
                                                    <h3 className="text-md">
                                                        <AccountCircleIcon className='me-2' /> 
                                                        {ShortText(list?.mb_firstname +" "+ list?.mb_lastname, 45)}
                                                    </h3>
                                                    <h3 className="justify-self-end items-end text-green-700 hover:text-green-800 pe-3">
                                                        <CheckIcon />
                                                    </h3>
                                                </div>
                                            ) : (
                                                BoardDetail?.mb_id == list?.mb_id ? (
                                                    <div key={index} className="cursor-pointer w-full h-full bg-red-200 text-red-700 hover:bg-red-300 mt-3 rounded-full px-2.5 py-1.5 grid grid-cols-2 flex duration-200 ease-in-out">
                                                        <h3 className="text-md">
                                                            <AccountCircleIcon className='me-2' /> 
                                                            {ShortText(list?.mb_firstname + " " + list?.mb_lastname, 40) + " (Owner)"}
                                                        </h3>
                                                    </div>
                                                ) : (
                                                    <div key={index} onClick={() => InvitePerson(list?.mb_id)} className="cursor-pointer w-full h-full bg-sky-200 text-sky-700 hover:bg-sky-300 mt-3 rounded-full px-2.5 py-1.5 grid grid-cols-2 flex duration-200 ease-in-out">
                                                        <h3 className="text-md">
                                                            <AccountCircleIcon className='me-2' /> 
                                                            {ShortText(list?.mb_firstname +" "+ list?.mb_lastname, 45)}
                                                        </h3>
                                                        <h3 className="justify-self-end items-end text-sky-700 hover:text-sky-800 pe-3">
                                                            <AddIcon />
                                                        </h3>
                                                    </div>
                                                )
                                            );
                                        })()
                                        
                                    ))
                                }
                            </List>
                        </div>

                    </DialogContent>
                </ModalDialog>
                </div>
            </Modal>
        </>
    )
};

export default InviteModal;
