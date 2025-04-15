# import eventlet
# eventlet.monkey_patch()
from gevent import monkey
monkey.patch_all()
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import pymysql
import bcrypt
import re
import uuid
import shortuuid
import pytz
import jwt
from datetime import datetime, timezone, timedelta
from connection import get_con




app = Flask(__name__)

CORS(app,
     supports_credentials=True,
     resources={r"/api/*": {"origins": ["*"]}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  
     allow_headers=["Content-Type", "Authorization"]
)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")


JwtSignSecret = "KanbanAppSecretKeyProviderOnTheServerSide"



def verify_token(token=None):
    if token is None:
        return {
            "error": True,
            "response": jsonify({
                "status": False,
                "message": "Token is required."
            }),
            "status_code": 401
        }

    if not token or not token.startswith("Bearer "):
        return {
            "error": True,
            "response": jsonify({
                "status": False,
                "message": "Authorization header missing or invalid."
            }),
            "status_code": 401
        }

    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, JwtSignSecret, algorithms=["HS256"])
        return {
            "error": False,
            "payload": payload
        }

    except jwt.ExpiredSignatureError:
        return {
            "error": True,
            "response": jsonify({
                "status": False,
                "message": "Token expired."
            }),
            "status_code": 401
        }

    except jwt.InvalidTokenError:
        return {
            "error": True,
            "response": jsonify({
                "status": False,
                "message": "Invalid token."
            }),
            "status_code": 401
        }

