import anvil.google.auth, anvil.google.drive
from anvil.google.drive import app_files
import anvil.users
import anvil.server
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .Login import *
from .Logout import *
import re
from . import globals
from .popup_alert import popup_alert

# This is a module.
# You can define variables and functions here, and use them from any form. For example, in a top-level form:
#
#    from .ScanCheck import Module1
#
#    Module1.say_hello()
#

def add_to_database(self, delivery, scans, result):
  anvil.server.call('add_scan', delivery, scans, result)
  # add to session db
  anvil.server.call(
    'session_add_row',
    globals.idx,
    len([s for i, s in scans if func.is_valid(s)]),
    result
  )

# call below from outside func via
#     func.display_message(self, 'Test Title', 'mesg, whats the haps', 'warning', True)
def display_message(self, title, message, role, bool_large):
  alert(
    content=popup_alert(title=title, message=message, role=role),
    large=bool_large
  )

def get_message(b_repeat, b_pn, b_barcode):
  if b_repeat:
    return 'Err: Same Barcode scanned 4 times'
  if b_pn and b_barcode:
    return 'Ok: Part number matches, Barcodes are valid'
  if b_pn and not b_barcode:
    return 'Err: Part number matches, Barcodes mismatch'
  if not b_pn:
    return 'Err: Part number does not match'

def login(self, **event_args):
  user = anvil.users.login_with_form()
  if user:
    print(f'user {anvil.users.get_user()["email"]} logged in.')
    open_form('ScanCheck')
    
def logout(self, **event_args):
  """This method is called when the button is clicked"""
  anvil.users.logout()
  open_form('Logout')

def is_valid(s):
  return s.__contains__(":P")

def is_valid_lic(s):
  return s.__contains__(":Z")

def is_populated(s):
  return len(s) > 0

def extract_pn(self, barcode):
  pattern = '(?<=:P).+?(?=:Q)'
  match = re.search(pattern, barcode)
  return match.group()

def extract_lic(self, barcode):
  pattern = '(?<=(:6J|:1J)).+?(?=:P)'
  match = re.search(pattern, barcode)
  return match.group()

def extract_lic_short(self, barcode):
  pattern = '(?<=[6J|1J]).+?(?=:Z)'
  match = re.search(pattern, barcode)
  return match.group()
