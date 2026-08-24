from ._anvil_designer import pin_popupTemplate
from anvil import *
import anvil.server
from .. import globals

class pin_popup(pin_popupTemplate):
  def __init__(self, **properties):
    self.init_components(**properties)

  def custom_1_pin_set(self, **event_args):
    print(f"pin is: {event_args.get('pin')}")
    if event_args.get('pin') == globals.pin_number:
      retVal = f"entered pin {event_args.get('pin')} == { globals.pin_number} "
      self.raise_event('x-close-alert', value=retVal)
    else:
      self.label_2.text = "Enter correct PIN to continue."
      print('NO MATCH')
    