def validate_registration(data):
    errors = {}

    if not re.match(r"^[A-Za-z]+$", data.get("mb_firstname", "")):
        errors["mb_firstname"] = "Firstname must contain only letters."

    if not re.match(r"^[A-Za-z]+$", data.get("mb_lastname", "")):
        errors["mb_lastname"] = "Lastname must contain only letters."

    if not re.match(r"^[A-Za-z0-9]{1,30}$", data.get("mb_username", "")):
        errors["mb_username"] = "Username must be alphanumeric and up to 30 characters."

    if not re.match(r"^\S+@\S+\.\S+$", data.get("mb_email", "")):
        errors["mb_email"] = "Invalid email format."

    if len(data.get("mb_password", "")) < 6:
        errors["mb_password"] = "Password must be at least 6 characters."

    if data.get("mb_password") != data.get("confirm_password"):
        errors["confirm_password"] = "Passwords do not match."

    return errors

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        print("Data:", data)

        errors = validate_registration(data)
        if errors:
            return jsonify({
                "status": False,
                "errors": errors,
                "message": "Validation failed"
            }), 400

        mb_username = str(data["mb_username"])
        mb_email = str(data["mb_email"])

        conn = get_con()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM kb_member WHERE mb_username = %s OR mb_email = %s", (mb_username, mb_email))
            existing = cursor.fetchone()
            if existing:
                return jsonify({
                    "status": False,
                    "error": "Username or email already exists.",
                    "message": "Email or Username already exists."
                }), 409

            hashed_pw = bcrypt.hashpw(str(data["mb_password"]).encode(), bcrypt.gensalt()).decode()

            thai_tz = pytz.timezone('Asia/Bangkok')
            now_thai = datetime.now(thai_tz)
            DateTimeNowTH = now_thai.strftime('%Y-%m-%d %H:%M:%S')

            CreateNewMember = """
                INSERT INTO kb_member (mb_id, mb_username, mb_email, mb_password, mb_firstname, mb_lastname, mb_registered_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            result = cursor.execute(CreateNewMember, (
                shortuuid.uuid()[:15],
                mb_username,
                mb_email,
                hashed_pw,
                data["mb_firstname"],
                data["mb_lastname"],
                DateTimeNowTH
            ))


        if result:
            return jsonify({
                "status": True,
                "message": "Sign up successful!"
            }), 201
        else:
            return jsonify({
                "status": False,
                "message": "Sign up failed"
            }), 500

    except Exception as e:
        print("Register error:", str(e))
        return jsonify({
            "status": False,
            "error": str(e),
            "message": "Server error"
        }), 500
    

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        username = str(data.get("mb_username"))
        password = str(data.get("mb_password"))

        if not username or not password:
            return jsonify({
                "status": False,
                "message": "Username and password are required."
            }), 400

        conn = get_con()
        with conn.cursor() as cursor:
            FindUser = """SELECT * FROM kb_member WHERE mb_username = %s LIMIT 1"""
            cursor.execute(FindUser, (username,))
            user = cursor.fetchone()

            if not user:
                return jsonify({
                    "status": False,
                    "message": "User not found."
                }), 404

            if not bcrypt.checkpw(password.encode(), user["mb_password"].encode()):
                return jsonify({
                    "status": False,
                    "message": "Invalid password."
                }), 401

            payload = {
                "mb_id": user["mb_id"],
                "mb_username": user["mb_username"],
                "mb_email": user["mb_email"],
                "mb_firstname": user["mb_firstname"],
                "mb_lastname": user["mb_lastname"],
                "exp": datetime.now(timezone.utc) + timedelta(hours=24)
            }

            token = jwt.encode(payload, JwtSignSecret, algorithm="HS256")

            return jsonify({
                "status": True,
                "message": "Login successful.",
                "token": token,
                "user": {
                    "mb_id": user["mb_id"],
                    "mb_username": user["mb_username"],
                    "mb_email": user["mb_email"],
                    "mb_firstname": user["mb_firstname"],
                    "mb_lastname": user["mb_lastname"]
                }
            }), 200

    except Exception as e:
        print("Login error:", str(e))
        return jsonify({
            "status": False,
            "message": "Server error",
            "error": str(e)
        }), 500
    

@app.route('/api/board/lists', methods=['GET'])
def get_lists():
    token = request.headers.get("Authorization")
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]


    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            print("Payload:", payload)

            conn = get_con()
            with conn.cursor() as cursor:
                GetBoardLists = """SELECT * FROM kb_board WHERE mb_id = %s ORDER BY bd_start_date DESC LIMIT 20"""
                cursor.execute(GetBoardLists, (str(payload['mb_id']),))
                lists = cursor.fetchall()

                if len(lists) == 0:
                    return jsonify({
                        "status": True,
                        "lists": []
                    }), 200
                else:
                    return jsonify({
                        "status": True,
                        "lists": lists
                    }), 200
                

        except Exception as e:
            print("Get lists error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500


@app.route('/api/board/invite_lists', methods=['GET'])
def get_invite_lists():
    token = request.headers.get("Authorization")
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]


    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]

            conn = get_con()
            with conn.cursor() as cursor:
                GetBoardLists = """
                    SELECT 
                        kb_board.bd_id AS bd_id,
                        kb_board.bd_project_name,
                        kb_board.bd_description,
                        kb_invite.iv_id,
                        kb_invite.iv_inviter,
                        kb_invite.iv_guest,
                        kb_invite.iv_invite_time
                    FROM kb_board JOIN kb_invite ON kb_board.bd_id = kb_invite.bd_id 
                    WHERE kb_invite.iv_guest = %s ORDER BY kb_invite.iv_invite_time DESC"""
                cursor.execute(GetBoardLists, (str(payload['mb_id']),))
                lists = cursor.fetchall()
                print(lists)

                if len(lists) == 0:
                    return jsonify({
                        "status": False,
                        "lists": []
                    }), 200
                else:
                    
                    return jsonify({
                        "status": True,
                        "lists": lists
                    }), 200

        except Exception as e:
            print("Get lists error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/create', methods=['GET'])
def create_board():
    token = request.headers.get("Authorization")
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401

    try:
        payload = result["payload"]
        print("Payload:", payload)
        thai_tz = pytz.timezone('Asia/Bangkok')
        now_thai = datetime.now(thai_tz)
        DateTimeNowTH = now_thai.strftime('%Y-%m-%d %H:%M:%S')
        BoardID = str(uuid.uuid4())[:29]

        conn = get_con()
        with conn.cursor() as cursor:
            CreateBoard = """
                INSERT INTO kb_board (bd_id, bd_project_name, bd_start_date, mb_id)
                VALUES (%s, %s, %s, %s)
            """
            result = cursor.execute(CreateBoard, (
                BoardID,
                "My Project",
                DateTimeNowTH,
                payload['mb_id'],
            ))

            if result:
                return jsonify({
                    "status": True,
                    "BoardID": BoardID,
                    "message": "Board created successfully."
                }), 201
            else:
                return jsonify({
                    "status": False,
                    "message": "Failed to create board."
                }), 500

            

    except Exception as e:
        print("Create board error:", str(e))
        return jsonify({
            "status": False,
            "message": "Server error",
            "error": str(e)
        }), 500

@app.route('/api/board/detail/mainroom/<string:BoardID>', methods=['GET'])
def head_board_detail(BoardID):
    token = request.headers.get("Authorization")
    board_id = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            
            if not board_id:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400

            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s AND mb_id = %s"""
                cursor.execute(SelectBoard, (board_id, payload['mb_id']))
                result = cursor.fetchone()

                print("Result:", result)

                if result:
                        
                    return jsonify({
                        "status": True,
                        "Data": result,
                        "message": "Board details retrieved successfully."
                    }), 200

                else:
                    return jsonify({
                        "status": False,
                        "Data": {},
                        "message": "Failed to find data"
                    }), 500

        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/detail/joinroom/<string:BoardID>', methods=['GET'])
