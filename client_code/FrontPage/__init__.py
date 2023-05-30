from ._anvil_designer import FrontPageTemplate
from anvil import *
import anvil.server
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables

class FrontPage(FrontPageTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)

    # Any code you write here will run before the form opens.

  def button_frontpage_click(self, **event_args):
    """This method is called when the button is clicked"""
    val = self.drop_down_frontpage.selected_value
    if not val:
      alert("Select from Drop-Down")
    elif val == 'Awesome App':
      open_form('ScanCheck')
    elif val == 'Top-Secret':
        alert('Hey, this is secret')
    else:
        alert(f"App: ({val}) doesn't exist")



