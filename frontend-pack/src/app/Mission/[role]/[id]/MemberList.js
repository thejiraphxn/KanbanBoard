import React, { useEffect, useRef } from 'react';
import { List } from '@mui/joy'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ShortText from '../../../Components/ShortText/ShortText';

const MemberList = ({MemberLists, BoardDetail, session}) => {
    const containerRef = useRef();
    const animationRef = useRef();
    const directionRef = useRef(1); 

    useEffect(() => {
        if (!MemberLists) return;

        const speed = 0.5;
        const el = containerRef.current;

        const scrollStep = () => {
            if (!el) return;

            const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
            const atTop = el.scrollTop <= 0;
            if (atBottom) directionRef.current = -1;
            else if (atTop) directionRef.current = 1;
            el.scrollTop += directionRef.current * speed;
            animationRef.current = requestAnimationFrame(scrollStep);
        };

        animationRef.current = requestAnimationFrame(scrollStep);

        return () => cancelAnimationFrame(animationRef.current);
    }, [MemberLists]);

    return (
        <>
            <List ref={containerRef} sx={{
                overflowY: 'auto',
                height: {
                sm: 50,
                md: 100,
                lg: 100,
                },
            }} >
            {
            MemberLists?.map((member, index) => (
                BoardDetail?.mb_id != member?.mb_id && (
                <div key={index} className="w-full h-10 py-2 px-3 rounded-full bg-green-100 flex items-center text-green-700 mb-2">
                    <AccountCircleIcon className='me-2' /> 
                    {
                        member?.mb_id == session?.user?.mb_id ? 'You' : ShortText(member?.mb_firstname + ' ' + member?.mb_lastname, 30)
                    }
                </div>
                )
            ))
            }
        </List>
        </>
    )
}

export default MemberList