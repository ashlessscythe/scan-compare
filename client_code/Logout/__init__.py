from ._anvil_designer import LogoutTemplate
from anvil import *
import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables

class Logout(LogoutTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)

    # Any code you write here will run before the form opens.
  def button_login_click(self, **event_args):
    user = anvil.users.login_with_form()
    if user:
      open_form('ScanCheck')