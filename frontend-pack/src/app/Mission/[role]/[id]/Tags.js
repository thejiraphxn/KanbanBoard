import React, {useState, useEffect} from 'react'
import { List } from '@mui/joy'
import Swal from 'sweetalert2';

const Tags = ({BoardID, UpdateState, token, UpdateComponent}) => {
    const [AllTags, setAllTags] = useState([]);
    const [TagName, setTagName] = useState('');

    const CreateTag = async() => {

        if(!TagName){
            Swal.fire({
                title: "Error",
                icon: "error",
                text: "Tag name cannot be null !"
                })
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/newtag/${BoardID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    TagName: TagName
                })
            })
            const data = await res.json();
            if (res.ok && data.status) {
                UpdateState(true)
                GetTag();
                setTagName('');
            } 
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong!',
            })
            console.error('Error creating new list:', error.message)
        }
    }

    const DeleteTag = async(TagID) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/deltag/${TagID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            })
            const data = await res.json();
            console.log(data)
            if (res.ok && data.status) {
                UpdateState(true)
                GetTag()
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

    const GetTag = async() => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/board/gettag/${BoardID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            })
            const data = await res.json();
            console.log(data)
            if (res.ok && data.status) {
                setAllTags(data.Data);
                setTagName('');
                UpdateState(true)
            } 
        } catch (error) {
            console.error('Error fetching tags :', error.message)
        }
    }


    const handleChange = (e) => {
        const input = e.target.value;
        const filtered = input.replace(/[^a-zA-Z]/g, ''); 
        setTagName(filtered);
    };

    useEffect(() => {
      GetTag();
    }, [BoardID, UpdateComponent])
    

    return (
        <>
            <div className="w-full h-60 max-h-full text-green-700 bg-green-100 rounded-2xl py-3 px-3.5 mt-5">
                <input type="text" value={TagName} onKeyDown={(e) => {if (e.key === 'Enter') {CreateTag()}}} onChange={handleChange} maxLength={15} placeholder='#tagname' className='mb-3 w-full h-10 mt-2 focus:outline-none focus:border-1 focus:border-green-500 px-3 rounded-xl bg-white' />
                <List sx={{
                    overflowY: 'auto',
                    height: {
                    sm: 50,
                    md: 100,
                    lg: 100,
                    },
                }}>
                    <div className="flex flex-wrap gap-2">
                        {
                            AllTags?.map((list, index) => (
                                <div key={index} className="font-bold py-1.5 px-3 flex flex-initial rounded-full bg-green-700 text-white">
                                    <h3 className='text-md'>
                                        {list?.bt_title}
                                    </h3>
                                    <h3 className='ms-5 text-md cursor-pointer' onClick={() => DeleteTag(list?.bt_id)}>
                                        x
                                    </h3>
                                </div>
                            ))
                        }
                    </div>
                </List>
            </div>
        </>
    )
}

export default Tags