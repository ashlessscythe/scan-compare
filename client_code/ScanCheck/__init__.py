from ._anvil_designer import ScanCheckTemplate
from anvil import *
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
import re

class ScanCheck(ScanCheckTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    
    # Any code you write here will run before the form opens.
  
  def scan_one_label_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_1.focus()

  def check_fields_valid(self):
    s1 = self.text_box_1.text
    s2 = self.text_box_2.text
    if s1.__contains__(":P"):
      if s2.__contains__(":P"):
        return True
      
  def check_fields_populated(self):
    """This method is called when the TextBox loses focus"""
    s1 = self.text_box_1.text
    s2 = self.text_box_2.text
    if not s1:
      alert("Err: Scan 1 empty")
      self.text_box_1.focus()
      return False
    elif not s2:
      alert("Err: Scan 2 empty")
      # focus 2
      self.text_box_2.focus()
      return False
    else:
      return True
      # compare
  
  def clear_page(self):
    self.text_box_1.text = ""
    self.text_box_2.text = ""
    self.text_box_1.focus()

  def button_reset_click(self, **event_args):
    """This method is called when the button is clicked"""
    c = confirm("Clear page?")
    if c:
      self.clear_page()
      self.text_box_1.focus()

  def text_box_2_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_compare_click()
  
  def button_compare_click(self, **event_args):
    """This method is called when the button is clicked"""
    if not self.check_fields_populated():
      pass
    else:
      with Notification("Checking Scans"):
        r = self.compare_scans()
        self.add_to_database(r)
      self.clear_page()
    
  def compare_scans(self):
    if not self.check_fields_populated():
      alert("Missing Information")
      return 'missing_info'
    elif not self.check_fields_valid():
      alert("Invalid Barcodes scanned, please verify")
      return 'invalid_info'
    else:
      s1 = self.extract_pn(self.text_box_1.text)
      s2 = self.extract_pn(self.text_box_2.text)
      if s1 == s2:
        result = f'match {s1} and {s2}'
      else:
        result = f'no_match {s1} and {s2}'
      alert(result)
      return result

  def add_to_database(self, result):
    s1 = self.text_box_1.text
    s2 = self.text_box_2.text
    anvil.server.call('add_scan', s1, s2, result)

  def extract_pn(self, barcode):
    match = re.search(r"(?<=:P).+?(?=\:Q)", barcode)
    return match.group()

  def text_box_1_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_compare_click()
