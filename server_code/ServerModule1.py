import anvil.email
import anvil.users
import anvil.files
from anvil.files import data_files
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from datetime import datetime
import anvil.server

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
  app_tables.session_scan.add_row(
    index=index,
    valid_scans=valid_scans,
    result=result,
    qr_orig=qr_s[0],
    qr_new=qr_s[1],
    user=get_user()
  )
  print(f'added row to session_db {valid_scans} ')
  # check if session_db already has qr_s
  # if 
  # return 'ok'

@anvil.server.callable
def get_session():
  return app_tables.session_scan.search()
  
@anvil.server.callable
def reset_session_db():
  app_tables.session_scan.delete_all_rows()