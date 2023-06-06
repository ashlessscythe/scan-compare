from ._anvil_designer import ScanCheckTemplate as sc
from anvil import *
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
import re
from .. import test
from ..import func
from .. import globals
from ..StartNewScanPopup import StartNewScanPopup
from ..NewLabelsScanPopup import NewLabelsScanPopup

class ScanCheck(sc):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # Any code you write here will run before the form opens.
    # globals?
    if not test.TESTING_MODE:
      self.logged_in_user.text = anvil.server.call('get_user')
      self.refresh()
      # ask if new scan on startup (dismissable)
      self.startup_with_scan()
    else:
      print("testing mode....")
      print(self.button_next_click())
      
  # new scan?
  def startup_with_scan(self):
    r = self.new_scan()
    print(f"value from new_scan is {r}")
    if r:
      globals.reset_globals(self)
      self.label_shipment.text = globals.shipment
      self.label_shipment.role = 'green-shadow-label'
      self.label_pallets.text = globals.pallets
      self.label_pallets.role = 'green-shadow-label'
      self.label_msg.text = ''
    else:
      # globals not changed by this
      # TODO - figure this out
      self.label_shipment.text = "NO ACTIVE SHIPMENT"
      self.label_shipment.role = 'warning-label'
      self.label_pallets.text = "NOT VALID SCAN, TESTING USE ONLY"
      self.label_pallets.role = 'warning-label'
      self.label_msg.text = 'Please reset to start new scan.'
      self.label_msg.role = 'warning-label'
      
  def new_scan(self):
    res = alert(
      content=StartNewScanPopup(),
      title="Start New Scan?",
      large=True,
      buttons=[
        ("OK", True),
      ]
    )
    return res
    
  # refresh
  def refresh(self, **event_args):
    self.repeating_panel_1.items = anvil.server.call('get_session')
  
  def clear_scan_page(self):
    self.clear_text_boxes()
    self.text_box_original.focus()
    anvil.server.call('reset_session_db')
    self.refresh()
    
  def button_logout_click(self, **event_args):
    self.clear_scan_page()
    func.logout(self)
  
  def clear_text_boxes(self):
    self.text_box_original.text = ""
    self.text_box_new.text = ""
    self.text_box_original.focus()
    
  def startup_focus(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_original.focus()

  def button_reset_click(self, **event_args):
    """This method is called when the button is clicked"""
    c = confirm("Clear page?")
    if c:
      self.clear_scan_page()
      self.startup_with_scan()

  def check_valid(self, obj):
    r = func.is_valid(obj.text)
    # alert(r)
    return r
  
  def text_box_lost_focus(self, **event_args):
    """This method is called when the TextBox loses focus"""
    obj = event_args['sender']
    if self.check_valid(obj):
      obj.role = 'default'
      print(f'lic plate {func.extract_lic(self, obj.text)}')
      print(f'pn is {func.extract_pn(self, obj.text)}')
    else:
      obj.role = 'outlined-error'

  def button_next_click(self, **event_args):
    """This method is called when the button is clicked"""
    #check if valid
    if test.TESTING_MODE:
      scans = (
        test.qr_orig.strip(), 
        test.qr_new_match.strip()
      )
      print(f"test scans {scans}")
      scan_ok = self.check_if_valid(scans)
    else:
      scans = (
        self.text_box_original.text.strip(),
        self.text_box_new.text.strip()
      )
      print(f"non-test scans {scans}")
      scan_ok = self.check_if_valid(scans)
    # ref
    if scan_ok:
      kwargs = {
        'qr_s':scans,
        'pn':func.extract_pn(self, scans[0]),
        'shipment':globals.shipment,
        'pallets':globals.pallets
      }
      result = alert(
        content=NewLabelsScanPopup(**kwargs),
        title='Scan New Labels',
        buttons={('Done', 'done')},
        large=True
        )
      # ok if scans passed, and added to db and session
      if result == 'OK':
        # raise current pallet number
        globals.current_pallet += 1
        self.clear_text_boxes()
              
  def check_if_valid(self, scans):
    # 2 scans
    print(scans)
    b_missing = True in set([len(s) == 0 for s in scans])
    print(f'b_missing is {b_missing}')
    if b_missing:
      func.display_message(
        self,
        title='Missing Scan',
        message='Please scan 2 barcodes',
        role='warning-popup',
        bool_large = True
      )
      self.text_box_original.focus()
    else:
      # 2 different scans
      if len(set(scans)) == 1:
        func.display_message(
          self,
          title='Error',
          message = 'Same barcode scanned twice',
          role='warning-popup',
          bool_large=True
        )
        self.text_box_original.focus()
      else:
        # 2 valid scans
        if not func.is_valid(scans[0]) or not func.is_valid(scans[1]):
          func.display_message(
            self,
            title='Error',
            message='Invalid Barcode',
            role='warning-popup',
            bool_large=True
          )
          self.text_box_original.focus()
        else:
          # Extract pn
          pn1 = func.extract_pn(self, scans[0])
          pn2 = func.extract_pn(self, scans[1])
          # alert if both pn match
          if not pn1 == pn2:
            # if invalid, show err, focus textbox
            func.display_message(self, 'Invalid Scan', 'Part numbers do not match', 'warning', True)
            self.text_box_original.focus()
          else:
            return True
            
  def text_box_original_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_new.focus()

  def text_box_new_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_next_click()















    


