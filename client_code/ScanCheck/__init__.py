from ._anvil_designer import ScanCheckTemplate as sc
from anvil import *
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
import re
from ..import func

class ScanCheck(sc):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # Any code you write here will run before the form opens.
    # globals?
  
# return scans as dict
  def get_scan_text(self):
    s1 = self.text_box_1.text
    s2 = self.text_box_2.text
    s3 = self.text_box_3.text
    s4 = self.text_box_4.text
    s = [s1, s2, s3, s4]
    scans = [ (i, el) for i, el in enumerate(s, start=1) ]
    return scans

  def button_logout_click(self, **event_args):
    func.logout(self)
    
  def text_box_1_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_2.focus()

  def text_box_2_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_3.focus()

  def text_box_3_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_4.focus()

  def text_box_4_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_compare_click()
  
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
  
  def clear_page(self):
    self.text_box_1.text = ""
    self.text_box_2.text = ""
    self.text_box_3.text = ""
    self.text_box_4.text = ""
    self.text_box_1.focus()
    
  def startup_focus(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_1.focus()

  def button_reset_click(self, **event_args):
    """This method is called when the button is clicked"""
    c = confirm("Clear page?")
    if c:
      self.clear_page()
      self.text_box_1.focus()
  
  def button_compare_click(self, **event_args):
    """This method is called when the button is clicked"""
    if not self.check_fields_populated():
      pass
    if not self.check_fields_valid():
      pass
    else:
      with Notification("Checking Scans"):
        r = self.compare_scans()
        self.add_to_database(r)
      self.clear_page()
    
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
      pn_list = [(self.extract_pn(el)) for i, el in payload if func.is_valid(el)]

      # compare pn
      b_repeat = len(set(scans)) == 1 and len(scans) == 4
      pn_match = len(set(pn_list)) == 1 and len(pn_list) == 4 
      barcode_match = len(set(scans)) == 2 and len(scans) == 4
      
      # result to store in db
      if b_repeat:
          result = 'same barcode scanned 4 times'
      else:
        result = f'pn match = {pn_match}, barcode match = {barcode_match}'
        
      message = func.get_message(b_repeat, pn_match, barcode_match)
      alert(message)
      return result

  def add_to_database(self, result):
    scans = self.get_scan_text()
    anvil.server.call('add_scan', scans, result)

  def extract_pn(self, barcode):
    match = re.search(r"(?<=:P).+?(?=\:Q)", barcode)
    return match.group()






    


