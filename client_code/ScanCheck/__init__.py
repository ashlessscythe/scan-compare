from ._anvil_designer import ScanCheckTemplate as sc
from anvil import *
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
import re
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
    self.logged_in_user.text = anvil.server.call('get_user')
    self.refresh()
    # ask if new scan on startup (dismissable)
    self.startup_with_scan()
      
  # new scan?
  def startup_with_scan(self):
    r = self.new_scan()
    if r:
      globals.reset_globals(self)
      self.label_shipment.text = globals.shipment
      self.label_shipment.role = 'green-shadow-label'
      self.label_pallets.text = globals.pallets
      self.label_pallets.role = 'green-shadow-label'
    else:
      # globals not changed by this
      # TODO - figure this out
      self.label_shipment.text = "NO ACTIVE SHIPMENT"
      self.label_shipment.role = 'warning-label'
      self.label_pallets.text = "NOT VALID SCAN, TESTING USE ONLY"
      self.label_pallets.role = 'warning-label'
      
  def new_scan(self):
    res = alert(
      content=StartNewScanPopup(),
      title="Start New Scan?",
      large=True,
      buttons=[
        ("Yes", True),
        ("No", False),
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
    
  # return scans as dict
  def get_scan_text(self):
    s1 = self.text_box_1.text
    s2 = self.text_box_2.text
    s3 = self.text_box_3.text
    s4 = self.text_box_4.text
    s = [s1, s2, s3, s4]
    scans = [ (i, el) for i, el in enumerate(s, start=1) ]
    return scans
    
  def check_fields_valid(self):
    scans = self.get_scan_text()
    for i, s in scans:
      if not func.is_valid(s):
        alert(f'Scan {i} invalid')
        return False
      else:
        return True
      
  def check_fields_populated(self):
    scans = self.get_scan_text()
    s = [s for i, s in scans]    # denumerate
    # check for all blanks
    if len(set(s)) == 1 and s[0] == '':
      alert('All fields blank')
      return False
    if not s[0]:
      alert("Error: Scan 1 empty")
      self.text_box_1.focus()
      return False
    elif not s[1]:
      alert("Error: Scan 2 empty")
      # focus 2
      self.text_box_2.focus()
      return False
    elif not s[2]:
      alert("Error: Scan 3 empty")
      # focus 3
      self.text_box_3.focus()
      return False
    elif not s[3]:
      alert("Error: Scan 4 empty")
      # focus 4
      self.text_box_4.focus()
      return False
    else:
      return True
      # compare
  
  def clear_text_boxes(self):
    self.text_box_original.text = ""
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
    
  def button_compare_click(self, **event_args):
    """This method is called when the button is clicked"""
    if not self.check_fields_populated():
      return
    if not self.check_fields_valid():
      pass
    else:
      with Notification("Checking Scans"):
        r = self.compare_scans()
        func.add_to_database(
          self,
          globals.deliv,
          self.get_scan_text(), 
          r
        )
        globals.idx += 1    # increment
        self.refresh()
      self.clear_text_boxes()
    
  def compare_scans(self):
    # check if populated
    if not self.check_fields_populated():
      alert("Missing Information")
      return 'missing_info'
    # check if valid
    elif not self.check_fields_valid():
      alert("Invalid Barcodes scanned, please verify")
      return 'invalid_info'
    else:
      payload = self.get_scan_text()
      # extract scans
      scans = [el for i, el in payload]
      # extract part numbers
      pn_list = [(func.extract_pn(self, el)) for i, el in payload if func.is_valid(el)]

      # compare pn
      b_repeat = len(set(scans)) == 1 and len(scans) == 4
      pn_match = len(set(pn_list)) == 1 and len(pn_list) == 4 
      barcode_match = len(set(scans)) == 2 and len(scans) == 4
      
      # result to store in db
      if b_repeat:
          result = 'same barcode scanned 4 times'
      else:
        result = f'pn match = {pn_match}, barcode match = {barcode_match}'

      func.flash_message(
        func.get_message(
          b_repeat, pn_match, barcode_match
        )
      )
      return result

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
    barcode = self.text_box_original.text
    if func.is_valid(barcode):
      # Extract pn
      pn = func.extract_pn(self, barcode)
      alert(
        content=NewLabelsScanPopup(pn=pn),
        title='Scan New Labels',
        buttons={('Done', 'done')},
        large=True
        )
    else:
      # if invalid, show err, focus textbox
      func.display_message(self, 'Invalid Scan', 'Pallet Label Scan Invalid', 'warning', True)
      self.text_box_original.focus()

  def text_box_original_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_next_click()














    


