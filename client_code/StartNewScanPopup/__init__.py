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
    self.message_pill_1.visible = False
    
    # Any code you write here will run before the form opens.
    if test.TESTING_MODE:
      globals.shipment = test.shipment
      globals.pallets = test.pallets
      self.raise_event('x-close-alert', value='OK')
  
  def label_1_show(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_shipment.focus()
    
  def fields_blank(self, **event_args):
    if func.is_blank(self.text_box_pallets.text) or func.is_blank(self.text_box_shipment.text):
      return True
    else:
      return False
    
  def text_box_shipment_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.shipment = event_args['sender'].text
    self.timer_1.interval = 5
  
  def text_pallets_box_change(self, **event_args):
    """This method is called when the text in this text box is edited"""
    globals.pallets = event_args['sender'].text

  def text_box_shipment_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_pallets.focus()

  
  def text_box_pallets_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    # print(self.fields_blank())
    # GOOD EXIT
    if not self.fields_blank():
      self.raise_event('x-close-alert', value='start')
    else:
      self.message_pill_1.visible = True
      self.message_pill_1.level = 'warning'
      self.message_pill_1.message = "fields cannot be blank"
  
      # alert(content='Fields cannot be blank',
      #      large=True,
      #      dismissible=True, 
      #      role='warning-popup'
      #   )
      self.text_box_shipment.focus()

  def timer_1_tick(self, **event_args):
    """This method is called Every [interval] seconds. Does not trigger if [interval] is 0."""
    self.message_pill_1.visible = False

  # this is the exit
  def text_box_shipment_lost_focus(self, **event_args):
    """This method is called when the TextBox loses focus"""
    # check if shipment is marked complete
    # skip if blank
    obj = event_args['sender']
    sid = obj.text
    sid_status = anvil.server.call('get_shipment_status', sid)
    
    if type(sid) != None:
      # if complete
      if sid_status == 'complete':
        self.message_pill_1.visible = True
        self.message_pill_1.message = f"Shipment {sid} already completed in database"
        # ask to view completed?
        a = alert(
          content='Shipment complete, view completed shipment?',
          buttons=[("Yes", True), ("No", False)],
          dismissible=True,
          large=False
        )
        print(f"a is {a}")
        if a == True:
          self.raise_event('x-close-alert', value='complete')
        else:
          obj.focus()
          obj.select()
      
      # if in progress
      elif sid_status == 'in_progress':        # TODO no popup on existing shipment fix...
        # pill message and load previous skids, close dialog
        alert(
          content='Shipment in progress, continue scanning',
          title=f'Shipment {sid} in progress',
          buttons=('OK', True),
          dismissible=True,
          large=True
        )
        self.message_pill_1.visible = True
        self.message_pill_1.message = f"Shipment {sid} in progress"
        self.message_pill_1.level = 'info'
        self.raise_event('x-close-alert', value='continue')
      # if exists but no status (might use this later)

        
        








