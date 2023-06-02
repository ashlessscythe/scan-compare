from ._anvil_designer import NewLabelsScanPopupTemplate
from anvil import *
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .. import globals

class NewLabelsScanPopup(NewLabelsScanPopupTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # pn passed in via properties from scancheck
    pn = properties['pn']
    if len(pn) > 0:
      globals.pn = pn
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
    scans = (
      self.barcode_1.text,
      self.barcode_2.text,
      self.barcode_3.text,
      self.barcode_4.text
    )
    return scans

  def compare_scans(self):
    # get
    scans = self.get_scans()
    # check populated

    # check valid
    # check lic match
    # check pn match

    
