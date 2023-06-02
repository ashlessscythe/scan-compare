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
    pn = properties['pn']
    if len(pn) > 0:
      self.popup_pn.text = pn
    # Any code you write here will run before the form opens.

  def label_title_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.barcode_1.focus()

  
