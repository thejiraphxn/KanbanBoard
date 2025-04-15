'use client'
import React, { useEffect, use, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NavBar from '../../../Components/NavBar/NavBar'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import moment from 'moment'
import ShortText from '../../../Components/ShortText/ShortText'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { debounce } from 'lodash';
import InviteModal from './InviteModal'
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2'
import MemberList from './MemberList'
import { io } from 'socket.io-client';
import Tags from './Tags'


const page = ({ params }) => {
  const socket = io(process.env.NEXT_PUBLIC_API_URL, {
    transports: ['websocket'],
  });
  const { id, role } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [boardDetail, setBoardDetail] = useState({});
  const [BoardUpdate, setBoardUpdate] = useState({});
  const [MemberLists, setMemberLists] = useState([]);
  const [ButtonDisable, setButtonDisable] = useState(false);
  const [UpdateState, setUpdateState] = useState(false);
  const [activeItem, setActiveItem] = useState(null)
  const [blocks, setBlocks] = useState({
    ready: [],
    inprocess: [],
    testing: [],
    done: [],
  })
  

  const GetBoardLists = async() => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/detail/lists/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`
        }
      })
      const data = await res.json();
      console.log(data)
      if (res.ok && data.status) {
        
        const lists = data.Data || [];
        const formattedBlocks = {
          ready: [],
          inprocess: [],
          testing: [],
          done: [],
        };
        lists.forEach((item) => {
          switch (item.dt_process) {
            case '1': formattedBlocks.ready.push(item); break;
            case '2': formattedBlocks.inprocess.push(item); break; 
            case '3': formattedBlocks.testing.push(item); break;
            case '4': formattedBlocks.done.push(item); break;
          }
        });
        setBlocks(formattedBlocks);
      } 
    } catch (error) {
      console.error('Error fetching :', error.message)
    }
  }

  const GetBoardDetail = async() => {
    let mode = 'mainroom'
    if(role === 'Master'){
      mode = 'mainroom';
    } else if (role === 'Guest'){
      mode = 'joinroom';
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/detail/${mode}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`
        }
      })
      const data = await res.json();
      if (res.ok && data.status) {
        setBoardDetail(data.Data)
        setBoardUpdate(
          {
            bd_id: data.Data?.bd_id,
            bd_project_name: data.Data?.bd_project_name,
            bd_start_date: data.Data?.bd_start_date,
            bd_end_date: data.Data?.bd_end_date,
            bd_description: data.Data?.bd_description,
          }
        )
      } else {
        router.push('/')
        console.error('Error fetching board detail:', data.message)
      }
      
    } catch (error) {
      router.push('/')
      console.error('Error fetching board detail:', error.message)
    }
  }

  const GetMemberLists = async() => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/allmember/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`
        }
      })
      const data = await res.json();
      console.log(data)
      if (res.ok && data.status) {
        setMemberLists(data.Data)
        console.log(data)
      } 
      
    } catch (error) {
      console.error('Error fetching detail:', error.message)
    }
  }


  const UpdateProjectDetail = async(e) => {
    e.preventDefault();

    const form = e.target; 
    const formData = new FormData(form); 
    const bd_project_name = formData.get('bd_project_name');
    const bd_description = formData.get('bd_description');
    const bd_end_date = formData.get('bd_end_date');
    if(!bd_project_name){
      Swal.fire({
        title: "Error",
        icon: "error",
        text: "Project name cannot be null !"
      })
    }
    if(!bd_end_date){
      Swal.fire({
        title: "Error",
        icon: "error",
        text: "Please choose end project date !"
      })
    }
    
    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/update/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.token}`
          },
          body: JSON.stringify({
            bd_project_name: bd_project_name,
            bd_description: bd_description,
            bd_end_date: bd_end_date
          })
        }
      )
      const data = await res.json();
      if (res.ok && data.status) {
        GetBoardDetail()
        Swal.fire({
          title: "Success",
          icon: "success",
          text: "Updated !"
        })
        console.log(data)
      } 
    } catch(err){
      Swal.fire({
        title: "Error",
        icon: "error",
        text: "Sorry, Cannot update you request !"
      })
      console.log('Cannot update project detail.', err.message)
    }
  }


  const MoveList = async(Process, ListID) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/move/list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          dt_id: ListID,
          dt_process: Process,
        }),
      });
      const data = await response.json();
      console.log(data);
      if (response.ok && data.status) {
        GetBoardLists()
        BroadcastUpdate()
        console.log('Task process updated successfully');
      } 
    }
    catch (error) {
      console.error('Error updating task process:', error.message);
    }
    
  }

  const UpdateTitleIncludeDelay = useRef(
    debounce(async (dt_id, title, token) => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/update/list-title/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ dt_list_title: title, dt_id: dt_id }),
        });
  
        const data = await res.json();
        if (res.ok && data.status) {
          BroadcastUpdate()
          console.error('Failed to update title:', data.message);
        }
      } catch (error) {
        console.error('Error updating title:', error.message);
      }
    }, 1500)
  ).current;

  const handleTitleChange = (e, listId) => {
    const newTitle = e.target.value;

    UpdateTitleIncludeDelay(listId, newTitle, session?.user?.token);
  };
  

  useEffect(() => {
    console.log(status)
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session?.user?.mb_username) {
      router.push('/');
    } else {
      GetBoardDetail()
      GetBoardLists()
      GetMemberLists()
    }

    
  }, [status, session?.user?.mb_username, id])

  useEffect(() => {
    if(UpdateState){
      GetMemberLists()
      GetBoardLists()
      setUpdateState(false)
    }
  
  }, [session?.user?.token, UpdateState])
  
  

  const handleDragStart = (event) => {
    setActiveItem(event.active.id)
    console.log(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromColumn = Object.keys(blocks).find((key) =>
      blocks[key].some((item) => item.dt_id === active.id)
    );
    const toColumn = over.id;

    if (!fromColumn || !toColumn || fromColumn === toColumn) return;
    const movingItem = blocks[fromColumn].find((item) => item.dt_id === active.id);

    if (!movingItem) return;
    const newBlocks = {
      ...blocks,
      [fromColumn]: blocks[fromColumn].filter((item) => item.dt_id !== active.id),
      [toColumn]: [...blocks[toColumn], { ...movingItem, dt_process: columnNameToProcess(toColumn) }],
    };
  
    setBlocks(newBlocks);
    setActiveItem(null);

    // console.log(movingItem.dt_id, columnNameToProcess(toColumn))

    MoveList(columnNameToProcess(toColumn), movingItem.dt_id)
    
  };

  const columnNameToProcess = (col) => {
    switch (col) {
      case 'ready': return '1';
      case 'inprocess': return '2';
      case 'testing': return '3';
      case 'done': return '4';
      default: return '1';
    }
  }
  

  const Droppable = ({ id, children, isOver }) => {
    const { setNodeRef, isOver: over } = useDroppable({ id })
    const active = isOver || over
  
    return (
      <>
        <div ref={setNodeRef} className={`${active && 'bg-sky-100'} rounded-2xl min-h-screen`}>
          {children}
        </div>
      </>
    )
  }

  const Draggable = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: id,
    })
  
    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    }
  
    return (
      <div ref={setNodeRef} {...attributes} {...listeners} style={style} className='cursor-grab'>
        {children}
      </div>
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    })
  );

  const DeleteList = async(ListID) => {
    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/delete/list/${ListID}`, {
        method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.token}`,
          },
      })

      const data = await res.json();
        if (res.ok && data.status) {
          GetBoardLists()
          setUpdateState(true)
          BroadcastUpdate()
          Swal.fire({
            title: 'Success !',
            icon: 'success',
            text: data.message
          })
      }
    } catch(error){
        Swal.fire({
          title: 'Error',
          icon: 'error',
          text: error.message
        })
    }
  }



  useEffect(() => {
    if (!id) return;
  
  
    const handleNotify = (data) => {
      console.log('มีการอัปเดตจากใหม่:', data.user);
      if (data.user !== session?.user?.mb_id) {
        GetBoardLists()
      }
     
    };
    socket.emit('join_board_room', { BoardID: id });
    socket.on('notify_update', handleNotify);
  
    return () => {
      socket.off('notify_update', handleNotify); 
      socket.disconnect();
    };
  }, [id, session?.user?.mb_id]);

  const BroadcastUpdate = () => {
    socket.emit('task_updated', {
      BoardID: id,
      UserID: session?.user?.mb_id
    });
  };

  
  const AddNewList = async () => {
    setButtonDisable(true)
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/newlist/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.user?.token}`
            }
        })
        const data = await res.json();
        if (res.ok && data.status) {
            GetBoardLists()
            BroadcastUpdate()
        } 
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong!',
        })
        console.error('Error creating new list:', error.message)
    }
    setButtonDisable(false)
  }

  

  return (
    <>
      <div className="bg-gradient-to-br from-green-200 via-green-100 to-green-200 min-h-screen w-screen pb-10">
        <NavBar/>
          <div className="container px-2 md:px-0 md:mx-auto flex flex-col md:flex-row justify-between min-h-full md:gap-7 bg-white rounded-2xl my-10 shadow-lg">
            
              <div className="md:w-1/5 grid grid-cols-1 p-5 rounded-2xl gap-5">
                <div className="md:w-full py-2">
                  <button onClick={() => AddNewList()} disabled={ButtonDisable} className="cursor-pointer bg-green-500 text-xl text-white font-bold px-5 py-3 rounded-2xl w-full h-20 hover:bg-green-600 transition duration-300 ease-in-out">
                      + New List
                  </button>
                  <form onSubmit={UpdateProjectDetail} className="w-full h-100 max-h-full text-green-700 bg-green-100 rounded-2xl py-3 px-3.5 mt-5">
                    <label htmlFor="bd_project_name">Project Name</label>
                    <input type="text" name='bd_project_name' defaultValue={BoardUpdate?.bd_project_name} className='w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-500 px-3 rounded-xl bg-white' />
                    <div className="mt-2">
                      <label htmlFor="bd_start_date">Start Date</label>
                      <input type="datetime-local" name='bd_start_date' defaultValue={moment(BoardUpdate?.bd_start_date).format('YYYY-MM-DDTHH:mm')} readOnly className='w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-500 px-3 rounded-xl bg-white' />
                    </div>
                    <div className="mt-2">
                      <label htmlFor="bd_end_date">End Date</label>
                      <input type="datetime-local" name='bd_end_date' defaultValue={moment(BoardUpdate?.bd_end_date).format('YYYY-MM-DDTHH:mm') || ""} min={moment(BoardUpdate?.bd_end_date).format('YYYY-MM-DDTHH:mm') || ""} className='w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-500 px-3 rounded-xl bg-white' />
                    </div>
                    <div className="mt-2">
                      <label htmlFor="bd_description">Description</label>
                      <textarea name='bd_description' defaultValue={BoardUpdate?.bd_description} className='w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-500 px-3 py- rounded-xl bg-white' />
                    </div>
                    <div className="mt-2">
                      <button type='submit' className='w-full h-10 items-center justify-center text-white bg-green-700 rounded-xl flex text-lg font-bold hover:bg-green-800 transition duration-300 ease-in-out cursor-pointer'>
                        Save
                      </button>
                    </div>
                  </form>

                  <Tags BoardID={id} UpdateState={setUpdateState} token={session?.user?.token} UpdateComponent={UpdateState}/>
                  
                  <div className='my-3'>
                    <h1 className="text-green-700 text-2xl mb-1">
                      Owner
                    </h1>
                    {
                      MemberLists?.map((member, index) => (
                        boardDetail?.mb_id == member?.mb_id && (
                          <div key={index} className="w-full h-10 py-2 px-3 rounded-full bg-green-100 flex items-center text-green-700 mb-2">
                            <AccountCircleIcon className='me-2' /> 
                            {
                              member?.mb_id == session?.user?.mb_id ? 'You' : ShortText(member?.mb_firstname + ' ' + member?.mb_lastname, 30)
                            }
                          </div>
                        )
                      ))
                    }
                    <h1 className="text-green-700 text-2xl mb-1">
                      Guest
                    </h1>
                    <InviteModal BoardID={id} BoardName={boardDetail?.bd_project_name} UpdateState={setUpdateState} token={session?.user?.token} BoardDetail={boardDetail} />
                    <MemberList MemberLists={MemberLists} BoardDetail={boardDetail} session={session}/>
                  </div>

                </div>
              </div>

              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
                <div className="md:w-4/5 flex h-screen p-5 rounded-2xl gap-5">
                  <div className="md:w-1/4 h-screen py-2">
                    <div className="bg-red-300 h-20 w-full rounded-2xl px-5 py-3 items-center justify-center flex text-red-700 mb-5">
                      <div className="text-2xl">
                        Ready
                      </div>
                    </div>
                    <Droppable id="ready">
                      {
                        blocks.ready.map((list, index) => (
                          list?.dt_process == '1' && (
                            <Draggable key={list?.dt_id} id={list?.dt_id}>
                              <div className="w-full h-75 max-h-full text-red-700 bg-red-300 rounded-2xl py-3 px-3.5 mt-5">
                                <div className="grid grid-cols-2">
                                  <label htmlFor="ReadyListName">List Title</label>
                                  <button onClick={() => DeleteList(list?.dt_id)} className='cursor-pointer text-red-700 hover:text-red-800 duration-200 ease-in-out justify-self-end items-end'>
                                    <DeleteIcon />
                                  </button>
                                </div>
                                <input type="text" defaultValue={list?.dt_list_title} onChange={(e) => handleTitleChange(e, list?.dt_id)} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-red-500 px-3 rounded-xl bg-white mb-2" />
                                <label htmlFor="ReadyStartTimestamp">Start Task Timestamp</label>
                                <input type="text" value={list?.dt_start_timestamp ? moment(list.dt_start_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-red-500 px-3 rounded-xl bg-white mb-2" />
                                <label htmlFor="ReadyLastestTimestamp">Latest Task Timestamp</label>
                                <input type="text" value={list?.dt_process_timestamp ? moment(list.dt_process_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-red-500 px-3 rounded-xl bg-white mb-2" />
                                <div className="flex">
                                  <div className="flex-initial h-8 px-2 py-3 mt-1 bg-white rounded-full flex items-center text-red-700 mb-1 text-sm">
                                    <AccountCircleIcon className='me-2' /> 
                                    {
                                      list?.mb_id == session?.user?.mb_id ? 'You' : ShortText(list?.mb_firstname + ' ' + list?.mb_lastname, 25)
                                    }
                                  </div>
                                </div>
                              </div>
                            </Draggable>
                          )
                        ))
                      }
                    </Droppable>
                  </div>
                  <div className="md:w-1/4 h-screen py-2">
                    <div className="bg-yellow-300 h-20 w-full rounded-2xl px-5 py-3 items-center justify-center flex text-yellow-700 mb-5">
                      <div className="text-2xl">
                        In Process
                      </div>
                    </div>
                    <div>
                      <Droppable id="inprocess">
                        {
                          blocks.inprocess.map((list, index) => (
                            list?.dt_process == '2' && (
                              <Draggable key={list?.dt_id} id={list?.dt_id}>
                                <div className="w-full h-75 max-h-full text-yellow-700 bg-yellow-300 rounded-2xl py-3 px-3.5 mt-5">
                                  <div className="grid grid-cols-2">
                                    <label htmlFor="InProcessListName">List Title</label>
                                    <button onClick={() => DeleteList(list?.dt_id)} className='cursor-pointer text-yellow-700 hover:text-yellow-800 duration-200 ease-in-out justify-self-end items-end'>
                                      <DeleteIcon />
                                    </button>
                                  </div>
                                  <input type="text" defaultValue={list?.dt_list_title} onChange={(e) => handleTitleChange(e, list?.dt_id)} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-yellow-500 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="InProcessStartTimestamp">Start Task Timestamp</label>
                                  <input type="text" value={list?.dt_start_timestamp ? moment(list.dt_start_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-yellow-500 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="InProcessLastestTimestamp">Latest Task Timestamp</label>
                                  <input type="text" value={list?.dt_process_timestamp ? moment(list.dt_process_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-yellow-500 px-3 rounded-xl bg-white mb-2" />
                                  <div className="flex">
                                    <div className="flex-initial h-8 px-2 py-3 mt-1 bg-white rounded-full flex items-center text-yellow-700 mb-1 text-sm">
                                      <AccountCircleIcon className='me-2' /> 
                                      {
                                        list?.mb_id == session?.user?.mb_id ? 'You' : ShortText(list?.mb_firstname + ' ' + list?.mb_lastname, 25)
                                      }
                                    </div>
                                  </div>
                                </div>
                              </Draggable>
                            )
                          ))
                        }
                      </Droppable>
                    </div>
                  </div>
                  <div className="md:w-1/4 h-screen py-2">
                    <div className="bg-green-500 h-20 w-full rounded-2xl px-5 py-3 items-center justify-center flex text-green-900 mb-5">
                      <div className="text-2xl">
                        Testing
                      </div>
                    </div>
                    <div>
                      <Droppable id="testing">
                        {
                          blocks?.testing.map((list, index) => (
                            list?.dt_process == '3' && (
                              <Draggable key={list?.dt_id} id={list?.dt_id}>
                                <div className="w-full h-75 max-h-full text-green-800 bg-green-500 rounded-2xl py-3 px-3.5 mt-5">
                                  <div className="grid grid-cols-2">
                                    <label htmlFor="TestingListName">List Title</label>
                                    <button onClick={() => DeleteList(list?.dt_id)} className='cursor-pointer text-green-800 hover:text-green-900 duration-200 ease-in-out justify-self-end items-end'>
                                      <DeleteIcon />
                                    </button>
                                  </div>
                                  <input type="text" defaultValue={list?.dt_list_title} onChange={(e) => handleTitleChange(e, list?.dt_id)} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-800 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="TestingStartTimestamp">Start Task Timestamp</label>
                                  <input type="text" value={list?.dt_start_timestamp ? moment(list.dt_start_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-800 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="TestingLastestTimestamp">Latest Task Timestamp</label>
                                  <input type="text" value={list?.dt_process_timestamp ? moment(list.dt_process_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-800 px-3 rounded-xl bg-white mb-2" />
                                  <div className="flex">
                                    <div className="flex-initial h-8 px-2 py-3 mt-1 bg-white rounded-full flex items-center text-green-800 mb-1 text-sm">
                                      <AccountCircleIcon className='me-2' /> 
                                      {
                                        list?.mb_id == session?.user?.mb_id ? 'You' : ShortText(list?.mb_firstname + ' ' + list?.mb_lastname, 25)
                                      }
                                    </div>
                                  </div>
                                </div>
                              </Draggable>
                            )
                          ))
                        }
                      </Droppable>
                    </div>
                  </div>
                  <div className="md:w-1/4 h-screen py-2">
                    <div className="bg-sky-400 h-20 w-full rounded-2xl px-5 py-3 items-center justify-center flex text-sky-900 mb-5">
                      <div className="text-2xl">
                        Done
                      </div>
                    </div>
                    <div>
                      <Droppable id="done">
                        {
                          blocks?.done.map((list, index) => (
                            list?.dt_process == '4' && (
                              <Draggable key={list?.dt_id} id={list?.dt_id}>
                                <div className="w-full h-75 max-h-full text-sky-900 bg-sky-400 rounded-2xl py-3 px-3.5 mt-5">
                                  <div className="grid grid-cols-2">
                                    <label htmlFor="InProcessListName">List Title</label>
                                    <button onClick={() => DeleteList(list?.dt_id)} className='cursor-pointer text-sky-800 hover:text-sky-900 duration-200 ease-in-out justify-self-end items-end'>
                                      <DeleteIcon />
                                    </button>
                                  </div>
                                  <input type="text" defaultValue={list?.dt_list_title} onChange={(e) => handleTitleChange(e, list?.dt_id)} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-sky-900 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="InProcessStartTimestamp">Start Task Timestamp</label>
                                  <input type="text" value={list?.dt_start_timestamp ? moment(list.dt_start_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-sky-500 px-3 rounded-xl bg-white mb-2" />
                                  <label htmlFor="InProcessLastestTimestamp">Latest Task Timestamp</label>
                                  <input type="text" value={list?.dt_process_timestamp ? moment(list.dt_process_timestamp).format('YYYY/MM/DD HH:mm') : ''} readOnly={true} className="w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-sky-500 px-3 rounded-xl bg-white mb-2" />
                                  <div className="flex">
                                    <div className="flex-initial h-8 px-2 py-3 mt-1 bg-white rounded-full flex items-center text-sky-900 mb-1 text-sm">
                                      <AccountCircleIcon className='me-2' /> 
                                      {
                                        list?.mb_id == session?.user?.mb_id ? 'You' : ShortText(list?.mb_firstname + ' ' + list?.mb_lastname, 25)
                                      }
                                    </div>
                                  </div>
                                </div>
                              </Draggable>
                            )
                          ))
                        }
                      </Droppable>
                    </div>
                  </div>
                </div>
              </DndContext>
            
          </div>
      </div>
      {/* <DnD/> */}
    </>
  )
}

export default page