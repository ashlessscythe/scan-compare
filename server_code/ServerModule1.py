import anvil.email
import anvil.users
import anvil.files
from anvil.files import data_files
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from datetime import datetime
import anvil.server
import io
import pandas as pd

# This is a server module. It runs on the Anvil server,
# rather than in the user's browser.
#
# To allow anvil.server.call() to call functions here, we mark
# them with @anvil.server.callable.
# Here is an example - you can replace it with your own:
#
# @anvil.server.callable
# def say_hello(name):
#   print("Hello, " + name + "!")
#   return 42
#

@anvil.server.callable
def is_in_db(code):
  # col should be 0 or 1
  print(f"checking if db has {code}")
  r = app_tables.scans.search(
    q.any_of(
      qr_orig=code,
      qr_new=code
    )
  )
  return True if len(r) > 0 else False
  import anvil

@anvil.server.callable
def send_email(sid):
  user = anvil.users.get_user()['email']
  print(f"sending email to {user}")
  anvil.email.send(from_name="Tesla Scan",
                 to=user,
                 subject=f"Shipment {sid} Completed",
                 text="File attached",
                 attachments=[export_to_excel(sid)])

@anvil.server.callable
def export_to_excel(sid):
    # data here instead of byRef
    data = app_tables.session_scan.search(user=get_user())   
    df = pd.DataFrame(data)
    content = io.BytesIO()
    df.to_excel(content, index=False)
    content.seek(0, 0)
    return anvil.BlobMedia(content=content.read(), content_type="application/vnd.ms-excel", name=f"shipment_{sid}")

@anvil.server.callable
def get_link():
  items = app_tables.session_scan.client_readable(user=get_user())
  return items.search().to_csv().url

@anvil.server.callable
def get_user():
  u = anvil.users.get_user()
  if u:
    user = anvil.users.get_user()['email']
  else:
    user = 'no_login'
  return user
  
@anvil.server.callable
def add_scan(**properties):
  print(properties['scans'])
  scan = [s for s in properties['scans']]
  scan_1 = scan[0]
  scan_2 = scan[1]
  scan_3 = scan[2]
  scan_4 = scan[3]
  app_tables.scans.add_row(
    shipment=int(properties['shipment']),
    num_pallets=int(properties['count_pallets']),
    qr_orig=properties['qr_s'][0],
    qr_new=properties['qr_s'][1],
    scan_1=scan_1,
    scan_2=scan_2,
    scan_3=scan_3,
    scan_4=scan_4,
    result=properties['result'],
    created=datetime.now(),
    user_scan = get_user()
  )
  print(f"added row to db shipment: ({properties['shipment']}) result ({properties['result']})")
  
@anvil.server.callable
def session_add_row(index, valid_scans, qr_s, result):
  # check if session_db already has qr_s
  # TODO redo below to use is_in_db()
  find_old = app_tables.session_scan.search(qr_orig=qr_s[0])
  print(f"find old is {find_old}")
  find_new = app_tables.session_scan.search(qr_new=qr_s[1])
  print(f"find new is {find_new}")
  if len(find_old) > 0 or len(find_new) > 0:
    print(f"qr codes {qr_s} already exist in session db")
    return {'result': 'err', 'value': index}
  else:
    print(f"New label scanned {qr_s}")    
    app_tables.session_scan.add_row(
      index=index,
      valid_scans=valid_scans,
      result=result,
      qr_orig=qr_s[0],
      qr_new=qr_s[1],
      user=get_user()
    )
    print(f'added row to session_db {valid_scans} ')
    return {'result': 'ok', 'value': index}

@anvil.server.callable
def get_session():
  user = get_user()
  rows = app_tables.session_scan.search(user=user)
  if rows:
    return rows
  else:
    return None
  
@anvil.server.callable
def reset_session_db():
  user = get_user()
  # app_tables.session_scan.delete_all_rows()
  rows = app_tables.session_scan.search(user=user)
  print(f"deleting {len(rows)} rows from session db for user {user}")
  [r.delete() for r in rows]

