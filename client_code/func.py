import anvil.users
import anvil.server
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .Login import *
from .Logout import *

# This is a module.
# You can define variables and functions here, and use them from any form. For example, in a top-level form:
#
#    from .ScanCheck import Module1
#
#    Module1.say_hello()
#

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
    open_form('ScanCheck')
      
def logout(self, **event_args):
  """This method is called when the button is clicked"""
  anvil.users.logout()
  open_form('Logout')

def is_valid(s):
  return s.__contains__(":P")
