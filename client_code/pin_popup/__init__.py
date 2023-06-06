from ._anvil_designer import pin_popupTemplate
from anvil import *
from .. import globals

class pin_popup(pin_popupTemplate):
  def __init__(self, **properties):
    self.init_components(**properties)

  def custom_1_pin_set(self, **event_args):
    if event_args.get('pin') == globals.pin_number:
      retVal = f"entered pin {event_args.get('pin')} == { globals.pin_number} "
      self.raise_event('x-close-alert', value=retVal)
    else:
      print('NO MATCH')
    


