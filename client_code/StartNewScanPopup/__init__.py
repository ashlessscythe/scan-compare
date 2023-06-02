from ._anvil_designer import StartNewScanPopupTemplate
from anvil import *
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .. import globals

class StartNewScanPopup(StartNewScanPopupTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)

    # Any code you write here will run before the form opens.

  def text_deliv_box_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.shipment = event_args['sender'].text
  
  def text_pallets_box_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.pallets = event_args['sender'].text

  def label_1_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_shipment.focus()