def join_board_detail(BoardID):
    token = request.headers.get("Authorization")
    board_id = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not board_id:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400

            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """
                    SELECT * FROM kb_board JOIN kb_invite ON kb_board.bd_id = kb_invite.bd_id
                    WHERE kb_board.bd_id = %s AND kb_invite.iv_guest = %s
                """
                cursor.execute(SelectBoard, (board_id, payload['mb_id']))
                result = cursor.fetchone()

                if result:
                    
                        
                    return jsonify({
                        "status": True,
                        "Data": result,
                        "message": "Board details retrieved successfully."
                    }), 200
                else:
                    return jsonify({
                        "status": False,
                        "Data": {},
                        "message": "Failed to find data"
                    }), 500

        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
        

@app.route('/api/board/update/list-title/<string:BoardID>', methods=['PATCH'])
def UpdateListTitle(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not BoardID:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400

            data = request.get_json()
            print("Data:", data)

            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(SelectBoard, (BoardID))
                SelectBoardResult = cursor.fetchone()

                if SelectBoardResult:
                    UpdateListTitle = """UPDATE kb_board_detail SET dt_list_title = %s WHERE dt_id = %s"""
                    cursor.execute(UpdateListTitle, (data["dt_list_title"], data["dt_id"]))
                    return jsonify({
                        "status": True,
                        "message": "Update List title successfully."
                    }), 200
                else:
                    return jsonify({
                        "status": False,
                        "message": "Failed to find data"
                    }), 500

        except Exception as e:
            print("UpdateListTitle error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/allmember/<string:BoardID>', methods=['GET'])
def GetBoardMember(BoardID):
    token = request.headers.get("Authorization")
    board_id = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not board_id:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400
            
            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(SelectBoard, (board_id))
                SelectBoardResult = cursor.fetchone()

                if SelectBoardResult:
                    SelectInviteLists = """SELECT * FROM kb_invite WHERE bd_id = %s;"""
                    cursor.execute(SelectInviteLists, (board_id))
                    SelectInviteListsResult = cursor.fetchall()

                    if len(SelectInviteListsResult) > 0 or SelectBoardResult["mb_id"]:
                        id_list = [SelectBoardResult["mb_id"]] + [invite["iv_guest"] for invite in SelectInviteListsResult]
                        placeholders = ','.join(['%s'] * len(id_list))
                        SelectMemberDetail = f"""SELECT mb_firstname, mb_lastname, mb_id FROM kb_member WHERE mb_id IN ({placeholders})"""
                        cursor.execute(SelectMemberDetail, id_list)
                        member_lists = cursor.fetchall()

                        if len(member_lists) > 0:
                            print("Result:", result)
                            return jsonify({
                                "status": True,
                                "Data": member_lists,
                                "message": "Board details retrieved successfully."
                            }), 200
                    
        except Exception as e:
            print("GetBoardMember error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
        
@app.route('/api/board/detail/lists/<string:BoardID>', methods=['GET'])
def get_board_detail_list(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not BoardID:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400
            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(SelectBoard, (BoardID))
                SelectBoardResult = cursor.fetchall()
                if SelectBoardResult:
                    SelectBoardDetail = """
                        SELECT 
                            bd.*, 
                            m.mb_username, 
                            m.mb_firstname, 
                            m.mb_lastname
                        FROM kb_board_detail AS bd
                        JOIN kb_member AS m ON bd.mb_id = m.mb_id
                        WHERE bd.bd_id = %s"""
                    cursor.execute(SelectBoardDetail, (BoardID))
                    SelectBoardDetailResult = cursor.fetchall()
                    if SelectBoardDetailResult:
                        print("Result:", SelectBoardDetailResult)
                        return jsonify({
                            "status": True,
                            "Data": SelectBoardDetailResult,
                            "message": "Board details retrieved successfully."
                        }), 200
                    else:
                        return jsonify({
                            "status": False,
                            "Data": {},
                            "message": "Failed to find data"
                        }), 500
                else:
                    return jsonify({
                        "status": False,
                        "Data": {},
                        "message": "Failed to find data"
                    }), 500
        except Exception as e:
            print("GetBoardDetailList error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
            
@app.route('/api/board/newlist/<string:BoardID>', methods=['GET'])
def CreateListInBoard(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not BoardID:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400

            conn = get_con()
            with conn.cursor() as cursor:
                thai_tz = pytz.timezone('Asia/Bangkok')
                now_thai = datetime.now(thai_tz)
                DateTimeNowTH = now_thai.strftime('%Y-%m-%d %H:%M:%S')

                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(SelectBoard, (BoardID))
                SelectBoardResult = cursor.fetchone()

                if SelectBoardResult:
                    DTID = str(uuid.uuid4())[:29]
                    CreateListInBoard = """INSERT INTO kb_board_detail (dt_id, bd_id, dt_list_title, dt_process, dt_start_timestamp, dt_process_timestamp, mb_id) VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                    cursor.execute(CreateListInBoard, (DTID, BoardID, "New List", '1', DateTimeNowTH, DateTimeNowTH, payload['mb_id']))
                    return jsonify({
                        "status": True,
                        "message": "Create List in Board successfully."
                    }), 200
                else:
                    return jsonify({
                        "status": False,
                        "message": "Failed to find data"
                    }), 500

        except Exception as e:
            print("CreateListInBoard error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
            
        
@app.route('/api/board/move/list/<string:BoardID>', methods=['PATCH'])
def MoveListInBoard(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            if not BoardID:
                return jsonify({
                    "status": False,
                    "message": "Board ID is required."
                }), 400

            data = request.get_json()
            print("Data:", data)

            conn = get_con()
            with conn.cursor() as cursor:
                SelectBoard = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(SelectBoard, (BoardID))
                SelectBoardResult = cursor.fetchone()

                if SelectBoardResult:
                    thai_tz = pytz.timezone('Asia/Bangkok')
                    now_thai = datetime.now(thai_tz)
                    DateTimeNowTH = now_thai.strftime('%Y-%m-%d %H:%M:%S')
                    UpdateListInBoard = """UPDATE kb_board_detail SET dt_process = %s, dt_process_timestamp = %s WHERE dt_id = %s"""
                    cursor.execute(UpdateListInBoard, (data["dt_process"], DateTimeNowTH, data["dt_id"]))
                    return jsonify({
                        "status": True,
                        "message": "Move List in Board successfully."
                    }), 200
                else:
                    return jsonify({
                        "status": False,
                        "message": "Failed to find data"
                    }), 500

        except Exception as e:
            print("MoveListInBoard error:", str(e))
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/delete/list/<string:ListID>', methods=['DELETE'])
def DeleteListsByListID(ListID):
    token = request.headers.get("Authorization")
    ListID = request.view_args.get('ListID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]
            print(ListID)
            conn = get_con()
            with conn.cursor() as cursor:
                DeleteListsSQL = """DELETE FROM kb_board_detail WHERE dt_id = %s"""
                DeleteListsResult = cursor.execute(DeleteListsSQL, (ListID,))
                if DeleteListsResult:
                    return jsonify({
                        "status": True,
                        "message": "List has been deleted !"
                    }), 201
                else:
                    return jsonify({
                        "status": False,
                        "message": "Sorry, Please try again !"
                    }), 401

        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/people/<string:BoardID>', methods=['GET'])
def GetPeople(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]

            conn = get_con()
            with conn.cursor() as cursor:
                PeopleAll = {}
                PeopleAll["invited"] = []
                PeopleAll["member"] = []

                FindPeopleInvitedSQL = """SELECT iv_guest AS mb_id FROM kb_invite WHERE bd_id = %s"""
                cursor.execute(FindPeopleInvitedSQL, (BoardID,))
                FindPeopleInvitedResult = cursor.fetchall()
                if len(FindPeopleInvitedResult) > 0:
                    PeopleAll["invited"] = FindPeopleInvitedResult

                FindPeopleSQL = """SELECT mb_id, mb_firstname, mb_lastname FROM kb_member WHERE mb_id != %s ORDER BY mb_registered_date DESC"""
                cursor.execute(FindPeopleSQL, (payload["mb_id"],))
                FindPeopleResult = cursor.fetchall()
                PeopleAll["member"] = FindPeopleResult
                print(FindPeopleResult)
                if FindPeopleResult:
                    return jsonify({
                        "status": True,
                        "Data": PeopleAll
                    }), 200
                else:
                    return jsonify({
                        "status": True,
                        "Data": PeopleAll
                    }), 200

        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500

@app.route('/api/board/invite/<string:BoardID>', methods=['POST'])
def InvitePerson(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    data = request.get_json()
    result = verify_token(token)
    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]

            print(data)

            conn = get_con()
            with conn.cursor() as cursor:
                FindExistMember = """SELECT * FROM kb_member WHERE mb_id = %s"""
                cursor.execute(FindExistMember, (data["mb_id"],))
                FindExistMemberResult = cursor.fetchone()

                if FindExistMemberResult:
                    FindInviteExist = """SELECT * FROM kb_invite WHERE iv_guest = %s AND bd_id = %s"""
                    cursor.execute(FindInviteExist, (data["mb_id"], BoardID,))
                    FindInviteExistResult = cursor.fetchone()

                    if not FindInviteExistResult:
                        FindBoardExist = """SELECT * FROM kb_board WHERE bd_id = %s"""
                        cursor.execute(FindBoardExist, (BoardID,))
                        FindBoardExistResult = cursor.fetchone()

                        thai_tz = pytz.timezone('Asia/Bangkok')
                        now_thai = datetime.now(thai_tz)
                        DateTimeNowTH = now_thai.strftime('%Y-%m-%d %H:%M:%S')
                        if FindBoardExistResult:
                            InsertNewInvite = """INSERT INTO kb_invite (bd_id, iv_inviter, iv_guest, iv_invite_time) VALUES (%s, %s, %s, %s)"""
                            InviteReuslt = cursor.execute(InsertNewInvite, (BoardID, payload["mb_id"], data["mb_id"], DateTimeNowTH))
                            if InviteReuslt:
                                return jsonify({
                                    "status": True,
                                    "message": "Invited !"
                                }), 201
                            else:
                                return jsonify({
                                    "status": False,
                                    "message": "Sorry, Please try again ! 1"
                                }), 404
                        else:
                            return jsonify({
                                "status": False,
                                "message": "Sorry, Please try again ! 2"
                            }), 404
                    else:
                        return jsonify({
                            "status": False,
                            "message": "Sorry, Please try again ! 3"
                        }), 404
                else:
                    return jsonify({
                        "status": False,
                        "message": "Sorry, Please try again ! 4"
                    }), 404
        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
        

@app.route('/api/board/update/<string:BoardID>', methods=["PUT"])
def BoardUpdateDetail(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    data = request.get_json()
    result = verify_token(token)

    if not data["bd_project_name"] or data["bd_project_name"] == "" or data["bd_project_name"] == None:
        return jsonify({
            "status": False,
            "message": "Project name cannot be null"
        }), 401
    
    if not data["bd_end_date"] or data["bd_end_date"] == "" or data["bd_end_date"] == None:
        return jsonify({
            "status": False,
            "message": "Project name cannot be null"
        }), 401

    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]

            conn = get_con()
            with conn.cursor() as cursor:
                FindBoardExist = """SELECT * FROM kb_board WHERE bd_id = %s"""
                cursor.execute(FindBoardExist, (BoardID,))
                FindBoardExistResult = cursor.fetchone()

                if FindBoardExistResult:
                    UpdateBoardDetail = """UPDATE kb_board SET bd_project_name = %s, bd_description = %s, bd_end_date = %s WHERE bd_id = %s"""
                    UpdateResult = cursor.execute(UpdateBoardDetail, (data["bd_project_name"], data["bd_description"], data["bd_end_date"], BoardID,))
                    if UpdateResult:
                        return jsonify({
                            "status": True,
                            "message": "Updated"
                        }), 200
                    else:
                        return jsonify({
                            "status": False,
                            "message": "Sorry, Please try again !"
                        }), 401
                else:
                    return jsonify({
                        "status": False,
                        "message": "Sorry, Please try again !"
                    }), 401
        
        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500


@app.route('/api/board/newtag/<string:BoardID>', methods=['POST'])
def CreateNewTag(BoardID):
    token = request.headers.get("Authorization")
    BoardID = request.view_args.get('BoardID')
    data = request.get_json()
    result = verify_token(token)

    if data["TagName"] == None or data["TagName"] == "" or not data["TagName"]:
        return jsonify({
            "status": False,
            "message": "Tag name cannot be null."
        }), 401

    if result["error"]:
        return result["response"], result["status_code"]
    if not token:
        return jsonify({
            "status": False,
            "message": "Token is required."
        }), 401
    else:
        try:
            payload = result["payload"]

            conn = get_con()
            with conn.cursor() as cursor:
                InsertNewTag = """INSERT INTO kb_board_tags (bd_id, bt_title) VALUES (%s, %s)"""
                InsertNewTagResult = cursor.execute(InsertNewTag, (BoardID, data["TagName"],))
                if InsertNewTagResult:
                    return jsonify({
                        "status": True,
                        "message": "Inserted new tag !"
                    }), 200
                else:
                    return jsonify({
                        "status": False,
                        "message": "Sorry, Please try again !"
                    }), 401
        
        except Exception as e:
            return jsonify({
                "status": False,
                "message": "Server error",
                "error": str(e)
            }), 500
        
@app.route('/api/board/gettag/<string:BoardID>', methods=['GET'])
def GetAllTags(BoardID):
    try:
        conn = get_con()
        with conn.cursor() as cursor:
            GetTagSQL = """SELECT * FROM kb_board_tags WHERE bd_id = %s ORDER BY bt_id DESC"""
            cursor.execute(GetTagSQL, (BoardID,))
            GetTagResult = cursor.fetchall()
            if len(GetTagResult) > 0:
                return jsonify({
                    "status": True,
                    "Data": GetTagResult
                }), 200
            else:
                return jsonify({
                    "status": False,
                    "Data": []
                }), 401
    
    except Exception as e:
        return jsonify({
            "status": False,
            "message": "Server error",
            "error": str(e)
        }), 500


@app.route('/api/board/deltag/<string:TagID>', methods=['DELETE'])
def DeleteTag(TagID):
    try:
        conn = get_con()
        with conn.cursor() as cursor:
            DelTagSQL = """DELETE FROM kb_board_tags WHERE bt_id = %s"""
            DelTagResult = cursor.execute(DelTagSQL, (TagID,))
            
            if DelTagResult:
                return jsonify({
                    "status": True,
                    "message": "Deleted success"
                }), 201
            else:
                return jsonify({
                    "status": False,
                    "message": "Sorry, Please try again."
                }), 401
    
    except Exception as e:
        return jsonify({
            "status": False,
            "message": "Server error",
            "error": str(e)
        }), 500
    

@app.route('/api/board/delboard/<string:BoardID>', methods=['DELETE'])
def DeleteBoard(BoardID):
    try:
        conn = get_con()
        with conn.cursor() as cursor:
            DelTagSQL = """DELETE FROM kb_board WHERE bd_id = %s"""
            DelTagResult = cursor.execute(DelTagSQL, (BoardID,))
            
            if DelTagResult:
                return jsonify({
                    "status": True,
                    "message": "Deleted success"
                }), 201
            else:
                return jsonify({
                    "status": False,
                    "message": "Sorry, Please try again."
                }), 401
    
    except Exception as e:
        return jsonify({
            "status": False,
            "message": "Server error",
            "error": str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": True,
        "message": "Welcome to Kanban Board"
    }), 200


@socketio.on('join_board_room')
def handle_join_board_room(data):
    board_id = data.get('BoardID')

    if board_id:
        join_room(board_id)
        print(f"✅ User {board_id} joined room")
    else:
        print("❌ join_room: missing board_id")

@socketio.on('task_updated')
def handle_task_updated(data):
    board_id = data.get('BoardID')
    user = data.get('UserID')

    if board_id:
        emit('notify_update', {'user': user}, room=board_id)
        print(f"📢 Board {board_id} updated by {user}")
    else:
        print("❌ task_updated: missing board_id")


@socketio.on('join_notice_room')
def handle_join_notice_room(data):
    user_id = data.get('UserID')
    if user_id:
        join_room(user_id)
        print(f"✅ User {user_id} joined room")
    else:
        print("❌ join_room: missing UserID")


@socketio.on('notice_updated')
def handle_notice_updated(data):
    user = data.get('UserID')
    
    if user:
        emit('notification_user', {'user': user}, room=user)
        print(f"📢 Board {user} updated by {user}")
    else:
        print("❌ task_updated: missing board_id")

if __name__ == '__main__':
    # app.run(host="0.0.0.0", port=3001, debug=True)
    socketio.run(app, host="0.0.0.0", port=3001, debug=True)

@socketio.on('notice_updated')
def handle_notice_updated(data):
    user = data.get('UserID')
    
    if user:
        emit('notification_user', {'user': user}, room=user)
        print(f"📢 Board {user} updated by {user}")
    else:
        print("❌ task_updated: missing board_id")

if __name__ == '__main__':
    # app.run(host="0.0.0.0", port=3001, debug=True)
    socketio.run(app, host="0.0.0.0", port=3001, debug=True)
