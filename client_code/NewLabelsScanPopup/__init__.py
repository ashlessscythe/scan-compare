from ._anvil_designer import NewLabelsScanPopupTemplate
from anvil import *
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .. import globals
from .. import func
from .. import test

class NewLabelsScanPopup(NewLabelsScanPopupTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # pn passed in via properties from scancheck
    pn = properties['pn']
    pallets = properties['pallets']
    shipment = properties['shipment']
    qr_s = properties['qr_s']
    if len(pn) > 0:
      globals.pn = pn
      globals.shipment = shipment
      globals.pallets = pallets
      globals.qr_s = qr_s
      self.popup_pn.text = pn
    # Any code you write here will run before the form opens.

  def label_title_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.barcode_1.focus()

  def barcode_1_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.barcode_2.focus()
  
  def barcode_2_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.barcode_3.focus()
  
  def barcode_3_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.barcode_4.focus()

  def barcode_4_pressed_enter(self, **event_args):
    # start compare of lic and make sure pn matches pn
    print(f'pn is {globals.pn}')
    self.compare_scans()

  def outlined_button_1_click(self, **event_args):
    """This method is called when the button is clicked"""
    self.compare_scans()

  def get_scans(self):
    if test.TESTING_MODE:
      scans = test.lic_plates
      print('testing qr_s loaded')
    else:
      scans = (
        self.barcode_1.text.strip(), 
        self.barcode_2.text.strip(),
        self.barcode_3.text.strip(),
        self.barcode_4.text.strip()
      )
    return scans

  def compare_scans(self):
    # get
    scans = self.get_scans()
    # repeat and unique
    b_unique = False
    b_repeat = False
    if len(set(scans)) == 4:
      b_unique = True
    else:
      b_repeat = True
      
    # check populated (len 4)
    populated = [s for s in scans if func.is_populated(s)]
    # check valid (len 4)
    valid = [s for s in populated if func.is_valid_lic(s)]
    # check lic match  (len 4, match = true)
    licenses = [func.extract_lic_short(self, s) for s in valid]
    b_license_match = len(set(licenses)) == 1
    
    # notify
    with Notification(
      message='Checking Scans', 
      timeout=2, 
      style='info'
    ):
      if not b_repeat and b_unique and len(populated) == 4 and len(valid) == 4 and b_license_match:
        res = 'OK'
        role = 'default'
      else:
        res = 'ERROR'
        role = 'warning-popup'
      print(f'res is {res}')
      # build msg
      msg = ''
      if b_repeat:
        msg = 'Repeat barcodes. '
      else:
        msg = 'Barcodes are unique. '
        if not len(populated) == 4:
          msg =  'Need 4 valid scans. '
        else:
          if not len(valid) == 4:
            msg = msg + 'Invalid Barcodes scanned. '
          else:
            if not b_license_match:
              msg = msg + 'License plates mismatch. '
            else:
              msg = msg + 'License plates on new labels match. '
        print(f'Result is: {msg}')
      
      # display msg
      func.display_message(
        self,
        title='Result: ' + res,
        message=msg,
        role=role,
        bool_large=True
      ) 
      # end with Notification()
    
    # TODO shorten this function, it's getting kinda long 
    # if ok, write to db?
    if res == 'OK':
      print(f'pn is {globals.pn}')
      # bundle args into obj
      data = {'shipment':globals.shipment, 
                'count_pallets':globals.pallets,
                'pn':globals.pn,
                'scans':self.get_scans(),
                'qr_s':globals.qr_s,
                'result':msg
               }
      # add to db
      anvil.server.call('add_scan',
                       **data)
      # TODO, verify add session
      # TODO, define how current_pallet is passed
      session_res = anvil.server.call('session_add_row', 
                       index=globals.current_pallet,
                       valid_scans=len(valid),
                       qr_s = globals.qr_s,
                       result=msg)
      if session_res == 'ERR':
        func.display_message(
          self,
          title='Error Duplicate',
          message='Barcodes already scanned in this session.',
          role='warning-popup',
          bool_large=True
        )
      self.raise_event('x-close-alert', value='OK')
    
