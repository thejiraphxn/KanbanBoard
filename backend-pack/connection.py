import pymysql

def get_con():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="root",
        port=8889,
        db="KanbanApp",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )