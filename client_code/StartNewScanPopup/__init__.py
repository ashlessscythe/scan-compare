from ._anvil_designer import StartNewScanPopupTemplate
from anvil import *
import anvil.google.auth, anvil.google.drive
from anvil.google.drive import app_files
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .. import globals
from .. import test
from .. import func

class StartNewScanPopup(StartNewScanPopupTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    
    # Any code you write here will run before the form opens.
    if test.TESTING_MODE:
      globals.shipment = test.shipment
      globals.pallets = test.pallets
      self.raise_event('x-close-alert', value='OK')

  def fields_blank(self, **event_args):
    if func.is_blank(self.text_box_pallets.text) or func.is_blank(self.text_box_shipment.text):
      return True
    else:
      return False
    
  def text_box_shipment_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.shipment = event_args['sender'].text
  
  def text_pallets_box_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.pallets = event_args['sender'].text

  def label_1_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_shipment.focus()

  def text_box_shipment_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_pallets.focus()

  
  def text_box_pallets_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    print(self.fields_blank())
    # GOOD EXIT
    if not self.fields_blank():
      self.raise_event('x-close-alert', value='OK')
    else:
      alert(content='Fields cannot be blank',
           large=True,
           dismissible=True, 
           role='warning-popup'
        )
      self.text_box_shipment.focus()








