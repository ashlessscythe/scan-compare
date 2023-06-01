from ._anvil_designer import NewScanTemplate
from anvil import *
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from .. import globals

class NewScan(NewScanTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)

    # Any code you write here will run before the form opens.

  def text_box_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.deli event_args['sender'].text

