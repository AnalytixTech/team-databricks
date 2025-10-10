from session_auth import SessionAuth
from auth import Auth
ses = SessionAuth()

session_id  = ses.create_session('212d2d')
print(session_id)
print(ses.created_at)
user_id = ses.user_id_for_session_id(session_id)
print(user_id)
